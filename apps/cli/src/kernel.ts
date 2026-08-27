/**
 * Host kernel: production campaign-ui + optional in-process Discord + session-only tunnel.
 */
import { type ChildProcess, spawn, spawnSync } from 'node:child_process';
import { createWriteStream, existsSync } from 'node:fs';
import { join } from 'node:path';
import { startBotRuntime } from '@kodranni/bot-runtime';
import { announceEdgeLive } from '@kodranni/publish';
import { publishEdgeArchive } from './edge-publish.js';
import type { CampaignConfig } from '@kodranni/store';
import {
  campaignRuntimeLogsDir,
  ensureCampaignRuntime,
  ensureEdgeDeviceKey,
  readLiveUrl,
  readSessionState,
  writeLiveUrl,
  writeSessionState,
} from '@kodranni/store';
import { waitForHttp } from './http.js';
import {
  findCloudflared,
  localHttpUrlFromBind,
  startCloudflaredNamedTunnel,
  startCloudflaredQuickTunnel,
  tunnelCredentialsFromConfig,
} from './tunnel.js';

export function parseBind(bind: string): { host: string; port: number } {
  const i = bind.lastIndexOf(':');
  if (i < 0) return { host: '127.0.0.1', port: 8742 };
  const host = bind.slice(0, i).trim() || '127.0.0.1';
  const port = Number(bind.slice(i + 1));
  return {
    host: host === '0.0.0.0' || host === '::' || host === 'true' ? '127.0.0.1' : host,
    port: Number.isFinite(port) ? port : 8742,
  };
}

export function campaignUiEntry(repoRoot: string): string {
  return join(repoRoot, 'apps/campaign-ui/dist/server/entry.mjs');
}

export function ensureCampaignUiBuilt(repoRoot: string): void {
  const entry = campaignUiEntry(repoRoot);
  if (existsSync(entry)) return;
  const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const r = spawnSync(npmBin, ['run', 'build:campaign-ui'], {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env,
  });
  if (r.status !== 0 || !existsSync(entry)) {
    throw new Error(
      'campaign-ui production build missing. Run: npm run build:campaign-ui',
    );
  }
}

function killChild(child: ChildProcess | undefined): void {
  if (!child || child.killed) return;
  try {
    child.kill('SIGTERM');
  } catch {
    /* already dead */
  }
}

export async function runLiveKernel(opts: {
  slug: string;
  cfg: CampaignConfig;
  repoRoot: string;
  tunnel: boolean;
  bot: boolean;
}): Promise<void> {
  const { slug, cfg, repoRoot, tunnel, bot } = opts;
  ensureCampaignRuntime(slug);
  const logsDir = campaignRuntimeLogsDir(slug);
  const { host, port } = parseBind(cfg.liveBind);
  const localUrl = `http://${host}:${port}`;
  const communityUrl = `${localUrl}/community/`;
  const startedAt = new Date().toISOString();

  writeLiveUrl(slug, localUrl);
  writeSessionState(slug, {
    slug,
    startedAt,
    localUrl,
    liveUrl: localUrl,
    tunnel: false,
  });

  console.log(`Live campaign-ui for ${cfg.slug}`);
  console.log(`  store: ${cfg.storePath}`);
  console.log(`  local: ${localUrl}`);
  console.log(`  bind:  ${host}:${port}`);

  ensureCampaignUiBuilt(repoRoot);
  const entry = campaignUiEntry(repoRoot);
  const liveLogPath = join(logsDir, 'live.log');
  const liveLog = createWriteStream(liveLogPath, { flags: 'a' });
  liveLog.write(`\n--- live start ${startedAt} (production) ---\n`);

  const ui = spawn(process.execPath, ['--experimental-sqlite', entry], {
    cwd: join(repoRoot, 'apps/campaign-ui'),
    stdio: ['inherit', 'pipe', 'pipe'],
    env: {
      ...process.env,
      HOST: host,
      PORT: String(port),
      KODRANNI_STORE_PATH: cfg.storePath,
      KODRANNI_CAMPAIGN_SLUG: cfg.slug,
      ASTRO_NODE_LOGGING: 'disabled',
      NODE_OPTIONS: [process.env.NODE_OPTIONS, '--experimental-sqlite']
        .filter(Boolean)
        .join(' '),
    },
    shell: false,
  });

  let tunnelChild: ChildProcess | undefined;
  let botHandle: { stop: () => Promise<void> } | undefined;
  let uiReady = false;

  ui.stdout?.on('data', (b: Buffer) => {
    process.stdout.write(b);
    liveLog.write(b);
  });
  ui.stderr?.on('data', (b: Buffer) => {
    process.stderr.write(b);
    liveLog.write(b);
  });

  const shutdown = () => {
    void botHandle?.stop();
    killChild(tunnelChild);
    killChild(ui);
  };
  let stopping = false;
  const graceful = async () => {
    if (stopping) return;
    stopping = true;
    console.log('\n  publishing archive to the edge…');
    try {
      await publishEdgeArchive(slug, cfg, localUrl);
    } catch (e) {
      console.error(`  archive: ${e instanceof Error ? e.message : e}`);
    }
    shutdown();
    process.exit(0);
  };
  process.on('SIGINT', () => void graceful());
  process.on('SIGTERM', () => void graceful());

  const uiExit = new Promise<number | null>((resolve, reject) => {
    ui.on('exit', (code) => resolve(code));
    ui.on('error', reject);
  });

  const earlyDeath = uiExit.then((code) => {
    if (!uiReady) {
      throw new Error(`campaign-ui exited ${code} before becoming ready`);
    }
    return code;
  });

  try {
    console.log('  waiting for local UI (production)…');
    await Promise.race([waitForHttp(communityUrl, { timeoutMs: 90_000 }), earlyDeath]);
    uiReady = true;
    console.log('  local UI ready');
  } catch (e) {
    killChild(ui);
    liveLog.write(`\n--- live failed: ${e instanceof Error ? e.message : e} ---\n`);
    liveLog.end();
    writeSessionState(slug, {
      slug,
      startedAt,
      localUrl,
      liveUrl: localUrl,
      tunnel: false,
      lastError: e instanceof Error ? e.message : e,
    });
    throw e;
  }

  writeSessionState(slug, {
    slug,
    startedAt,
    localUrl,
    liveUrl: localUrl,
    tunnel: false,
    pids: { live: ui.pid },
  });

  if (tunnel) {
    const bin = await findCloudflared();
    if (!bin) {
      console.error(
        'cloudflared not found on PATH.\n' +
          '  Local UI is running; install cloudflared and re-run with --tunnel.',
      );
    } else {
      const tunnelLog = join(logsDir, 'tunnel.log');
      const creds = tunnelCredentialsFromConfig(cfg);
      console.log(`  tunnel: starting (${bin}, mode=${creds.mode})…`);
      try {
        const t =
          creds.mode === 'named'
            ? startCloudflaredNamedTunnel({
                cloudflaredBin: bin,
                logPath: tunnelLog,
                publicUrl: creds.publicUrl!,
                token: creds.token,
                tunnelName: creds.tunnelName,
                configPath: creds.configPath,
              })
            : startCloudflaredQuickTunnel({
                cloudflaredBin: bin,
                localUrl: localHttpUrlFromBind(`${host}:${port}`),
                logPath: tunnelLog,
              });
        tunnelChild = t.child;
        const publicUrl = await Promise.race([
          t.url,
          new Promise<string>((_, rej) =>
            setTimeout(() => rej(new Error('Timed out waiting for tunnel URL (45s)')), 45_000),
          ),
        ]);
        writeLiveUrl(slug, publicUrl);
        writeSessionState(slug, {
          slug,
          startedAt,
          localUrl,
          liveUrl: publicUrl,
          tunnel: true,
          pids: { live: ui.pid, tunnel: tunnelChild.pid },
        });
        console.log(`  public: ${publicUrl}`);
        console.log('  (tunnel is live-only — session end tears it down; archive is the edge)');
        console.log(`  log:    ${tunnelLog}`);
        const edgeUrl =
          cfg.edgeControlUrl ??
          process.env.KODRANNI_EDGE_CONTROL_URL?.trim() ??
          cfg.edgeUrl ??
          process.env.KODRANNI_EDGE_URL?.trim();
        if (edgeUrl && publicUrl.startsWith('https://')) {
          try {
            await announceEdgeLive({
              edgeUrl,
              campaignId: slug,
              deviceKey: ensureEdgeDeviceKey(),
              origin: publicUrl,
            });
            console.log(`  edge: origin → tunnel (${edgeUrl})`);
          } catch (e) {
            console.error(`  edge origin: ${e instanceof Error ? e.message : e}`);
          }
        }
      } catch (e) {
        killChild(tunnelChild);
        tunnelChild = undefined;
        writeSessionState(slug, {
          slug,
          startedAt,
          localUrl,
          liveUrl: localUrl,
          tunnel: false,
          pids: { live: ui.pid },
          lastError: e instanceof Error ? e.message : String(e),
        });
        console.error(
          `  tunnel failed: ${e instanceof Error ? e.message : e}\n` +
            '  Local UI still running.',
        );
      }
    }
  }

  if (bot) {
    if (!process.env.DISCORD_BOT_TOKEN || !process.env.DISCORD_GUILD_ID) {
      console.error(
        '  bot: skipped — Discord not ready (secrets discord-botToken + discord-serverID).',
      );
    } else {
      const liveUrlNow = readLiveUrl(slug) ?? localUrl;
      process.env.KODRANNI_STORE_PATH = cfg.storePath;
      process.env.KODRANNI_CAMPAIGN_SLUG = cfg.slug;
      process.env.KODRANNI_LIVE_BASE_URL = liveUrlNow;
      if (cfg.edgeUrl) process.env.KODRANNI_PUBLIC_BASE_URL = cfg.edgeUrl;
      console.log('  bot: starting Discord runtime in-process…');
      try {
        botHandle = await startBotRuntime();
        const prev = readSessionState(slug);
        writeSessionState(slug, {
          slug,
          startedAt,
          localUrl,
          liveUrl: liveUrlNow,
          tunnel: Boolean(prev?.tunnel),
          pids: {
            live: ui.pid,
            tunnel: tunnelChild?.pid ?? prev?.pids?.tunnel,
            bot: process.pid,
          },
        });
        console.log('  bot: in-process');
      } catch (e) {
        console.error(`  bot: ${e instanceof Error ? e.message : e}`);
      }
    }
  }

  const code = await uiExit;
  await botHandle?.stop();
  killChild(tunnelChild);
  liveLog.write(`\n--- live exit code=${code} ---\n`);
  liveLog.end();
  writeLiveUrl(slug, localUrl);
  writeSessionState(slug, {
    slug,
    startedAt,
    localUrl,
    liveUrl: localUrl,
    tunnel: false,
    lastError: code && code !== 0 ? `campaign-ui exited ${code}` : undefined,
  });
  if (code !== 0 && code !== null) {
    throw new Error(`campaign-ui exited ${code}`);
  }
}
