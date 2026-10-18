import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  readLiveUrl,
  readSessionState,
  writeSessionState,
  type CampaignConfig,
} from '@kodranni/store';
import { closeNight, openNight, type NightIo } from '../src/night.js';

const ENV_KEYS = [
  'KODRANNI_HOME',
  'KODRANNI_SECRETS_DIR',
  'KODRANNI_EDGE_URL',
  'KODRANNI_EDGE_CONTROL_URL',
  'KODRANNI_EDGE_DEVICE_KEY',
  'DISCORD_GUILD_ID',
  'DISCORD_BOT_TOKEN',
] as const;

describe('night controls', () => {
  let home = '';
  const saved: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};
  const slug = 'lantern-watch';

  beforeEach(() => {
    home = mkdtempSync(join(tmpdir(), 'kod-night-'));
    for (const key of ENV_KEYS) saved[key] = process.env[key];
    process.env.KODRANNI_HOME = home;
    process.env.KODRANNI_SECRETS_DIR = join(home, 'secrets');
    process.env.KODRANNI_EDGE_CONTROL_URL = 'http://127.0.0.1:9';
    delete process.env.KODRANNI_EDGE_URL;
    delete process.env.KODRANNI_EDGE_DEVICE_KEY;
    delete process.env.DISCORD_GUILD_ID;
    delete process.env.DISCORD_BOT_TOKEN;
    expect(slug).not.toBe('aspalath');
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      const value = saved[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    rmSync(home, { recursive: true, force: true });
  });

  function cfg(): CampaignConfig {
    return {
      schema: 1,
      slug,
      name: 'Lantern Watch',
      storePath: join(home, 'community.sqlite'),
      liveBind: '127.0.0.1:8742',
      liveBaseUrl: 'http://127.0.0.1:8742',
      publishDebounceMs: 0,
      platforms: [],
      discordGuildId: '100000000000000001',
    } as CampaignConfig;
  }

  function io(over: Partial<NightIo> = {}): NightIo {
    return {
      publish: vi.fn(async () => {}),
      clearOrigin: vi.fn(async () => {}),
      mint: vi.fn(async () => ({ origin: 'https://origin-lantern-watch.kodranni.com', token: 'minted-token', tunnelId: 'tun' })),
      findCloudflared: vi.fn(async () => '/usr/bin/cloudflared'),
      startTunnel: vi.fn(() => ({ pid: 4242 })),
      bootDiscord: vi.fn(async () => {}),
      alive: (pid) => pid === 4242,
      kill: vi.fn(),
      deviceKey: () => 'k'.repeat(32),
      edgeControl: () => 'http://127.0.0.1:9',
      guildId: (c) => c.discordGuildId,
      localUrl: () => 'http://127.0.0.1:8742',
      logPath: (s) => `/tmp/${s}-tunnel.log`,
      ...over,
    };
  }

  it('publishes, mints, and records the tunnel without leaving the hall', async () => {
    const deps = io();
    const opened = await openNight(slug, cfg(), deps);
    expect(opened.already).toBe(false);
    expect(deps.publish).toHaveBeenCalledOnce();
    expect(deps.mint).toHaveBeenCalledWith({
      edgeUrl: 'http://127.0.0.1:9',
      campaignId: slug,
      deviceKey: 'k'.repeat(32),
      guildId: '100000000000000001',
    });
    expect(deps.startTunnel).toHaveBeenCalledWith({
      bin: '/usr/bin/cloudflared',
      token: 'minted-token',
      logPath: '/tmp/lantern-watch-tunnel.log',
    });
    expect(deps.bootDiscord).toHaveBeenCalledWith('http://127.0.0.1:8742');
    const state = readSessionState(slug);
    expect(state?.tunnel).toBe(true);
    expect(state?.pids?.tunnel).toBe(4242);
    expect(state?.pids?.live).toBe(process.pid);
    expect(state?.pids?.bot).toBe(process.pid);
    expect(readLiveUrl(slug)).toBe('https://lantern-watch.kodranni.com');
  });

  it('does nothing when the tunnel child is already up', async () => {
    writeSessionState(slug, {
      slug,
      localUrl: 'http://127.0.0.1:8742',
      liveUrl: 'https://lantern-watch.kodranni.com',
      tunnel: true,
      pids: { live: 11, tunnel: 4242 },
    });
    const deps = io();
    const opened = await openNight(slug, cfg(), deps);
    expect(opened.already).toBe(true);
    expect(deps.publish).not.toHaveBeenCalled();
    expect(deps.mint).not.toHaveBeenCalled();
    expect(deps.startTunnel).not.toHaveBeenCalled();
    expect(readSessionState(slug)?.pids?.live).toBe(11);
  });

  it('queues a second Go Live behind the first and still publishes once', async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const deps = io({
      publish: vi.fn(() => gate),
    });
    const first = openNight(slug, cfg(), deps);
    const second = openNight(slug, cfg(), deps);
    release();
    const [a, b] = await Promise.all([first, second]);
    expect(a.already).toBe(false);
    expect(b.already).toBe(true);
    expect(deps.publish).toHaveBeenCalledOnce();
    expect(deps.mint).toHaveBeenCalledOnce();
  });

  it('clears a minted origin when cloudflared does not start', async () => {
    const deps = io({
      startTunnel: vi.fn(() => {
        throw new Error('spawn failed');
      }),
    });
    await expect(openNight(slug, cfg(), deps)).rejects.toThrow(/spawn failed/);
    expect(deps.clearOrigin).toHaveBeenCalledOnce();
    expect(readSessionState(slug)?.tunnel).toBe(false);
    expect(readSessionState(slug)?.lastError).toMatch(/spawn failed/);
  });

  it('refuses to publish when cloudflared is missing', async () => {
    const deps = io({ findCloudflared: vi.fn(async () => undefined) });
    await expect(openNight(slug, cfg(), deps)).rejects.toThrow(/cloudflared/);
    expect(deps.publish).not.toHaveBeenCalled();
    expect(deps.mint).not.toHaveBeenCalled();
  });

  it('keeps the night up when Discord boot fails', async () => {
    const deps = io({
      bootDiscord: vi.fn(async () => {
        throw new Error('discord down');
      }),
    });
    const opened = await openNight(slug, cfg(), deps);
    expect(opened.already).toBe(false);
    expect(readSessionState(slug)?.tunnel).toBe(true);
    expect(readSessionState(slug)?.pids?.bot).toBeUndefined();
  });

  it('publishes and stops the tunnel without exiting', async () => {
    writeSessionState(slug, {
      slug,
      startedAt: '2026-10-18T00:00:00.000Z',
      localUrl: 'http://127.0.0.1:8742',
      liveUrl: 'https://lantern-watch.kodranni.com',
      tunnel: true,
      pids: { live: 11, tunnel: 22 },
    });
    const deps = io();
    await closeNight(slug, cfg(), deps);
    expect(deps.publish).toHaveBeenCalledOnce();
    expect(deps.clearOrigin).toHaveBeenCalledOnce();
    expect(deps.kill).toHaveBeenCalledWith(22);
    const state = readSessionState(slug);
    expect(state?.tunnel).toBe(false);
    expect(state?.pids?.live).toBe(11);
    expect(state?.pids?.tunnel).toBeUndefined();
    expect(state?.startedAt).toBe('2026-10-18T00:00:00.000Z');
    expect(readLiveUrl(slug)).toBe('http://127.0.0.1:8742');
  });

  it('publishes a dark hall and does not error', async () => {
    const deps = io();
    await expect(closeNight(slug, cfg(), deps)).resolves.toBeUndefined();
    expect(deps.publish).toHaveBeenCalledOnce();
    expect(deps.clearOrigin).toHaveBeenCalledOnce();
    expect(deps.kill).toHaveBeenCalledWith(undefined);
    expect(readSessionState(slug)?.tunnel).toBe(false);
  });

  it('stops the tunnel even when the publish fails', async () => {
    writeSessionState(slug, {
      slug,
      localUrl: 'http://127.0.0.1:8742',
      liveUrl: 'https://lantern-watch.kodranni.com',
      tunnel: true,
      pids: { live: 11, tunnel: 22 },
    });
    const deps = io({
      publish: vi.fn(async () => {
        throw new Error('edge down');
      }),
    });
    await expect(closeNight(slug, cfg(), deps)).rejects.toThrow(/edge down/);
    expect(deps.clearOrigin).toHaveBeenCalledOnce();
    expect(deps.kill).toHaveBeenCalledWith(22);
    expect(readSessionState(slug)?.tunnel).toBe(false);
    expect(readSessionState(slug)?.lastError).toMatch(/edge down/);
  });
});
