import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { mulberry32, skillThreshold } from '@kodranni/domain';
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
  it('rolls Torvald Strength+Carpentry & Masonry and spends Exertion', () => {
    const store = demoStore();
    const before = store.getCharacterBySlug('tomaso')!.exertion.current;
    const r = executePlayerRoll(store, {
      characterSlug: 'tomaso',
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
    const after = store.getCharacterBySlug('tomaso')!;
    expect(after.exertion.current).toBe(before - 1);
    expect(store.getRoll(r.rollId)).toBeTruthy();
    store.close();
  });

  it('rejects second Exertion without Echo', () => {
    const store = demoStore();
    expect(() =>
      executePlayerRoll(store, {
        characterSlug: 'tomaso',
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

  it('allows untrained (rating 0) named skills', () => {
    const store = demoStore();
    const r = executePlayerRoll(store, {
      characterSlug: 'tomaso',
      foundation: 'Charisma',
      skill: 'Debate & Rhetoric',
      dieTier: 8,
      rng: mulberry32(7),
      clientEventId: 'untrained-1',
    });
    expect(r.whyPool).toMatch(/untrained|Skill Debate/);
    expect(r.poolFormula).toMatch(/\+/);
    store.close();
  });

  it('levels onto the 1→2 bar for Foundation 1, 2, and 3', () => {
    const store = demoStore();
    const ch = store.getCharacterBySlug('tomaso')!;
    for (const foundation of [1, 2, 3]) {
      const bar = skillThreshold(0, foundation);
      ch.foundations.Strength = foundation;
      ch.status = 'active';
      ch.dying = false;
      ch.exertion.current = 3;
      const row = ch.skills.find((skill) => skill.name === 'Carpentry & Masonry')!;
      row.rating = 0;
      row.practice = bar - 2;
      row.threshold = 24;
      store.putCharacter(ch);
      const rolled = executePlayerRoll(store, {
        characterSlug: 'tomaso',
        foundation: 'Strength',
        skill: 'Carpentry & Masonry',
        dieTier: 8,
        rng: () => 0,
        clientEventId: `level-${foundation}`,
      });
      const after = store
        .getCharacterBySlug('tomaso')!
        .skills.find((skill) => skill.name === 'Carpentry & Masonry')!;
      expect(after.rating).toBe(1);
      expect(after.practice).toBe(0);
      expect(after.threshold).toBe(skillThreshold(1, foundation));
    }
    expect(skillThreshold(1, 1)).toBe(96);
    expect(skillThreshold(1, 2)).toBe(48);
    expect(skillThreshold(1, 3)).toBe(24);
    store.close();
  });

  it('stores the ruling 0→1 bar on a new untrained row', () => {
    const store = demoStore();
    const ch = store.getCharacterBySlug('tomaso')!;
    ch.foundations.Charisma = 1;
    ch.exertion.current = 3;
    ch.skills = ch.skills.filter((skill) => skill.name !== 'Debate & Rhetoric');
    store.putCharacter(ch);
    executePlayerRoll(store, {
      characterSlug: 'tomaso',
      foundation: 'Charisma',
      skill: 'Debate & Rhetoric',
      dieTier: 8,
      rng: () => 0,
      clientEventId: 'virtual-bar',
    });
    const row = store
      .getCharacterBySlug('tomaso')!
      .skills.find((skill) => skill.name === 'Debate & Rhetoric')!;
    expect(row.rating).toBe(0);
    expect(row.practice).toBe(2);
    expect(row.threshold).toBe(48);
    store.close();
  });
});
