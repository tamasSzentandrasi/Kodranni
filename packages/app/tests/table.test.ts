import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { computePoolSize, type Rng } from '@kodranni/domain';
import { openSqliteStore, refreshCharacterDerived, seedDemoCampaign } from '@kodranni/store';
import { executePlayerRoll, undoPlayerRoll } from '../src/roll.js';
import {
  applyRest,
  clearScene,
  clearSceneFace,
  closeTide,
  openTide,
  restAward,
  restoreRest,
  nudgeExertion,
  saveRestGroups,
  saveSceneFaces,
  setExertion,
  setSupply,
  stepTide,
} from '../src/table.js';

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

function demoStore() {
  const dir = mkdtempSync(join(tmpdir(), 'kodranni-table-'));
  dirs.push(dir);
  const store = openSqliteStore(join(dir, 'c.sqlite'));
  seedDemoCampaign(store);
  return store;
}

function scripted(faces: number[], sides: number[]): Rng {
  let i = 0;
  return () => {
    const face = faces[i] ?? 1;
    const side = sides[i] ?? 20;
    i += 1;
    return (face - 0.5) / side;
  };
}

describe('scene faces', () => {
  it('rejects 7, 13, duplicates, an empty line, and a face outside 1–20', () => {
    const store = demoStore();
    expect(() => saveSceneFaces(store, [{ face: 7, effect: 'no' }])).toThrow(/always in force/);
    expect(() => saveSceneFaces(store, [{ face: 13, effect: 'no' }])).toThrow(/always in force/);
    expect(() =>
      saveSceneFaces(store, [
        { face: 4, effect: 'the patrol' },
        { face: 4, effect: 'again' },
      ]),
    ).toThrow(/already/);
    expect(() => saveSceneFaces(store, [{ face: 4, effect: '  ' }])).toThrow(/line required/);
    expect(() => saveSceneFaces(store, [{ face: 21, effect: 'no' }])).toThrow(/1–20/);
    expect(store.getTableState().sceneFaces).toEqual([]);
    store.close();
  });

  it('clears one row and then the scene, and the public snapshot omits both', () => {
    const store = demoStore();
    const community = store.getCommunity();
    community.notebook = 'private night notes';
    store.putCommunity(community);
    saveSceneFaces(store, [
      { face: 4, effect: 'the patrol reaches the gate' },
      { face: 1, effect: 'the ring closes' },
    ]);
    clearSceneFace(store, 1);
    expect(store.getTableState().sceneFaces).toEqual([
      { face: 4, effect: 'the patrol reaches the gate', tone: 'mixed', hidden: false },
    ]);
    clearScene(store);
    expect(store.getTableState().sceneFaces).toEqual([]);
    saveSceneFaces(store, [{ face: 4, effect: 'the patrol reaches the gate' }]);
    openTide(store, {
      size: 'skirmish',
      footing: 'equal',
      sideA: 'Mill',
      sideB: 'Road',
      dyeA: '#a01818',
      dyeB: '#3a5c6c',
    });
    const snap = JSON.stringify(store.toPublicSnapshot());
    expect(snap).not.toContain('the patrol reaches the gate');
    expect(snap).not.toContain('private night notes');
    expect(snap).not.toContain('"tide"');
    store.close();
  });
});

describe('restore', () => {
  it('spends food and water, skips an empty exertion cell, and leaves the other person', () => {
    const store = demoStore();
    const tomaso = store.getCharacterBySlug('tomaso')!;
    tomaso.inventory.foodDays = 2;
    tomaso.inventory.waterDays = 0;
    tomaso.exertion.current = 1;
    store.putCharacter(tomaso);
    const jakov = store.getCharacterBySlug('jakov')!;
    const jakovFood = jakov.inventory.foodDays;
    const jakovExertion = jakov.exertion.current;

    expect(() =>
      restoreRest(store, { rows: [{ characterSlug: 'tomaso', spendWater: true }] }),
    ).toThrow(/no water/);
    expect(store.getCharacterBySlug('tomaso')!.inventory.foodDays).toBe(2);

    const changes = restoreRest(store, {
      rows: [{ characterSlug: 'tomaso', spendFood: true, exertion: 99 }],
    });
    const after = store.getCharacterBySlug('tomaso')!;
    expect(after.inventory.foodDays).toBe(1);
    expect(after.exertion.current).toBe(after.exertion.max);
    expect(changes[0]?.exertion).toBe(after.exertion.max);
    expect(store.getCharacterBySlug('jakov')!.inventory.foodDays).toBe(jakovFood);
    expect(store.getCharacterBySlug('jakov')!.exertion.current).toBe(jakovExertion);

    restoreRest(store, { rows: [{ characterSlug: 'tomaso', exertion: null }] });
    expect(store.getCharacterBySlug('tomaso')!.exertion.current).toBe(after.exertion.max);
    store.close();
  });
});

describe('tide state', () => {
  it('opens one tide, steps margin and omen apart, and close clears it', () => {
    const store = demoStore();
    const opened = openTide(store, {
      size: 'skirmish',
      footing: 'equal',
      sideA: 'Mill',
      sideB: 'Road',
      dyeA: '#a01818',
      dyeB: '#a01818',
    });
    expect(opened.length).toBe(15);
    expect(opened.position).toBe(8);
    expect(() =>
      openTide(store, {
        size: 'small',
        footing: 'equal',
        sideA: 'A',
        sideB: 'B',
        dyeA: '#a01818',
        dyeB: '#2e4a3a',
      }),
    ).toThrow(/already open/);

    const stepped = stepTide(store, { winner: 'A', margin: 3, omen: 1 });
    expect(stepped.position).toBe(10);
    const untied = stepTide(store, { winner: null, margin: 9, omen: 10 });
    expect(untied.position).toBe(10);

    const closed = closeTide(store);
    expect(closed.position).toBe(10);
    expect(store.getTableState().tide).toBeNull();
    expect(() => closeTide(store)).toThrow(/no Tide/);
    store.close();
  });

  it('steps the marker on an opposed roll and puts it back on undo', () => {
    const store = demoStore();
    openTide(store, {
      size: 'skirmish',
      footing: 'equal',
      sideA: 'Mill',
      sideB: 'Palace',
      dyeA: '#a01818',
      dyeB: '#3a5c6c',
    });
    const ch = refreshCharacterDerived(store.getCharacterBySlug('tomaso')!);
    ch.exertion.current = Math.max(1, ch.exertion.current);
    store.putCharacter(ch);
    const parent = executePlayerRoll(store, {
      characterSlug: 'tomaso',
      foundation: 'Strength',
      skill: 'Carpentry & Masonry',
      dieTier: 8,
      exertionDice: 0,
      rng: () => 0,
      clientEventId: 'tide-open-roll',
    });
    expect(store.getTableState().tide?.position).toBe(8);
    const child = executePlayerRoll(store, {
      characterSlug: 'tomaso',
      foundation: 'Strength',
      skill: 'Carpentry & Masonry',
      dieTier: 8,
      exertionDice: 0,
      rng: () => 0,
      parentRollId: parent.rollId,
      clientEventId: 'tide-oppose-roll',
    });
    expect(store.getTableState().tide?.position).toBe(9);
    expect((store.getRoll(child.rollId)?.data as { tideStep?: { from?: number } }).tideStep?.from).toBe(8);
    undoPlayerRoll(store, child.rollId);
    expect(store.getTableState().tide?.position).toBe(8);
    store.close();
  });
});

describe('roller and the scene', () => {
  it('reads the stored face onto the roll', () => {
    const store = demoStore();
    saveSceneFaces(store, [{ face: 4, effect: 'the patrol reaches the gate' }]);
    const ch = refreshCharacterDerived(store.getCharacterBySlug('tomaso')!);
    ch.exertion.current = Math.max(1, ch.exertion.current);
    store.putCharacter(ch);
    const skill = ch.skills.find((s) => s.name === 'Carpentry & Masonry');
    const pool = computePoolSize({
      foundation: ch.foundationsEffective.Strength ?? 0,
      skill: skill?.rating ?? 0,
      exertionDice: 0,
      emptyExertion: ch.exertion.current === 0,
      decadence: ch.flags.decadence,
      overCapEchoInvolved: false,
    });
    const faces = Array.from({ length: pool }, () => 1);
    const r = executePlayerRoll(store, {
      characterSlug: 'tomaso',
      foundation: 'Strength',
      skill: 'Carpentry & Masonry',
      dieTier: 8,
      exertionDice: 0,
      rng: scripted([...faces, 4], [...faces.map(() => 8), 20]),
      clientEventId: 'scene-roll',
    });
    expect(r.omen).toBe(4);
    expect(r.omenHit).toBe('scene');
    expect(r.omenEffect).toBe('the patrol reaches the gate');
    store.close();
  });

  it('keeps a whisper off the roll row and on the desk log', () => {
    const store = demoStore();
    saveSceneFaces(store, [{ face: 4, effect: 'the gate is shut', tone: 'negative', hidden: true }]);
    const ch = refreshCharacterDerived(store.getCharacterBySlug('tomaso')!);
    ch.exertion.current = Math.max(1, ch.exertion.current);
    store.putCharacter(ch);
    const skill = ch.skills.find((s) => s.name === 'Carpentry & Masonry');
    const pool = computePoolSize({
      foundation: ch.foundationsEffective.Strength ?? 0,
      skill: skill?.rating ?? 0,
      exertionDice: 0,
      emptyExertion: ch.exertion.current === 0,
      decadence: ch.flags.decadence,
      overCapEchoInvolved: false,
    });
    const faces = Array.from({ length: pool }, () => 1);
    const r = executePlayerRoll(store, {
      characterSlug: 'tomaso',
      foundation: 'Strength',
      skill: 'Carpentry & Masonry',
      dieTier: 8,
      exertionDice: 0,
      rng: scripted([...faces, 4], [...faces.map(() => 8), 20]),
      clientEventId: 'whisper-roll',
    });
    expect(r.omenSecret).toBe(true);
    expect(r.omenWhisper).toBe('the gate is shut');
    expect(r.omenEffect).toBeUndefined();
    expect(store.getTableState().whispers.map((row) => row.effect)).toEqual(['the gate is shut']);
    expect(JSON.stringify(store.toPublicSnapshot())).not.toContain('the gate is shut');
    const roll = store.getRoll(r.rollId);
    expect(JSON.stringify(roll?.data)).not.toContain('the gate is shut');
    store.close();
  });
});

describe('rest groups and supplies', () => {
  it('steps food and water apart, and a long rest with both ample returns three', () => {
    const store = demoStore();
    expect(restAward('short', false, false)).toBe(0);
    expect(restAward('short', true, true)).toBe(2);
    expect(restAward('long', true, false)).toBe(2);
    expect(restAward('long', false, true)).toBe(1);
    expect(restAward('long', true, true)).toBe(3);

    const tomaso = store.getCharacterBySlug('tomaso')!;
    tomaso.exertion.current = 1;
    store.putCharacter(tomaso);
    setSupply(store, { characterSlug: 'tomaso', foodDays: 4 });
    setSupply(store, { characterSlug: 'tomaso', waterDays: 1 });
    expect(store.getCharacterBySlug('tomaso')!.inventory.foodDays).toBe(4);
    expect(store.getCharacterBySlug('tomaso')!.inventory.waterDays).toBe(1);

    saveRestGroups(store, [{ id: 'north', name: 'North road', members: ['tomaso', 'missing'] }]);
    expect(store.getTableState().restGroups).toEqual([
      { id: 'north', name: 'North road', members: ['tomaso'] },
    ]);

    applyRest(store, { slugs: ['tomaso'], kind: 'long', ampleFood: true, ampleWater: true });
    const after = store.getCharacterBySlug('tomaso')!;
    expect(after.exertion.current).toBe(Math.min(after.exertion.max, 4));
    expect(after.exertion.current).toBeGreaterThan(1);
    expect(after.inventory.foodDays).toBe(4);
    expect(after.inventory.waterDays).toBe(1);

    setExertion(store, { characterSlug: 'tomaso', current: 0 });
    expect(store.getCharacterBySlug('tomaso')!.exertion.current).toBe(0);
    setExertion(store, { characterSlug: 'tomaso', current: 500 });
    const capped = store.getCharacterBySlug('tomaso')!;
    expect(capped.exertion.current).toBe(capped.exertion.max);
    expect(capped.exertion.current).toBeGreaterThan(0);
    expect(capped.inventory.foodDays).toBe(4);
    nudgeExertion(store, { slugs: ['tomaso', 'jakov'], delta: -1 });
    const nudged = store.getCharacterBySlug('tomaso')!;
    expect(nudged.exertion.current).toBe(nudged.exertion.max - 1);
    nudgeExertion(store, { slugs: ['tomaso'], delta: 8 });
    const topped = store.getCharacterBySlug('tomaso')!;
    expect(topped.exertion.current).toBe(topped.exertion.max);
    store.close();
  });
});
