import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { openSqliteStore, seedDemoCampaign } from '@kodranni/store';
import { foundingOriginOk, PUT } from '../src/pages/api/community/fortunes/founding';

const dirs: string[] = [];
const prevStore = process.env.KODRANNI_STORE_PATH;
const prevSlug = process.env.KODRANNI_CAMPAIGN_SLUG;

afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
  if (prevStore === undefined) delete process.env.KODRANNI_STORE_PATH;
  else process.env.KODRANNI_STORE_PATH = prevStore;
  if (prevSlug === undefined) delete process.env.KODRANNI_CAMPAIGN_SLUG;
  else process.env.KODRANNI_CAMPAIGN_SLUG = prevSlug;
});

function liveStore() {
  const dir = mkdtempSync(join(tmpdir(), 'kod-founding-'));
  dirs.push(dir);
  const path = join(dir, 'c.sqlite');
  const store = openSqliteStore(path);
  seedDemoCampaign(store);
  store.close();
  process.env.KODRANNI_STORE_PATH = path;
  delete process.env.KODRANNI_CAMPAIGN_SLUG;
  return path;
}

const ALL_STEADY = {
  vitality: 2,
  cohesion: 2,
  surplus: 2,
  standing: 2,
  tradition: 2,
} as const;

const MIXED = {
  vitality: 3,
  cohesion: 1,
  surplus: 0,
  standing: 2,
  tradition: 2,
} as const;

function foundingRequest(init: {
  origin?: string | null;
  host?: string;
  xfHost?: string;
  xfProto?: string;
  body?: unknown;
}): Request {
  const url = 'http://localhost:8742/api/community/fortunes/founding';
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (init.origin) headers.set('Origin', init.origin);
  if (init.host) headers.set('Host', init.host);
  if (init.xfHost) headers.set('X-Forwarded-Host', init.xfHost);
  if (init.xfProto) headers.set('X-Forwarded-Proto', init.xfProto);
  return new Request(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify(init.body ?? { fortunes: MIXED }),
  });
}

const localUrl = new URL('http://localhost:8742/api/community/fortunes/founding');

async function put(req: Request) {
  const res = await PUT({ request: req });
  const data = (await res.json()) as Record<string, unknown>;
  return { status: res.status, data };
}

describe('foundingOriginOk', () => {
  it('rejects missing Origin', () => {
    expect(foundingOriginOk(new Request(localUrl, { method: 'PUT' }), localUrl)).toBe(false);
  });

  it('accepts Origin matching Astro.url.origin', () => {
    expect(
      foundingOriginOk(
        new Request(localUrl, { method: 'PUT', headers: { Origin: 'http://localhost:8742' } }),
        localUrl,
      ),
    ).toBe(true);
  });

  it('accepts the quick-tunnel pair via X-Forwarded-Host, not rewritten Host', () => {
    // cloudflared --http-host-header localhost: Host is localhost, Origin is the public URL.
    expect(
      foundingOriginOk(
        new Request(localUrl, {
          method: 'PUT',
          headers: {
            Origin: 'https://abc.trycloudflare.com',
            Host: 'localhost',
            'X-Forwarded-Host': 'abc.trycloudflare.com',
            'X-Forwarded-Proto': 'https',
          },
        }),
        localUrl,
      ),
    ).toBe(true);
  });

  it('does not treat Origin hostname === Host as sufficient', () => {
    expect(
      foundingOriginOk(
        new Request(localUrl, {
          method: 'PUT',
          headers: {
            Origin: 'https://abc.trycloudflare.com',
            Host: 'abc.trycloudflare.com',
          },
        }),
        localUrl,
      ),
    ).toBe(false);
  });

  it('rejects a foreign Origin even when Host is localhost', () => {
    expect(
      foundingOriginOk(
        new Request(localUrl, {
          method: 'PUT',
          headers: {
            Origin: 'https://evil.example',
            Host: 'localhost',
          },
        }),
        localUrl,
      ),
    ).toBe(false);
    expect(
      foundingOriginOk(
        new Request(localUrl, {
          method: 'PUT',
          headers: {
            Origin: 'https://evil.example',
            Host: 'localhost',
            'X-Forwarded-Host': 'abc.trycloudflare.com',
            'X-Forwarded-Proto': 'https',
          },
        }),
        localUrl,
      ),
    ).toBe(false);
  });
});

describe('PUT /api/community/fortunes/founding', () => {
  it('403s when Origin is missing', async () => {
    liveStore();
    const { status, data } = await put(foundingRequest({ origin: null }));
    expect(status).toBe(403);
    expect(data.error).toBe('Invalid origin');
  });

  it('stores through the quick-tunnel Origin + localhost Host pair', async () => {
    const path = liveStore();
    const { status, data } = await put(
      foundingRequest({
        origin: 'https://abc.trycloudflare.com',
        host: 'localhost',
        xfHost: 'abc.trycloudflare.com',
        xfProto: 'https',
        body: { fortunes: MIXED },
      }),
    );
    expect(status).toBe(200);
    expect(data.ok).toBe(true);
    const store = openSqliteStore(path);
    expect(store.getCommunity().fortunes).toEqual(MIXED);
    store.close();
  });

  it('403s a foreign Origin on the localhost Host pair', async () => {
    liveStore();
    const { status } = await put(
      foundingRequest({
        origin: 'https://evil.example',
        host: 'localhost',
        body: { fortunes: MIXED },
      }),
    );
    expect(status).toBe(403);
  });

  it('503s when no live store is configured', async () => {
    delete process.env.KODRANNI_STORE_PATH;
    delete process.env.KODRANNI_CAMPAIGN_SLUG;
    const { status, data } = await put(
      foundingRequest({ origin: 'http://localhost:8742' }),
    );
    expect(status).toBe(503);
    expect(data.error).toBe('No live store configured');
  });

  it('400s on invalid JSON and missing fortunes', async () => {
    liveStore();
    const badJson = await PUT({
      request: new Request('http://localhost:8742/api/community/fortunes/founding', {
        method: 'PUT',
        headers: {
          Origin: 'http://localhost:8742',
          'Content-Type': 'application/json',
        },
        body: '{',
      }),
    });
    expect(badJson.status).toBe(400);
    const missing = await put(
      foundingRequest({ origin: 'http://localhost:8742', body: {} }),
    );
    expect(missing.status).toBe(400);
    expect(missing.data.error).toBe('fortunes required');
  });

  it('stores all five and stamps fortunesFoundedAt without kod_edit', async () => {
    const path = liveStore();
    const { status, data } = await put(
      foundingRequest({ origin: 'http://localhost:8742', body: { fortunes: MIXED } }),
    );
    expect(status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.fortunes).toEqual(MIXED);
    expect(data.fortunesFoundedAt).toEqual(expect.any(String));

    const store = openSqliteStore(path);
    const live = store.getCommunity();
    expect(live.fortunes).toEqual(MIXED);
    expect(live.fortunesFoundedAt).toBe(data.fortunesFoundedAt);
    for (const key of Object.keys(MIXED) as (keyof typeof MIXED)[]) {
      expect(live.fortuneMeta?.[key]).toEqual({
        at: live.fortunesFoundedAt,
        source: 'founding',
      });
    }
    store.close();
  });

  it('409s if already founded', async () => {
    liveStore();
    const first = await put(
      foundingRequest({ origin: 'http://localhost:8742', body: { fortunes: ALL_STEADY } }),
    );
    expect(first.status).toBe(200);
    const second = await put(
      foundingRequest({ origin: 'http://localhost:8742', body: { fortunes: MIXED } }),
    );
    expect(second.status).toBe(409);
    expect(String(second.data.error)).toMatch(/already founded/);
  });

  it('400s when a fortune is missing or out of range', async () => {
    liveStore();
    const missingKey = await put(
      foundingRequest({
        origin: 'http://localhost:8742',
        body: { fortunes: { vitality: 2, cohesion: 2, surplus: 2, standing: 2 } },
      }),
    );
    expect(missingKey.status).toBe(400);
    const oob = await put(
      foundingRequest({
        origin: 'http://localhost:8742',
        body: { fortunes: { ...ALL_STEADY, vitality: 4 } },
      }),
    );
    expect(oob.status).toBe(400);
  });
});
