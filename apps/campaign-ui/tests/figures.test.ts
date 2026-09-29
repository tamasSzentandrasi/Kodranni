import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { completeMemberPlacements, openSqliteStore, seedDemoCampaign } from '@kodranni/store';
import { POST } from '../src/pages/api/community/figures';

const dirs: string[] = [];
const prevStore = process.env.KODRANNI_STORE_PATH;
const prevSlug = process.env.KODRANNI_CAMPAIGN_SLUG;
const DESK = 'kod_desk=1';

afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
  if (prevStore === undefined) delete process.env.KODRANNI_STORE_PATH;
  else process.env.KODRANNI_STORE_PATH = prevStore;
  if (prevSlug === undefined) delete process.env.KODRANNI_CAMPAIGN_SLUG;
  else process.env.KODRANNI_CAMPAIGN_SLUG = prevSlug;
});

function liveStore() {
  const dir = mkdtempSync(join(tmpdir(), 'kod-figures-'));
  dirs.push(dir);
  const path = join(dir, 'c.sqlite');
  const store = openSqliteStore(path);
  seedDemoCampaign(store);
  store.close();
  process.env.KODRANNI_STORE_PATH = path;
  delete process.env.KODRANNI_CAMPAIGN_SLUG;
  return path;
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

function deskPost(body: unknown) {
  return post(body, 'http://localhost:8742', DESK);
}

describe('POST /api/community/figures', () => {
  it('rejects a missing Origin', async () => {
    liveStore();
    const { status } = await post({ name: 'Hilda' }, '');
    expect(status).toBe(403);
  });

  it('rejects a missing desk cookie', async () => {
    liveStore();
    const { status, data } = await post({ name: 'Hilda Gate' });
    expect(status).toBe(401);
    expect(String(data.error)).toMatch(/desk/i);
  });

  it('404s a tunneled request even with the desk cookie', async () => {
    liveStore();
    const headers = new Headers({
      'Content-Type': 'application/json',
      Origin: 'http://localhost:8742',
      Cookie: DESK,
      'X-Forwarded-Host': 'kodranni.com',
    });
    const res = await POST({
      request: new Request(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: 'Hilda Gate' }),
      }),
      url,
    });
    expect(res.status).toBe(404);
  });

  it('adds a hall NPC that automation places Outcast', async () => {
    const path = liveStore();
    const { status, data } = await deskPost({ name: 'Hilda Gate' });
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
    liveStore();
    const { status, data } = await deskPost({
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
    liveStore();
    const { status, data } = await deskPost({ kind: 'faction', name: 'Ash banner', hue: 28 });
    expect(status).toBe(200);
    const factions = data.factions as { name: string; hue: number }[];
    expect(factions.some((f) => f.name === 'Ash banner' && f.hue === 28)).toBe(true);
  });
});
