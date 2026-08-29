/**
 * Host kernel: production campaign-ui + session-only tunnel.
 * Discord HTTP runs inside campaign-ui (same BotContext as sqlite).
 */
import { type ChildProcess, spawn, spawnSync } from 'node:child_process';
import { createWriteStream, existsSync } from 'node:fs';
import { join } from 'node:path';
import { startEdgeSession } from '@kodranni/publish';
import { publishEdgeArchive, publishSnapshotToEdge } from './edge-publish.js';
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
import { notifySystemd } from './linux-notify.js';
import {
  findCloudflared,
  startCloudflaredTokenTunnel,
} from './tunnel.js';

export function campaignUiEnv(
  base: NodeJS.ProcessEnv,
  opts: {
    host: string;
    port: number;
    storePath: string;
    slug: string;
    bot: boolean;
    edgeControlUrl?: string;
    publicBaseUrl?: string;
  },
): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    ...base,
    HOST: opts.host,
    PORT: String(opts.port),
    KODRANNI_STORE_PATH: opts.storePath,
    KODRANNI_CAMPAIGN_SLUG: opts.slug,
    ASTRO_NODE_LOGGING: 'disabled',
    NODE_OPTIONS: [base.NODE_OPTIONS, '--experimental-sqlite'].filter(Boolean).join(' '),
  };
  if (opts.edgeControlUrl) env.KODRANNI_EDGE_CONTROL_URL = opts.edgeControlUrl;
  if (opts.publicBaseUrl) {
    env.KODRANNI_PUBLIC_BASE_URL = opts.publicBaseUrl;
    env.KODRANNI_LIVE_BASE_URL = opts.publicBaseUrl;
  }
  if (opts.bot) {
    env.KODRANNI_EDGE_DEVICE_KEY = ensureEdgeDeviceKey(env);
    if (base.KODRANNI_DISCORD_GATEWAY === '1') {
      env.KODRANNI_DISCORD_GATEWAY = '1';
    } else {
      env.KODRANNI_DISCORD_HTTP = '1';
      delete env.DISCORD_BOT_TOKEN;
    }
  }
  return env;
}

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
  if (!child || child.pid == null) return;
  try {
    process.kill(-child.pid, 'SIGTERM');
  } catch {
    try {
      child.kill('SIGTERM');
    } catch {
      /* already dead */
    }
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

  const edgeControl =
    cfg.edgeControlUrl ??
    process.env.KODRANNI_EDGE_CONTROL_URL?.trim() ??
    cfg.edgeUrl ??
    process.env.KODRANNI_EDGE_URL?.trim();

  const ui = spawn(process.execPath, ['--experimental-sqlite', entry], {
    cwd: join(repoRoot, 'apps/campaign-ui'),
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: campaignUiEnv(process.env, {
      host,
      port,
      storePath: cfg.storePath,
      slug: cfg.slug,
      bot,
      edgeControlUrl: edgeControl,
      publicBaseUrl: cfg.edgeUrl ?? cfg.publicBaseUrl,
    }),
    shell: false,
  });

  let tunnelChild: ChildProcess | undefined;
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
    await new Promise((r) => setTimeout(r, 300));
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
    notifySystemd('READY=1');
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
    const edgeUrl = edgeControl;
    if (!bin) {
      console.error(
        'cloudflared not found on PATH.\n' +
          '  Local UI is running; install cloudflared and re-run with --tunnel.',
      );
    } else if (!edgeUrl) {
      console.error('  tunnel: skipped — set edge_control_url so the Worker can mint a token.');
    } else {
      const tunnelLog = join(logsDir, 'tunnel.log');
      console.log(`  tunnel: minting from edge (${edgeUrl})…`);
      try {
        await publishSnapshotToEdge(slug, cfg);
        const minted = await startEdgeSession({
          edgeUrl,
          campaignId: slug,
          deviceKey: ensureEdgeDeviceKey(),
          guildId: process.env.DISCORD_GUILD_ID?.trim(),
        });
        const t = startCloudflaredTokenTunnel({
          cloudflaredBin: bin,
          token: minted.token,
          logPath: tunnelLog,
        });
        tunnelChild = t.child;
        const publicUrl = (cfg.edgeUrl ?? edgeUrl).replace(/\/$/, '');
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
        console.log(`  origin: ${minted.origin} (Worker only)`);
        console.log('  (tunnel is live-only — session end tears it down; archive is the edge)');
        console.log(`  log:    ${tunnelLog}`);
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
    const liveUrlNow = readLiveUrl(slug) ?? localUrl;
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
        bot: ui.pid,
      },
    });
    try {
      const boot = await fetch(`${localUrl}/internal/discord/boot`, {
        method: 'GET',
        headers: { origin: localUrl, accept: 'application/json' },
        signal: AbortSignal.timeout(15_000),
      });
      if (!boot.ok) {
        const text = await boot.text().catch(() => '');
        throw new Error(`HTTP ${boot.status} ${text.slice(0, 120)}`);
      }
      if (process.env.KODRANNI_DISCORD_GATEWAY === '1') {
        console.log('  bot: gateway hatch in campaign-ui (KODRANNI_DISCORD_GATEWAY=1)');
      } else {
        console.log('  bot: HTTP interactions in campaign-ui (no bot token on the host)');
      }
    } catch (e) {
      console.error(`  bot: ${e instanceof Error ? e.message : e}`);
    }
  }

  const code = await uiExit;
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
