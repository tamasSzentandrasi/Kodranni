import { type ChildProcess, spawn } from 'node:child_process';
import { openSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { publishCampaignArchive } from '@kodranni/publish';
import {
  campaignArchiveDir,
  campaignRuntimeLogsDir,
  ensureCampaignRuntime,
  readLiveUrl,
  readSessionState,
  resolveTunnelMode,
  writeLiveUrl,
  writeSessionState,
  type CampaignConfig,
} from '@kodranni/store';
import { spawnArchiveServer } from './archive-server.js';
import { probeHttp, processAlive } from './http.js';
import {
  findCloudflared,
  localHttpUrlFromBind,
  startCloudflaredNamedTunnel,
  tunnelCredentialsFromConfig,
} from './tunnel.js';

function resolveCliMain(): string {
  return join(dirname(fileURLToPath(import.meta.url)), 'main.ts');
}

function resolveRepoRoot(): string {
  if (process.env.KODRANNI_REPO) {
    return process.env.KODRANNI_REPO;
  }
  return join(dirname(fileURLToPath(import.meta.url)), '../../..');
}

function killPid(pid: number | undefined): void {
  if (pid == null || pid <= 0) return;
  try {
    process.kill(pid, 'SIGTERM');
  } catch {
    /* already dead */
  }
}

export async function printSessionStatus(slug: string, cfg: CampaignConfig): Promise<void> {
  const state = readSessionState(slug);
  const localUrl = localHttpUrlFromBind(cfg.liveBind);
  const liveUrl = readLiveUrl(slug) ?? localUrl;
  const communityLocal = localUrl.replace(/\/$/, '') + '/community/';
  const local = await probeHttp(communityLocal);
  let publicOk = false;
  let publicDetail = 'n/a';
  if (liveUrl && liveUrl !== localUrl) {
    const p = await probeHttp(liveUrl.replace(/\/$/, '') + '/community/');
    publicOk = p.ok;
    publicDetail = p.detail;
  }

  console.log(`Session · ${slug}`);
  console.log(`  local:   ${localUrl} · ${local.ok ? local.detail : 'DOWN ' + local.detail}`);
  if (liveUrl !== localUrl) {
    console.log(
      `  public:  ${liveUrl} · ${publicOk ? publicDetail : 'DOWN ' + publicDetail}`,
    );
  }
  if (state) {
    console.log(`  started: ${state.startedAt ?? '—'}`);
    console.log(
      `  live pid:   ${state.pids?.live ?? '—'} ${processAlive(state.pids?.live) ? '(alive)' : '(dead)'}`,
    );
    console.log(
      `  tunnel pid: ${state.pids?.tunnel ?? '—'} ${processAlive(state.pids?.tunnel) ? '(alive)' : '(dead)'}`,
    );
    console.log(
      `  bot pid:    ${state.pids?.bot ?? '—'} ${processAlive(state.pids?.bot) ? '(alive)' : '(dead)'}`,
    );
    if (state.lastError) console.log(`  lastError: ${state.lastError}`);
  } else {
    console.log('  (no session.json)');
  }
}

/**
 * Detach: spawn `live [--tunnel] [--bot]` as a background supervisor process.
 * Foreground: return so main runs live (+ optional bot) inline.
 */
export async function sessionStart(opts: {
  slug: string;
  cfg: CampaignConfig;
  tunnel: boolean;
  bot: boolean;
  detach: boolean;
  force: boolean;
}): Promise<'detached' | 'foreground'> {
  const { slug, cfg, tunnel, bot, detach, force } = opts;
  const prev = readSessionState(slug);
  if (prev?.pids?.live && processAlive(prev.pids.live) && !force) {
    throw new Error(
      `session already running for ${slug} (live pid ${prev.pids.live}). Use --force or session end.`,
    );
  }
  if (force && prev?.pids) {
    killPid(prev.pids.bot);
    killPid(prev.pids.archive);
    killPid(prev.pids.tunnel);
    killPid(prev.pids.live);
    await new Promise((r) => setTimeout(r, 400));
  }

  ensureCampaignRuntime(slug);
  const logsDir = campaignRuntimeLogsDir(slug);

  if (!detach) {
    return 'foreground';
  }

  const repoRoot = resolveRepoRoot();
  const logPath = join(logsDir, 'session-supervisor.log');
  const fd = openSync(logPath, 'a');
  const args = [
    '--experimental-sqlite',
    '--import',
    'tsx',
    resolveCliMain(),
    'live',
    '--slug',
    slug,
  ];
  if (tunnel) args.push('--tunnel');
  if (bot) args.push('--bot');

  const child = spawn(process.execPath, args, {
    cwd: repoRoot,
    detached: true,
    stdio: ['ignore', fd, fd],
    env: { ...process.env },
    shell: false,
  });
  child.unref();

  writeSessionState(slug, {
    slug,
    startedAt: new Date().toISOString(),
    localUrl: localHttpUrlFromBind(cfg.liveBind),
    liveUrl: localHttpUrlFromBind(cfg.liveBind),
    tunnel,
    pids: { live: child.pid },
  });

  console.log(`Session started in background for ${slug}`);
  console.log(`  supervisor pid: ${child.pid}`);
  console.log(`  flags:   ${[tunnel && 'tunnel', bot && 'bot'].filter(Boolean).join('+') || 'live-only'}`);
  console.log(`  log: ${logPath}`);
  console.log(`  status: npm run kodranni -- session status --slug ${slug}`);
  console.log(`  end:    npm run kodranni -- session end --slug ${slug}`);

  // Give live a moment to bind and (optionally) open the tunnel / bot
  await new Promise((r) => setTimeout(r, bot || tunnel ? 6000 : 4000));
  const url = readLiveUrl(slug);
  if (url) console.log(`  live:   ${url}`);
  const st = readSessionState(slug);
  if (st?.pids?.bot) console.log(`  bot pid: ${st.pids.bot}`);
  return 'detached';
}

export async function sessionEnd(
  slug: string,
  cfg: CampaignConfig,
  opts?: { parkHostname?: boolean },
): Promise<void> {
  const state = readSessionState(slug);
  const localUrl = localHttpUrlFromBind(cfg.liveBind);
  const park =
    opts?.parkHostname ??
    (resolveTunnelMode(cfg) === 'named' && Boolean(cfg.tunnelHostname || cfg.liveBaseUrl?.startsWith('https://')));

  if (!state?.pids?.live && !state?.pids?.tunnel && !state?.pids?.bot && !state?.pids?.archive) {
    console.log(`No running session pids for ${slug} — publishing archive only`);
  } else {
    console.log(`Ending session ${slug}…`);
  }
  killPid(state?.pids?.bot);
  killPid(state?.pids?.live);
  // Keep tunnel briefly if we will re-point; else kill now
  if (!park) killPid(state?.pids?.tunnel);
  await new Promise((r) => setTimeout(r, 600));

  let pub;
  try {
    pub = publishCampaignArchive({
      slug,
      storePath: cfg.storePath,
      publicHost: cfg.tunnelHostname ?? (cfg.liveBaseUrl.startsWith('https://') ? cfg.liveBaseUrl : undefined),
    });
    console.log(`  archive: ${pub.dir} (${pub.characterCount} characters)`);
  } catch (e) {
    console.error(`  archive publish failed: ${e instanceof Error ? e.message : e}`);
  }

  if (!park) {
    killPid(state?.pids?.tunnel);
    killPid(state?.pids?.archive);
    writeLiveUrl(slug, localUrl);
    writeSessionState(slug, {
      slug,
      startedAt: state?.startedAt,
      localUrl,
      liveUrl: localUrl,
      tunnel: false,
      parked: false,
    });
    console.log('  stopped live/tunnel; hostname not parked');
    return;
  }

  // Same public hostname: serve archive on live_bind and keep/restart named tunnel
  killPid(state?.pids?.archive);
  // Ensure Astro has released the bind port before parking
  await new Promise((r) => setTimeout(r, 1200));

  const logsDir = campaignRuntimeLogsDir(slug);
  const archiveDir = campaignArchiveDir(slug);
  const archiveMain = join(dirname(fileURLToPath(import.meta.url)), 'archive-serve-main.ts');
  let archiveChild;
  try {
    archiveChild = spawnArchiveServer({
      archiveDir,
      bind: cfg.liveBind,
      logPath: join(logsDir, 'archive.log'),
      nodeScriptPath: archiveMain,
    });
  } catch (e) {
    console.error(`  archive server failed: ${e instanceof Error ? e.message : e}`);
    writeLiveUrl(slug, localUrl);
    writeSessionState(slug, {
      slug,
      startedAt: state?.startedAt,
      localUrl,
      liveUrl: localUrl,
      tunnel: false,
      parked: false,
    });
    return;
  }
  await new Promise((r) => setTimeout(r, 400));

  let tunnelPid = state?.pids?.tunnel;
  if (!processAlive(tunnelPid)) {
    killPid(tunnelPid);
    tunnelPid = undefined;
    const bin = await findCloudflared();
    const creds = tunnelCredentialsFromConfig(cfg);
    if (bin && creds.mode === 'named' && creds.publicUrl) {
      console.log('  restarting named tunnel toward archive…');
      try {
        const tunnel = startCloudflaredNamedTunnel({
          cloudflaredBin: bin,
          logPath: join(logsDir, 'tunnel.log'),
          publicUrl: creds.publicUrl,
          token: creds.token,
          tunnelName: creds.tunnelName,
          configPath: creds.configPath,
        });
        tunnelPid = tunnel.child.pid;
        await Promise.race([
          tunnel.url,
          new Promise((_, rej) => setTimeout(() => rej(new Error('tunnel timeout')), 12_000)),
        ]);
      } catch (e) {
        console.error(`  tunnel: ${e instanceof Error ? e.message : e}`);
      }
    } else {
      console.log('  (no named tunnel creds — archive is local only on', localUrl, ')');
    }
  } else {
    console.log('  tunnel kept alive → now serving archive on same bind');
  }

  const publicUrl =
    (cfg.tunnelHostname?.startsWith('http')
      ? cfg.tunnelHostname
      : cfg.tunnelHostname
        ? `https://${cfg.tunnelHostname}`
        : undefined) ??
    (cfg.liveBaseUrl.startsWith('https://') ? cfg.liveBaseUrl : localUrl);

  writeLiveUrl(slug, publicUrl.replace(/\/$/, ''));
  writeSessionState(slug, {
    slug,
    startedAt: state?.startedAt,
    localUrl,
    liveUrl: publicUrl.replace(/\/$/, ''),
    tunnel: Boolean(tunnelPid),
    parked: true,
    pids: { archive: archiveChild.pid, tunnel: tunnelPid },
  });
  console.log(`  parked: ${publicUrl.replace(/\/$/, '')}/ → archive`);
  console.log('  try /community/ and /characters/ on that host');
  console.log('  session start --force will replace archive with live UI again');
}

export type { ChildProcess };
