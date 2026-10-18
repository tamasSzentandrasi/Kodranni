import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  defaultCampaignTomlPath,
  openSqliteStore,
  readCampaignConfig,
  type CampaignConfig,
} from '@kodranni/store';
import { foundCampaign, type FoundPublish } from '../src/found.js';

/** Closed port. A missed publish stub must not reach the live Worker. */
const CLOSED_EDGE = 'http://127.0.0.1:9';

const ENV_KEYS = [
  'KODRANNI_HOME',
  'KODRANNI_SECRETS_DIR',
  'KODRANNI_EDGE_URL',
  'KODRANNI_EDGE_CONTROL_URL',
  'KODRANNI_EDGE_DEVICE_KEY',
  'KODRANNI_CF_TUNNEL_TOKEN',
  'KODRANNI_TUNNEL_HOSTNAME',
  'KODRANNI_CF_TUNNEL_HOSTNAME',
  'DISCORD_GUILD_ID',
  'DISCORD_PLAY_CHANNEL_ID',
  'DISCORD_STORYTELLER_ROLE_ID',
  'FLUXER_BOT_TOKEN',
  'FLUXER_GUILD_ID',
  'FLUXER_STORYTELLER_ROLE_ID',
] as const;

describe('foundCampaign', () => {
  let home = '';
  const saved: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};

  beforeEach(() => {
    home = mkdtempSync(join(tmpdir(), 'kod-found-'));
    for (const key of ENV_KEYS) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
    process.env.KODRANNI_HOME = home;
    process.env.KODRANNI_SECRETS_DIR = join(home, 'secrets');
    process.env.KODRANNI_EDGE_CONTROL_URL = CLOSED_EDGE;
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      const prev = saved[key];
      if (prev === undefined) delete process.env[key];
      else process.env[key] = prev;
    }
    rmSync(home, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  function isolatedToml(slug: string): string {
    const toml = defaultCampaignTomlPath(slug);
    expect(toml.startsWith(home)).toBe(true);
    expect(slug).not.toBe('aspalath');
    return toml;
  }

  it.each([
    ['Demo', 'demo'],
    ['Play', 'play'],
    ['www', 'www'],
    ['Origin Aspalath', 'origin-aspalath'],
  ])('refuses %s before any directory is written', async (name, slug) => {
    const publish = vi.fn<FoundPublish>(async () => {});
    const toml = isolatedToml(slug);
    await expect(foundCampaign({ name, publish })).rejects.toThrow(/reserved/);
    expect(existsSync(toml)).toBe(false);
    expect(existsSync(join(home, 'campaigns', slug))).toBe(false);
    expect(publish).not.toHaveBeenCalled();
  });

  it('refuses a name with no letter or digit before writing', async () => {
    const publish = vi.fn<FoundPublish>(async () => {});
    await expect(foundCampaign({ name: '---', publish })).rejects.toThrow(/letter or digit/);
    expect(existsSync(join(home, 'campaigns'))).toBe(false);
    expect(publish).not.toHaveBeenCalled();
  });

  it('writes an empty hall and publishes it once', async () => {
    const publish = vi.fn<FoundPublish>(async () => {});
    const toml = isolatedToml('lantern-watch');
    const slug = await foundCampaign({ name: 'Lantern Watch', publish });
    expect(slug).toBe('lantern-watch');
    expect(publish).toHaveBeenCalledOnce();
    const cfg = publish.mock.calls[0]?.[1] as CampaignConfig;
    expect(cfg.edgeUrl).toBe('https://lantern-watch.kodranni.com');
    expect(cfg.edgeControlUrl).toBe(CLOSED_EDGE);
    const written = await readCampaignConfig(toml);
    expect(written.edgeUrl).toBe('https://lantern-watch.kodranni.com');
    expect(written.edgeControlUrl).toBe(CLOSED_EDGE);
    const store = openSqliteStore(written.storePath);
    try {
      const community = store.getCommunity();
      expect(community.name).toBe('Lantern Watch');
      expect(community.fortunes.vitality).toBe(2);
      expect(store.listCharacters()).toEqual([]);
    } finally {
      store.close();
    }
  });

  it('leaves an existing campaign and does not publish again', async () => {
    const publish = vi.fn<FoundPublish>(async () => {});
    const toml = isolatedToml('lantern-watch');
    await foundCampaign({ name: 'Lantern Watch', publish });
    const store = openSqliteStore((await readCampaignConfig(toml)).storePath);
    const community = store.getCommunity();
    community.name = 'Kept';
    store.putCommunity(community);
    store.close();
    const marked = readFileSync(toml, 'utf8').replace(
      'name = "Lantern Watch"',
      'name = "Kept Title"',
    );
    writeFileSync(toml, marked);

    await foundCampaign({ name: 'Lantern Watch', publish });

    expect(publish).toHaveBeenCalledOnce();
    expect(readFileSync(toml, 'utf8')).toBe(marked);
    const again = openSqliteStore((await readCampaignConfig(toml)).storePath);
    try {
      expect(again.getCommunity().name).toBe('Kept');
    } finally {
      again.close();
    }
  });

  it('still returns the slug when publish throws', async () => {
    const publish = vi.fn<FoundPublish>(async () => {
      throw new Error('edge down');
    });
    isolatedToml('lantern-watch');
    await expect(foundCampaign({ name: 'Lantern Watch', publish })).resolves.toBe('lantern-watch');
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('edge down'));
    expect(existsSync(defaultCampaignTomlPath('lantern-watch'))).toBe(true);
  });

  it('restores a snapshot and publishes that hall', async () => {
    const publish = vi.fn<FoundPublish>(async () => {});
    const snap = join(home, 'snap.json');
    writeFileSync(
      snap,
      JSON.stringify({
        community: {
          name: 'After the knife',
          slug: 'other',
          fortunes: { vitality: 2, cohesion: 2, surplus: 2, standing: 2, tradition: 2 },
          myths: [],
          hierarchyAxes: ['Arms', 'Faith', 'Coin', 'Blood'],
          ruler: null,
          placements: [],
          outsiders: [],
        },
        characters: [],
      }),
    );
    isolatedToml('harbor-bell');
    const slug = await foundCampaign({
      name: 'Harbor Bell',
      snapshotPath: snap,
      publish,
    });
    expect(slug).toBe('harbor-bell');
    expect(publish).toHaveBeenCalledOnce();
    const store = openSqliteStore((await readCampaignConfig(defaultCampaignTomlPath(slug))).storePath);
    try {
      expect(store.getCommunity().name).toBe('After the knife');
      expect(store.getCommunity().slug).toBe('harbor-bell');
      expect(store.listCharacters()).toEqual([]);
    } finally {
      store.close();
    }
  });
});
