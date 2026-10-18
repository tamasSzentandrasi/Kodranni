/**
 * Go Live and End Session for the hall that is already running.
 * A second Go Live while the tunnel process is up does nothing.
 * End Session publishes even when the night is dark, then leaves the hall up.
 */
import { join } from 'node:path';
import { startEdgeSession } from '@kodranni/publish';
import {
  campaignRuntimeLogsDir,
  ensureCampaignRuntime,
  productPublicEdgeUrl,
  PRODUCT_EDGE_CONTROL_URL,
  readSessionState,
  writeLiveUrl,
  writeSessionState,
  ensureEdgeDeviceKey,
  type CampaignConfig,
  type SessionState,
} from '@kodranni/store';
import { clearEdgeOrigin, publishSnapshotToEdge } from './edge-publish.js';
import { processAlive } from './http.js';
import { findCloudflared, startCloudflaredTokenTunnel } from './tunnel.js';

export interface NightIo {
  publish(slug: string, cfg: CampaignConfig): Promise<void>;
  clearOrigin(slug: string, cfg: CampaignConfig): Promise<void>;
  mint(opts: {
    edgeUrl: string;
    campaignId: string;
    deviceKey: string;
    guildId?: string;
  }): Promise<{ origin: string; token: string; tunnelId: string }>;
  findCloudflared(): Promise<string | undefined>;
  startTunnel(opts: { bin: string; token: string; logPath: string }): { pid: number };
  bootDiscord(localUrl: string): Promise<void>;
  alive(pid: number | undefined): boolean;
  kill(pid: number | undefined): void;
  deviceKey(): string;
  edgeControl(cfg: CampaignConfig): string;
  guildId(cfg: CampaignConfig): string | undefined;
  localUrl(cfg: CampaignConfig, state: SessionState | undefined): string;
  logPath(slug: string): string;
}

let tail: Promise<void> = Promise.resolve();

function exclusive<T>(fn: () => Promise<T>): Promise<T> {
  const run = tail.then(fn, fn);
  tail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function stopTunnelPid(pid: number | undefined, except?: number): void {
  if (pid == null || pid <= 0 || pid === except) return;
  try {
    process.kill(-pid, 'SIGTERM');
  } catch {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      /* already dead */
    }
  }
}

export function productionNightIo(localUrl: string): NightIo {
  return {
    publish: publishSnapshotToEdge,
    clearOrigin: clearEdgeOrigin,
    mint: startEdgeSession,
    findCloudflared,
    startTunnel(opts) {
      const handle = startCloudflaredTokenTunnel({
        cloudflaredBin: opts.bin,
        token: opts.token,
        logPath: opts.logPath,
      });
      if (handle.child.pid == null) throw new Error('cloudflared did not start');
      return { pid: handle.child.pid };
    },
    async bootDiscord(url) {
      if (process.env.KODRANNI_DISCORD_GATEWAY !== '1') {
        process.env.KODRANNI_DISCORD_HTTP = '1';
        delete process.env.DISCORD_BOT_TOKEN;
      }
      const boot = await fetch(`${url}/internal/discord/boot`, {
        method: 'GET',
        headers: { origin: url, accept: 'application/json' },
        signal: AbortSignal.timeout(15_000),
      });
      if (!boot.ok) {
        const text = await boot.text().catch(() => '');
        throw new Error(`HTTP ${boot.status} ${text.slice(0, 120)}`);
      }
    },
    alive: processAlive,
    kill: stopTunnelPid,
    deviceKey: () => ensureEdgeDeviceKey(),
    edgeControl(cfg) {
      return (
        cfg.edgeControlUrl ??
        process.env.KODRANNI_EDGE_CONTROL_URL?.trim() ??
        PRODUCT_EDGE_CONTROL_URL
      );
    },
    guildId(cfg) {
      return cfg.discordGuildId ?? process.env.DISCORD_GUILD_ID?.trim();
    },
    localUrl(_cfg, state) {
      return state?.localUrl ?? localUrl;
    },
    logPath(slug) {
      return join(campaignRuntimeLogsDir(slug), 'tunnel.log');
    },
  };
}

function remember(
  slug: string,
  state: SessionState | undefined,
  patch: Partial<SessionState> & Pick<SessionState, 'liveUrl' | 'tunnel'>,
): void {
  writeSessionState(slug, {
    slug,
    startedAt: state?.startedAt,
    localUrl: patch.localUrl ?? state?.localUrl,
    liveUrl: patch.liveUrl,
    tunnel: patch.tunnel,
    parked: false,
    pids: patch.pids,
    lastError: patch.lastError,
  });
}

/** Publish, mint, and start cloudflared. No-op when that child is already up. */
export function openNight(slug: string, cfg: CampaignConfig, io: NightIo): Promise<{ already: boolean }> {
  return exclusive(async () => {
    const state = readSessionState(slug);
    if (state?.tunnel && io.alive(state.pids?.tunnel)) return { already: true };

    const bin = await io.findCloudflared();
    if (!bin) throw new Error('cloudflared not found on PATH');
    const edgeUrl = io.edgeControl(cfg);
    if (!edgeUrl) throw new Error('no edge control url');

    await io.publish(slug, cfg);
    let minted: { origin: string; token: string; tunnelId: string };
    try {
      minted = await io.mint({
        edgeUrl,
        campaignId: slug,
        deviceKey: io.deviceKey(),
        guildId: io.guildId(cfg),
      });
    } catch (e) {
      remember(slug, state, {
        liveUrl: state?.liveUrl ?? io.localUrl(cfg, state),
        tunnel: false,
        pids: { live: state?.pids?.live ?? process.pid },
        lastError: e instanceof Error ? e.message : String(e),
      });
      throw e;
    }

    let pid: number;
    try {
      ensureCampaignRuntime(slug);
      pid = io.startTunnel({ bin, token: minted.token, logPath: io.logPath(slug) }).pid;
    } catch (e) {
      try {
        await io.clearOrigin(slug, cfg);
      } catch (clearErr) {
        console.error(`  edge: ${clearErr instanceof Error ? clearErr.message : clearErr}`);
      }
      remember(slug, state, {
        liveUrl: io.localUrl(cfg, state),
        tunnel: false,
        pids: { live: state?.pids?.live ?? process.pid },
        lastError: e instanceof Error ? e.message : String(e),
      });
      throw e;
    }

    const localUrl = io.localUrl(cfg, state);
    const publicUrl = productPublicEdgeUrl(slug);
    writeLiveUrl(slug, publicUrl);
    remember(slug, state, {
      localUrl,
      liveUrl: publicUrl,
      tunnel: true,
      pids: {
        live: state?.pids?.live ?? process.pid,
        tunnel: pid,
        bot: state?.pids?.bot,
      },
    });

    try {
      await io.bootDiscord(localUrl);
      const current = readSessionState(slug) ?? state;
      remember(slug, current, {
        localUrl,
        liveUrl: publicUrl,
        tunnel: true,
        pids: {
          live: current?.pids?.live ?? process.pid,
          tunnel: pid,
          bot: process.pid,
        },
      });
    } catch (e) {
      console.error(`  bot: ${e instanceof Error ? e.message : e}`);
    }
    return { already: false };
  });
}

/** Publish, clear the origin, stop cloudflared. The hall process stays. */
export function closeNight(slug: string, cfg: CampaignConfig, io: NightIo): Promise<void> {
  return exclusive(async () => {
    const state = readSessionState(slug);
    const localUrl = io.localUrl(cfg, state);
    let error: unknown;
    try {
      await io.publish(slug, cfg);
    } catch (e) {
      error = e;
    }
    try {
      await io.clearOrigin(slug, cfg);
    } catch (e) {
      error = error ?? e;
    }
    io.kill(state?.pids?.tunnel);
    writeLiveUrl(slug, localUrl);
    remember(slug, state, {
      localUrl,
      liveUrl: localUrl,
      tunnel: false,
      pids: { live: state?.pids?.live ?? process.pid },
      lastError: error instanceof Error ? error.message : error ? String(error) : undefined,
    });
    if (error) throw error;
  });
}
