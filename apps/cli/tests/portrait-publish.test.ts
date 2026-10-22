import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  campaignAvatarsDir,
  openSqliteStore,
  seedDemoCampaign,
  type CampaignConfig,
} from '@kodranni/store';
import { publishSnapshotToEdge } from '../src/edge-publish.js';

const ENV_KEYS = [
  'KODRANNI_HOME',
  'KODRANNI_SECRETS_DIR',
  'KODRANNI_EDGE_URL',
  'KODRANNI_EDGE_CONTROL_URL',
  'KODRANNI_EDGE_DEVICE_KEY',
  'KODRANNI_LIBSECRET',
] as const;

describe('a failed portrait leaves the snapshot published', () => {
  let home = '';
  const saved: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};
  const slug = 'lantern-watch';

  beforeEach(() => {
    home = mkdtempSync(join(tmpdir(), 'kod-portrait-'));
    for (const key of ENV_KEYS) saved[key] = process.env[key];
    process.env.KODRANNI_HOME = home;
    process.env.KODRANNI_SECRETS_DIR = join(home, 'secrets');
    process.env.KODRANNI_EDGE_DEVICE_KEY = 'k'.repeat(32);
    process.env.KODRANNI_LIBSECRET = '0';
    delete process.env.KODRANNI_EDGE_URL;
    delete process.env.KODRANNI_EDGE_CONTROL_URL;
    expect(slug).not.toBe('aspalath');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    for (const key of ENV_KEYS) {
      const value = saved[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    rmSync(home, { recursive: true, force: true });
  });

  it('records the snapshot PUT and does not throw when the portrait PUT fails', async () => {
    const storePath = join(home, 'community.sqlite');
    const store = openSqliteStore(storePath);
    seedDemoCampaign(store, slug, 'Lantern Watch');
    const tomaso = store.getCharacterBySlug('tomaso')!;
    store.putCharacter({ ...tomaso, avatar: 'tomaso.png' });
    store.close();

    const avatars = campaignAvatarsDir(slug);
    mkdirSync(avatars, { recursive: true });
    writeFileSync(join(avatars, 'tomaso.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47]));

    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? 'GET';
        calls.push(`${method} ${url}`);
        if (url.includes('/control/register')) {
          return new Response(JSON.stringify({ hostname: 'skipped' }), { status: 200 });
        }
        if (url.includes('/api/snapshot')) return new Response('ok', { status: 200 });
        if (url.includes('/api/avatar')) return new Response('no', { status: 500 });
        return new Response('ok', { status: 200 });
      }),
    );

    const cfg = {
      schema: 1,
      slug,
      name: 'Lantern Watch',
      storePath,
      liveBind: '127.0.0.1:8742',
      liveBaseUrl: 'http://127.0.0.1:8742',
      publishDebounceMs: 0,
      platforms: [],
      edgeUrl: 'http://127.0.0.1:9',
    } as CampaignConfig;

    await expect(publishSnapshotToEdge(slug, cfg)).resolves.toBeUndefined();
    expect(calls.some((call) => call.startsWith('PUT ') && call.includes('/api/snapshot'))).toBe(
      true,
    );
    expect(calls.some((call) => call.includes('/api/avatar/tomaso'))).toBe(true);
  });
});
