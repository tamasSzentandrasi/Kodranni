import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { openSqliteStore, seedDemoCampaign } from '@kodranni/store';
import { POST } from '../src/pages/api/desk/edit';
import { GET as snapshotGet } from '../src/pages/api/desk/snapshot';

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
  const dir = mkdtempSync(join(tmpdir(), 'kod-desk-edit-'));
  dirs.push(dir);
  const path = join(dir, 'c.sqlite');
  const store = openSqliteStore(path);
  seedDemoCampaign(store);
  store.close();
  process.env.KODRANNI_STORE_PATH = path;
  process.env.KODRANNI_CAMPAIGN_SLUG = 'aspalath';
  return path;
}

function post(body: unknown, cookie = 'kod_desk=1', extra?: Record<string, string>) {
  const headers = new Headers({ 'content-type': 'application/json', host: '127.0.0.1' });
  if (cookie) headers.set('cookie', cookie);
  for (const [k, v] of Object.entries(extra ?? {})) headers.set(k, v);
  return POST({
    request: new Request('http://127.0.0.1:8742/api/desk/edit', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    }),
  });
}

describe('POST /api/desk/edit', () => {
  it('refuses a tunneled call and accepts loopback without a cookie', async () => {
    liveStore();
    const tunneled = await post({ op: 'rename', name: 'Other' }, 'kod_desk=1', {
      'x-forwarded-host': 'demo.kodranni.com',
    });
    expect(tunneled.status).toBe(404);
    const bare = await post({ op: 'rename', name: 'Aspalath Quay' }, '');
    expect(bare.status).toBe(200);
  });

  it('renames the campaign and keeps a notebook on the snapshot download', async () => {
    const path = liveStore();
    const renamed = await post({ op: 'rename', name: 'Aspalath Quay' });
    expect(renamed.status).toBe(200);
    const noted = await post({ op: 'notebook', text: 'The well runs low.' });
    expect(noted.status).toBe(200);
    const store = openSqliteStore(path);
    expect(store.getCommunity().name).toBe('Aspalath Quay');
    expect(store.getCommunity().slug).toBe('aspalath');
    store.close();
    const snapRes = await snapshotGet({
      request: new Request('http://127.0.0.1:8742/api/desk/snapshot', {
        headers: { host: '127.0.0.1', cookie: 'kod_desk=1' },
      }),
    });
    expect(snapRes.status).toBe(200);
    const snap = (await snapRes.json()) as { notebook?: string; community: { notebook?: string } };
    expect(snap.notebook).toBe('The well runs low.');
    expect(snap.community.notebook).toBeUndefined();
  });

  it('returns the ladder, category, and plate that were just added', async () => {
    liveStore();
    const axis = await post({ op: 'axisAdd', name: 'Salt' });
    expect(axis.status).toBe(200);
    const axisBody = (await axis.json()) as { axis?: string; count?: number };
    expect(axisBody.axis).toBe('Salt');
    expect(axisBody.count).toBeGreaterThan(3);

    const group = await post({ op: 'groupAdd', name: 'Guilds' });
    expect(group.status).toBe(200);
    const groupBody = (await group.json()) as { group?: { id: string; name: string } };
    expect(groupBody.group?.name).toBe('Guilds');
    expect(groupBody.group?.id).toBeTruthy();

    const label = await post({ op: 'labelAdd', groupId: groupBody.group?.id, name: 'Weavers' });
    expect(label.status).toBe(200);
    const labelBody = (await label.json()) as {
      label?: { id: string; groupId: string; name: string; hue: number | null };
    };
    expect(labelBody.label?.name).toBe('Weavers');
    expect(labelBody.label?.groupId).toBe(groupBody.group?.id);
    expect(typeof labelBody.label?.hue).toBe('number');
  });
});
