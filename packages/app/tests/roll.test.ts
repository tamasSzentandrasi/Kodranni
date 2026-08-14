import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { mulberry32 } from '@kodranni/domain';
import { openSqliteStore, seedDemoCampaign } from '@kodranni/store';
import { executePlayerRoll, executeStorytellerNpcRoll } from '../src/roll.js';

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

function demoStore() {
  const dir = mkdtempSync(join(tmpdir(), 'kodranni-app-'));
  dirs.push(dir);
  const store = openSqliteStore(join(dir, 'c.sqlite'));
  seedDemoCampaign(store);
  return store;
}

describe('executePlayerRoll', () => {
  it('rolls Tomas Strength+Carpentry & Masonry and spends Exertion', () => {
    const store = demoStore();
    const before = store.getCharacterBySlug('tomas')!.exertion.current;
    const r = executePlayerRoll(store, {
      characterSlug: 'tomas',
      foundation: 'Strength',
      skill: 'Carpentry & Masonry',
      dieTier: 8,
      exertionDice: 1,
      rng: mulberry32(99),
      clientEventId: 'roll-1',
    });
    expect(r.poolSize).toBeGreaterThanOrEqual(1);
    expect(r.faces).toHaveLength(r.poolSize);
    expect(r.omen).toBeTypeOf('number');
    const after = store.getCharacterBySlug('tomas')!;
    expect(after.exertion.current).toBe(before - 1);
    expect(store.getRoll(r.rollId)).toBeTruthy();
    store.close();
  });

  it('rejects second Exertion without Echo', () => {
    const store = demoStore();
    expect(() =>
      executePlayerRoll(store, {
        characterSlug: 'tomas',
        foundation: 'Strength',
        skill: 'Carpentry & Masonry',
        exertionDice: 2,
        rng: mulberry32(1),
      }),
    ).toThrow(/Echo/);
    store.close();
  });

  it('NPC roll does not require a character sheet', () => {
    const store = demoStore();
    const r = executeStorytellerNpcRoll(store, {
      label: 'Reeve',
      foundation: 2,
      skill: 1,
      dieTier: 8,
      rng: mulberry32(3),
    });
    expect(r.marks + r.failures).toBe(r.poolSize);
    store.close();
  });
});
