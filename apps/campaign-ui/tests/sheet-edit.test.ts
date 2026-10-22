import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { issueSheetToken, startCreateFromBot } from '@kodranni/app';
import { openSqliteStore } from '@kodranni/store';
import { POST } from '../src/pages/api/character/[slug]';

const dirs: string[] = [];
const prevStore = process.env.KODRANNI_STORE_PATH;
const prevSecret = process.env.KODRANNI_SHEET_TOKEN_SECRET;

afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
  if (prevStore === undefined) delete process.env.KODRANNI_STORE_PATH;
  else process.env.KODRANNI_STORE_PATH = prevStore;
  if (prevSecret === undefined) delete process.env.KODRANNI_SHEET_TOKEN_SECRET;
  else process.env.KODRANNI_SHEET_TOKEN_SECRET = prevSecret;
});

function draft(): { path: string; slug: string; token: string } {
  const dir = mkdtempSync(join(tmpdir(), 'kod-sheet-edit-'));
  dirs.push(dir);
  const path = join(dir, 'c.sqlite');
  process.env.KODRANNI_SHEET_TOKEN_SECRET = 'sheet-edit-test';
  const store = openSqliteStore(path);
  const { character } = startCreateFromBot(store, {
    platform: 'discord',
    accountId: 'player-1',
    displayName: 'Ada',
    name: 'Ada Mill',
  });
  store.close();
  process.env.KODRANNI_STORE_PATH = path;
  const token = issueSheetToken({
    platform: 'discord',
    accountId: 'player-1',
    characterSlug: character.slug,
    secret: 'sheet-edit-test',
  });
  return { path, slug: character.slug, token };
}

function post(slug: string, body: unknown, headers: Record<string, string>) {
  return POST({
    params: { slug },
    request: new Request(`http://127.0.0.1:8742/api/character/${slug}`, {
      method: 'POST',
      headers: { host: '127.0.0.1:8742', 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    }),
  });
}

describe('POST /api/character st-edit', () => {
  it('refuses harm and Words from a sheet token and still saves an echo', async () => {
    const { path, slug, token } = draft();
    const player = { cookie: 'kod_desk=0', authorization: `Bearer ${token}` };
    const harm = await post(slug, { action: 'st-edit', patch: { harm: { cut: 2 }, wordsDelta: 4 } }, player);
    expect(harm.status).toBe(400);
    expect((await harm.json()).error).toMatch(/belongs on the desk/);
    const echo = await post(
      slug,
      { action: 'st-edit', patch: { echoes: [{ title: 'The well', weight: 1, invokeWhen: 'At the well' }] } },
      player,
    );
    expect(echo.status).toBe(200);
    const store = openSqliteStore(path);
    const ch = store.getCharacterBySlug(slug)!;
    expect(ch.echoes?.[0]?.title).toBe('The well');
    expect(ch.creation?.words ?? 0).toBe(0);
    store.close();
  });

  it('still lets the desk set a claim mark', async () => {
    const { path, slug } = draft();
    const res = await post(
      slug,
      { action: 'st-edit', patch: { claimable: true } },
      { cookie: 'kod_desk=1' },
    );
    expect(res.status).toBe(200);
    const store = openSqliteStore(path);
    expect(store.getCharacterBySlug(slug)!.creation?.claimable).toBe(true);
    store.close();
  });
});
