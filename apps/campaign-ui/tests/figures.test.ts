import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { issueCommunityToken } from '@kodranni/app';
import { completeMemberPlacements, openSqliteStore, seedDemoCampaign } from '@kodranni/store';
import { POST } from '../src/pages/api/community/figures';

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
  const dir = mkdtempSync(join(tmpdir(), 'kod-figures-'));
  dirs.push(dir);
  const path = join(dir, 'c.sqlite');
  const store = openSqliteStore(path);
  seedDemoCampaign(store);
  store.close();
  process.env.KODRANNI_STORE_PATH = path;
  process.env.KODRANNI_SHEET_TOKEN_SECRET = SECRET;
  delete process.env.KODRANNI_CAMPAIGN_SLUG;
  return path;
}

function setupCookie(slug: string): string {
  const token = issueCommunityToken({
    platform: 'discord',
    accountId: 'st-1',
    communitySlug: slug,
    secret: SECRET,
    ttlSec: 3600,
  });
  return `kod_setup=${encodeURIComponent(token)}`;
}

const url = new URL('http://localhost:8742/api/community/figures');

async function post(
  body: unknown,
  origin = 'http://localhost:8742',
  cookie?: string,
) {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (origin) headers.set('Origin', origin);
  if (cookie) headers.set('Cookie', cookie);
  const req = new Request(url, { method: 'POST', headers, body: JSON.stringify(body) });
  const res = await POST({ request: req, url });
  const data = (await res.json()) as Record<string, unknown>;
  return { status: res.status, data };
}

function signedPost(path: string, body: unknown) {
  const store = openSqliteStore(path);
  const slug = store.getCommunity().slug;
  store.close();
  return post(body, 'http://localhost:8742', setupCookie(slug));
}

describe('POST /api/community/figures', () => {
  it('rejects a missing Origin', async () => {
    liveStore();
    const { status } = await post({ name: 'Hilda' }, '');
    expect(status).toBe(403);
  });

  it('rejects a missing setup cookie', async () => {
    liveStore();
    const { status } = await post({ name: 'Hilda Gate' });
    expect(status).toBe(401);
  });

  it('adds a hall NPC that automation places Outcast', async () => {
    const path = liveStore();
    const { status, data } = await signedPost(path, { name: 'Hilda Gate' });
    expect(status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.name).toBe('Hilda Gate');
    const store = openSqliteStore(path);
    const ch = store.getCharacterBySlug(String(data.slug));
    expect(ch?.kind).toBe('npc');
    const community = store.getCommunity();
    const placed = completeMemberPlacements(community, store.listCharacters()).filter(
      (p) => p.characterSlug === ch?.slug,
    );
    expect(placed.every((p) => p.tier === 'Outcast')).toBe(true);
    expect(placed).toHaveLength(community.hierarchyAxes.length);
    store.close();
  });

  it('adds an outsider to the porch', async () => {
    const path = liveStore();
    const { status, data } = await signedPost(path, {
      name: 'Ash-horn',
      outsider: true,
      faction: 'Reed-marsh folk',
    });
    expect(status).toBe(200);
    const outsiders = data.outsiders as { name: string; labelIds?: string[] }[];
    const ash = outsiders.find((o) => o.name === 'Ash-horn');
    expect(ash?.labelIds?.length).toBeGreaterThan(0);
  });

  it('adds a faction with a hue', async () => {
    const path = liveStore();
    const { status, data } = await signedPost(path, { kind: 'faction', name: 'Ash banner', hue: 28 });
    expect(status).toBe(200);
    const factions = data.factions as { name: string; hue: number }[];
    expect(factions.some((f) => f.name === 'Ash banner' && f.hue === 28)).toBe(true);
  });
});
