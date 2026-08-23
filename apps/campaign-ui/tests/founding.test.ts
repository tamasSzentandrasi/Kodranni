import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { issueCommunityToken } from '@kodranni/app';
import { openSqliteStore, seedDemoCampaign } from '@kodranni/store';
import { foundingOriginOk, PUT } from '../src/pages/api/community/fortunes/founding';

const dirs: string[] = [];
const prevStore = process.env.KODRANNI_STORE_PATH;
const prevSlug = process.env.KODRANNI_CAMPAIGN_SLUG;
const prevSecret = process.env.KODRANNI_SHEET_TOKEN_SECRET;
const SECRET = 'test-sheet-secret-do-not-use-in-prod';

afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
  if (prevStore === undefined) delete process.env.KODRANNI_STORE_PATH;
  else process.env.KODRANNI_STORE_PATH = prevStore;
  if (prevSlug === undefined) delete process.env.KODRANNI_CAMPAIGN_SLUG;
  else process.env.KODRANNI_CAMPAIGN_SLUG = prevSlug;
  if (prevSecret === undefined) delete process.env.KODRANNI_SHEET_TOKEN_SECRET;
  else process.env.KODRANNI_SHEET_TOKEN_SECRET = prevSecret;
});

function liveStore() {
  const dir = mkdtempSync(join(tmpdir(), 'kod-founding-'));
  dirs.push(dir);
  const path = join(dir, 'c.sqlite');
  const store = openSqliteStore(path);
  seedDemoCampaign(store);
  const slug = store.getCommunity().slug;
  store.close();
  process.env.KODRANNI_STORE_PATH = path;
  process.env.KODRANNI_SHEET_TOKEN_SECRET = SECRET;
  delete process.env.KODRANNI_CAMPAIGN_SLUG;
  return { path, slug };
}

function setupToken(slug: string): string {
  return issueCommunityToken({
    platform: 'discord',
    accountId: 'st-1',
    communitySlug: slug,
    secret: SECRET,
    ttlSec: 3600,
  });
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
  token?: string | null;
}): Request {
  const url = 'http://localhost:8742/api/community/fortunes/founding';
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (init.origin) headers.set('Origin', init.origin);
  if (init.host) headers.set('Host', init.host);
  if (init.xfHost) headers.set('X-Forwarded-Host', init.xfHost);
  if (init.xfProto) headers.set('X-Forwarded-Proto', init.xfProto);
  if (init.token) headers.set('Authorization', `Bearer ${init.token}`);
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
    const { slug } = liveStore();
    const { status, data } = await put(foundingRequest({ origin: null, token: setupToken(slug) }));
    expect(status).toBe(403);
    expect(data.error).toBe('Invalid origin');
  });

  it('401s without a setup token', async () => {
    liveStore();
    const { status, data } = await put(
      foundingRequest({ origin: 'http://localhost:8742', token: null }),
    );
    expect(status).toBe(401);
    expect(String(data.error)).toMatch(/token/i);
  });

  it('stores through the quick-tunnel Origin + localhost Host pair', async () => {
    const { path, slug } = liveStore();
    const { status, data } = await put(
      foundingRequest({
        origin: 'https://abc.trycloudflare.com',
        host: 'localhost',
        xfHost: 'abc.trycloudflare.com',
        xfProto: 'https',
        body: { fortunes: MIXED },
        token: setupToken(slug),
      }),
    );
    expect(status).toBe(200);
    expect(data.ok).toBe(true);
    const store = openSqliteStore(path);
    expect(store.getCommunity().fortunes).toEqual(MIXED);
    store.close();
  });

  it('403s a foreign Origin on the localhost Host pair', async () => {
    const { slug } = liveStore();
    const { status } = await put(
      foundingRequest({
        origin: 'https://evil.example',
        host: 'localhost',
        body: { fortunes: MIXED },
        token: setupToken(slug),
      }),
    );
    expect(status).toBe(403);
  });

  it('503s when no live store is configured', async () => {
    delete process.env.KODRANNI_STORE_PATH;
    delete process.env.KODRANNI_CAMPAIGN_SLUG;
    const { status, data } = await put(
      foundingRequest({ origin: 'http://localhost:8742', token: setupToken('vardmark') }),
    );
    expect(status).toBe(503);
    expect(data.error).toBe('No live store configured');
  });

  it('400s on invalid JSON and missing fortunes', async () => {
    const { slug } = liveStore();
    const badJson = await PUT({
      request: new Request('http://localhost:8742/api/community/fortunes/founding', {
        method: 'PUT',
        headers: {
          Origin: 'http://localhost:8742',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${setupToken(slug)}`,
        },
        body: '{',
      }),
    });
    expect(badJson.status).toBe(400);
    const missing = await put(
      foundingRequest({ origin: 'http://localhost:8742', body: {}, token: setupToken(slug) }),
    );
    expect(missing.status).toBe(400);
    expect(missing.data.error).toBe('fortunes required');
  });

  it('stores all five and stamps fortunesFoundedAt with a setup token', async () => {
    const { path, slug } = liveStore();
    const { status, data } = await put(
      foundingRequest({
        origin: 'http://localhost:8742',
        body: { fortunes: MIXED },
        token: setupToken(slug),
      }),
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

  it('overwrites after founding from the Storyteller desk', async () => {
    const { path, slug } = liveStore();
    const token = setupToken(slug);
    const first = await put(
      foundingRequest({
        origin: 'http://localhost:8742',
        body: { fortunes: ALL_STEADY },
        token,
      }),
    );
    expect(first.status).toBe(200);
    const second = await put(
      foundingRequest({
        origin: 'http://localhost:8742',
        body: { fortunes: MIXED },
        token,
      }),
    );
    expect(second.status).toBe(200);
    expect(second.data.fortunes).toEqual(MIXED);
    const store = openSqliteStore(path);
    expect(store.getCommunity().fortunes).toEqual(MIXED);
    expect(store.getCommunity().fortuneMeta?.vitality?.source).toBe('st');
    store.close();
  });

  it('400s when a fortune is missing or out of range', async () => {
    const { slug } = liveStore();
    const token = setupToken(slug);
    const missingKey = await put(
      foundingRequest({
        origin: 'http://localhost:8742',
        body: { fortunes: { vitality: 2, cohesion: 2, surplus: 2, standing: 2 } },
        token,
      }),
    );
    expect(missingKey.status).toBe(400);
    const oob = await put(
      foundingRequest({
        origin: 'http://localhost:8742',
        body: { fortunes: { ...ALL_STEADY, vitality: 4 } },
        token,
      }),
    );
    expect(oob.status).toBe(400);
  });
});
