import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import { openSqliteStore, seedDemoCampaign } from '@kodranni/store';
import { setStartingFortunes, shiftFortune } from '../src/index.js';

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

function demoStore() {
  const dir = mkdtempSync(join(tmpdir(), 'kod-app-'));
  dirs.push(dir);
  const store = openSqliteStore(join(dir, 'c.sqlite'));
  seedDemoCampaign(store);
  return store;
}

function lastEventPayload(path: string): Record<string, unknown> {
  const db = new DatabaseSync(path);
  const row = db.prepare(`SELECT payload FROM events ORDER BY rowid DESC LIMIT 1`).get() as
    | { payload: string }
    | undefined;
  db.close();
  if (!row) throw new Error('no events');
  return JSON.parse(row.payload) as Record<string, unknown>;
}

const ALL_STEADY = {
  vitality: 2,
  cohesion: 2,
  surplus: 2,
  standing: 2,
  tradition: 2,
} as const;

describe('setStartingFortunes', () => {
  it('writes all five fortunes, fortunesFoundedAt, and founding fortuneMeta', () => {
    const store = demoStore();
    const fortunes = {
      vitality: 3,
      cohesion: 1,
      surplus: 0,
      standing: 2,
      tradition: 2,
    } as const;
    const c = setStartingFortunes(store, { fortunes, actor: 'st', note: 'framed' });
    expect(c.fortunes).toEqual(fortunes);
    expect(c.fortunesFoundedAt).toEqual(expect.any(String));
    for (const key of ['vitality', 'cohesion', 'surplus', 'standing', 'tradition'] as const) {
      expect(c.fortuneMeta?.[key]).toEqual({
        at: c.fortunesFoundedAt,
        source: 'founding',
      });
    }
    const live = store.getCommunity();
    expect(live.fortunes).toEqual(fortunes);
    expect(live.fortunesFoundedAt).toBe(c.fortunesFoundedAt);
    expect(lastEventPayload(store.path)).toMatchObject({
      kind: 'fortunes_founded',
      fortunes,
      note: 'framed',
    });
    store.close();
  });

  it('throws on a second founding', () => {
    const store = demoStore();
    setStartingFortunes(store, { fortunes: ALL_STEADY });
    expect(() => setStartingFortunes(store, { fortunes: ALL_STEADY })).toThrow(
      /already founded/,
    );
    store.close();
  });
});

describe('shiftFortune fortuneMeta', () => {
  it('writes fortuneMeta with source st by default', () => {
    const store = demoStore();
    const c = shiftFortune(store, { fortune: 'vitality', delta: 1, note: 'winter' });
    expect(c.fortunes.vitality).toBe(2);
    expect(c.fortuneMeta?.vitality?.source).toBe('st');
    expect(c.fortuneMeta?.vitality?.note).toBe('winter');
    expect(c.fortuneMeta?.vitality?.at).toEqual(expect.any(String));
    expect(store.getCommunity().fortuneMeta?.vitality?.source).toBe('st');
    expect(lastEventPayload(store.path)).toMatchObject({
      kind: 'fortune_shift',
      fortune: 'vitality',
      source: 'st',
      note: 'winter',
    });
    store.close();
  });

  it('writes fortuneMeta source pivotal when given', () => {
    const store = demoStore();
    const c = shiftFortune(store, {
      fortune: 'cohesion',
      delta: -1,
      source: 'pivotal',
    });
    expect(c.fortuneMeta?.cohesion?.source).toBe('pivotal');
    expect(lastEventPayload(store.path)).toMatchObject({
      kind: 'fortune_shift',
      source: 'pivotal',
    });
    store.close();
  });
});
