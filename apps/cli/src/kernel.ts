/**
 * Host kernel: production campaign-ui + session-only tunnel.
 * Discord HTTP runs inside campaign-ui (same BotContext as sqlite).
 */
import { type ChildProcess, spawnSync } from 'node:child_process';
import { createWriteStream, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { registerEdgeCampaign, startEdgeSession } from '@kodranni/publish';
import { publishEdgeArchive, publishSnapshotToEdge } from './edge-publish.js';
import type { CampaignConfig } from '@kodranni/store';
import {
  applyMachineDefaults,
  campaignRuntimeLogsDir,
  ensureCampaignRuntime,
  ensureEdgeDeviceKey,
  PRODUCT_EDGE_CONTROL_URL,
  productPublicEdgeUrl,
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
  env.KODRANNI_EDGE_DEVICE_KEY = ensureEdgeDeviceKey(env);
  if (opts.bot) {
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
  /** Desk: operator only, no tunnel, Ctrl+C does not publish. */
  desk?: boolean;
}): Promise<void> {
  const { slug, repoRoot, tunnel, bot, desk = false } = opts;
  const cfg = applyMachineDefaults(opts.cfg);
  ensureCampaignRuntime(slug);
  const logsDir = campaignRuntimeLogsDir(slug);
  const { host, port } = parseBind(cfg.liveBind);
  const localUrl = `http://${host}:${port}`;
  const communityUrl = `${localUrl}/community/`;
  const startedAt = new Date().toISOString();
  const publicEdge =
    cfg.edgeUrl ?? process.env.KODRANNI_EDGE_URL?.trim() ?? productPublicEdgeUrl(cfg.slug);
  const edgeControl =
    cfg.edgeControlUrl ??
    process.env.KODRANNI_EDGE_CONTROL_URL?.trim() ??
    PRODUCT_EDGE_CONTROL_URL;

  writeLiveUrl(slug, localUrl);
  writeSessionState(slug, {
    slug,
    startedAt,
    localUrl,
    liveUrl: localUrl,
    tunnel: false,
    pids: { live: process.pid },
  });

  console.log(desk ? `Desk for ${cfg.name} (${cfg.slug})` : `Live table for ${cfg.name} (${cfg.slug})`);
  console.log(`  store: ${cfg.storePath}`);
  console.log(`  local: ${localUrl}/operator`);
  const tableUrl = `${publicEdge.replace(/\/$/, '')}/community/?campaign=${encodeURIComponent(slug)}`;
  if (slug !== 'vardmark' && slug !== 'demo' && slug !== 'play') {
    console.log(`  public: ${tableUrl}`);
  } else {
    console.log(`  public: ${publicEdge.replace(/\/$/, '')}/community/`);
  }

  ensureCampaignUiBuilt(repoRoot);
  const entry = campaignUiEntry(repoRoot);
  const liveLogPath = join(logsDir, 'live.log');
  const liveLog = createWriteStream(liveLogPath, { flags: 'a' });
  liveLog.write(`\n--- ${desk ? 'desk' : 'live'} start ${startedAt} ---\n`);

  const env = campaignUiEnv(process.env, {
    host,
    port,
    storePath: cfg.storePath,
    slug: cfg.slug,
    bot: desk ? false : bot,
    edgeControlUrl: edgeControl,
    publicBaseUrl: publicEdge,
  });
  for (const [k, v] of Object.entries(env)) {
    if (k === 'NODE_OPTIONS') continue;
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }

  let tunnelChild: ChildProcess | undefined;
  const shutdown = () => {
    killChild(tunnelChild);
  };
  let stopping = false;
  const graceful = async () => {
    if (stopping) return;
    stopping = true;
    if (!desk) {
      console.log('\n  publishing archive to the edge…');
      try {
        await publishEdgeArchive(slug, cfg, localUrl);
      } catch (e) {
        console.error(`  archive: ${e instanceof Error ? e.message : e}`);
      }
    }
    shutdown();
    writeLiveUrl(slug, localUrl);
    writeSessionState(slug, {
      slug,
      startedAt,
      localUrl,
      liveUrl: localUrl,
      tunnel: false,
    });
    liveLog.end();
    process.exit(0);
  };
  process.on('SIGINT', () => void graceful());
  process.on('SIGTERM', () => void graceful());

  try {
    await import(pathToFileURL(entry).href);
  } catch (e) {
    liveLog.write(`\n--- import failed: ${e instanceof Error ? e.message : e} ---\n`);
    liveLog.end();
    throw e;
  }

  try {
    await registerEdgeCampaign({
      edgeUrl: edgeControl,
      campaignId: slug,
      deviceKey: ensureEdgeDeviceKey(),
    });
  } catch (e) {
    console.error(`  edge register: ${e instanceof Error ? e.message : e}`);
  }

  console.log('  waiting for local UI (production)…');
  await waitForHttp(communityUrl, { timeoutMs: 90_000 });
  console.log('  local UI ready');
  notifySystemd('READY=1');

  writeSessionState(slug, {
    slug,
    startedAt,
    localUrl,
    liveUrl: localUrl,
    tunnel: false,
    pids: { live: process.pid },
  });

  if (tunnel && !desk) {
    const bin = await findCloudflared();
    const edgeUrl = edgeControl;
    if (!bin) {
      console.error(
        'cloudflared not found on PATH.\n' +
          '  Local UI is running; install cloudflared and re-run start.',
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
        const publicUrl = publicEdge.replace(/\/$/, '');
        writeLiveUrl(slug, publicUrl);
        writeSessionState(slug, {
          slug,
          startedAt,
          localUrl,
          liveUrl: publicUrl,
          tunnel: true,
          pids: { live: process.pid, tunnel: tunnelChild.pid },
        });
        console.log(`  public: ${publicUrl}`);
        console.log(`  origin: ${minted.origin} (Worker only)`);
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
          pids: { live: process.pid },
          lastError: e instanceof Error ? e.message : String(e),
        });
        console.error(
          `  tunnel failed: ${e instanceof Error ? e.message : e}\n` +
            '  Desk still running locally.',
        );
      }
    }
  }

  if (bot && !desk) {
    const liveUrlNow = readLiveUrl(slug) ?? localUrl;
    const prev = readSessionState(slug);
    writeSessionState(slug, {
      slug,
      startedAt,
      localUrl,
      liveUrl: liveUrlNow,
      tunnel: Boolean(prev?.tunnel),
      pids: {
        live: process.pid,
        tunnel: tunnelChild?.pid ?? prev?.pids?.tunnel,
        bot: process.pid,
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
      console.log('  bot: HTTP interactions in campaign-ui (no bot token on the host)');
    } catch (e) {
      console.error(`  bot: ${e instanceof Error ? e.message : e}`);
    }
  }

  await new Promise(() => {
    /* run until SIGINT / SIGTERM */
  });
}
