import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { computePoolSize, mulberry32, skillThreshold, type Rng } from '@kodranni/domain';
import { openSqliteStore, refreshCharacterDerived, seedDemoCampaign } from '@kodranni/store';
import { previewHarmFromRoll } from '../src/harm.js';
import { executePlayerRoll, executeStorytellerNpcRoll, undoPlayerRoll } from '../src/roll.js';

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
      expect(rolled.died).toBe(false);
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

  it('refuses a Dying roll with no Exertion, and a second die at one point', () => {
    const store = demoStore();
    const ch = store.getCharacterBySlug('tomaso')!;
    ch.dying = true;
    ch.exertion.current = 1;
    store.putCharacter(ch);
    expect(() =>
      executePlayerRoll(store, {
        characterSlug: 'tomaso',
        foundation: 'Strength',
        skill: 'Carpentry & Masonry',
        exertionDice: 0,
        rng: () => 0,
      }),
    ).toThrow(/Dying characters must spend Exertion on every roll/);
    expect(() =>
      executePlayerRoll(store, {
        characterSlug: 'tomaso',
        foundation: 'Strength',
        skill: 'Carpentry & Masonry',
        exertionDice: 2,
        echoInvoked: true,
        rng: () => 0,
      }),
    ).toThrow(/not enough Exertion/);
    store.close();
  });

  it('clears Dying on the killing spend, and undo restores status, Dying, and Exertion', () => {
    const store = demoStore();
    const ch = store.getCharacterBySlug('tomaso')!;
    const echoes = ch.echoes?.length ?? 0;
    ch.dying = true;
    ch.status = 'active';
    ch.harm.Fever = 3;
    ch.exertion.current = 1;
    store.putCharacter(ch);
    const rolled = executePlayerRoll(store, {
      characterSlug: 'tomaso',
      foundation: 'Strength',
      skill: 'Carpentry & Masonry',
      exertionDice: 1,
      rng: () => 0,
      clientEventId: 'dying-kill',
    });
    expect(rolled.died).toBe(true);
    const dead = store.getCharacterBySlug('tomaso')!;
    expect(dead.status).toBe('dead');
    expect(dead.dying).toBe(false);
    expect(dead.exertion.current).toBe(0);
    expect(dead.harm.Fever).toBe(3);
    expect(dead.echoes ?? []).toHaveLength(echoes);
    undoPlayerRoll(store, rolled.rollId);
    const back = store.getCharacterBySlug('tomaso')!;
    expect(back.status).toBe('active');
    expect(back.dying).toBe(true);
    expect(back.exertion.current).toBe(1);
    expect(back.harm.Fever).toBe(3);
    store.close();
  });

  it('rescores both sides when an opposed reply arrives, and undo puts the opening Practice back', () => {
    const store = demoStore();
    const ready = (slug: string) => {
      const ch = store.getCharacterBySlug(slug)!;
      ch.exertion.current = 4;
      ch.armour = { kind: 'none', donned: false };
      let skill = ch.skills.find((s) => s.name === 'Carpentry & Masonry');
      if (!skill) {
        skill = {
          name: 'Carpentry & Masonry',
          rating: 1,
          practice: 0,
          threshold: 48,
          foundation: 'Strength',
        };
        ch.skills.push(skill);
      }
      skill.rating = 1;
      skill.practice = 0;
      skill.threshold = 48;
      store.putCharacter(ch);
      return refreshCharacterDerived(store.getCharacterBySlug(slug)!);
    };
    const tomaso = ready('tomaso');
    const jakov = ready('jakov');
    const pool = (ch: typeof tomaso) =>
      computePoolSize({
        foundation: ch.foundationsEffective.Strength ?? 0,
        skill: 1,
        exertionDice: 1,
        emptyExertion: false,
        decadence: ch.flags.decadence,
        overCapEchoInvolved: false,
      });
    const script = (face: number, count: number): Rng => {
      const faces = [...Array(count).fill(face), 10];
      const sides = [...Array(count).fill(8), 20];
      let i = 0;
      return () => {
        const shown = faces[i] ?? 1;
        const die = sides[i] ?? 20;
        i += 1;
        return (shown - 0.5) / die;
      };
    };
    const parentPool = pool(tomaso);
    const parent = executePlayerRoll(store, {
      characterSlug: 'tomaso',
      foundation: 'Strength',
      skill: 'Carpentry & Masonry',
      dieTier: 8,
      exertionDice: 1,
      rng: script(8, parentPool),
      clientEventId: 'open-roll',
    });
    const unopposed = Math.floor(parent.marks / 2);
    expect(store.getCharacterBySlug('tomaso')!.skills.find((s) => s.name === 'Carpentry & Masonry')!.practice).toBe(
      unopposed,
    );
    const child = executePlayerRoll(store, {
      characterSlug: 'jakov',
      foundation: 'Strength',
      skill: 'Carpentry & Masonry',
      dieTier: 8,
      exertionDice: 1,
      rng: script(1, pool(jakov)),
      parentRollId: parent.rollId,
      clientEventId: 'oppose-roll',
    });
    const margin = parent.marks;
    expect(store.getCharacterBySlug('tomaso')!.skills.find((s) => s.name === 'Carpentry & Masonry')!.practice).toBe(
      margin,
    );
    expect(store.getCharacterBySlug('jakov')!.skills.find((s) => s.name === 'Carpentry & Masonry')!.practice).toBe(
      margin + 2,
    );
    const parentRow = store.getRoll(parent.rollId)!.data as { kind?: string; marksDifference?: number };
    const childRow = store.getRoll(child.rollId)!.data as { kind?: string; marksDifference?: number };
    expect(parentRow.kind).toBe('opposed');
    expect(parentRow.marksDifference).toBe(0);
    expect(childRow.kind).toBe('opposed');
    expect(childRow.marksDifference).toBe(margin);
    expect(previewHarmFromRoll(store, child.rollId, 'physical').points).toBe(margin);
    expect(previewHarmFromRoll(store, parent.rollId, 'physical').points).toBe(0);
    undoPlayerRoll(store, child.rollId);
    expect(store.getCharacterBySlug('jakov')!.skills.find((s) => s.name === 'Carpentry & Masonry')!.practice).toBe(0);
    expect(store.getCharacterBySlug('tomaso')!.skills.find((s) => s.name === 'Carpentry & Masonry')!.practice).toBe(
      unopposed,
    );
    expect((store.getRoll(parent.rollId)!.data as { kind?: string }).kind).toBe('unopposed');
    store.close();
  });
});
