import { type ChildProcess, spawn } from 'node:child_process';
import { openSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  campaignRuntimeLogsDir,
  ensureCampaignRuntime,
  readLiveUrl,
  readSessionState,
  writeLiveUrl,
  writeSessionState,
  type CampaignConfig,
} from '@kodranni/store';
import { probeHttp, processAlive } from './http.js';
import { localHttpUrlFromBind } from './tunnel.js';

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
    if (state.lastError) console.log(`  lastError: ${state.lastError}`);
  } else {
    console.log('  (no session.json)');
  }
}

/**
 * Detach: spawn `live [--tunnel]` as a background process.
 * Foreground: return false so main runs live inline.
 */
export async function sessionStart(opts: {
  slug: string;
  cfg: CampaignConfig;
  tunnel: boolean;
  detach: boolean;
  force: boolean;
}): Promise<'detached' | 'foreground'> {
  const { slug, cfg, tunnel, detach, force } = opts;
  const prev = readSessionState(slug);
  if (prev?.pids?.live && processAlive(prev.pids.live) && !force) {
    throw new Error(
      `session already running for ${slug} (live pid ${prev.pids.live}). Use --force or session end.`,
    );
  }
  if (force && prev?.pids) {
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
  console.log(`  log: ${logPath}`);
  console.log(`  status: npm run kodranni -- session status --slug ${slug}`);
  console.log(`  end:    npm run kodranni -- session end --slug ${slug}`);

  // Give live a moment to bind and (optionally) open the tunnel
  await new Promise((r) => setTimeout(r, 4000));
  const url = readLiveUrl(slug);
  if (url) console.log(`  live:   ${url}`);
  return 'detached';
}

export async function sessionEnd(slug: string, cfg: CampaignConfig): Promise<void> {
  const state = readSessionState(slug);
  const localUrl = localHttpUrlFromBind(cfg.liveBind);
  if (!state?.pids?.live && !state?.pids?.tunnel) {
    console.log(`No running session pids for ${slug}`);
    writeLiveUrl(slug, localUrl);
    writeSessionState(slug, {
      slug,
      localUrl,
      liveUrl: localUrl,
      tunnel: false,
    });
    return;
  }
  console.log(`Ending session ${slug}…`);
  // publish.flush() when packages/publish exists
  killPid(state.pids?.tunnel);
  killPid(state.pids?.live);
  await new Promise((r) => setTimeout(r, 600));
  writeLiveUrl(slug, localUrl);
  writeSessionState(slug, {
    slug,
    startedAt: state.startedAt,
    localUrl,
    liveUrl: localUrl,
    tunnel: false,
  });
  console.log('  stopped tunnel/live (if pids were alive)');
  console.log('  live.url reset to local');
  console.log('  (publish on session end — not yet wired)');
}

export type { ChildProcess };
