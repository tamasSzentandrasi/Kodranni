import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { openSqliteStore, seedDemoCampaign } from '@kodranni/store';
import {
  applyHarm,
  previewHarm,
  reclaimExertion,
  setSupplies,
  shiftFortune,
} from '../src/index.js';

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

describe('harm', () => {
  it('previews physical points from unopposed with armour ratio', () => {
    const store = demoStore();
    const leifr = store.getCharacterBySlug('leifr')!;
    // light donned → ratio 2; failures 5 marks 1 → floor((5-1)/2)=2
    const prev = previewHarm({
      kind: 'unopposed',
      family: 'physical',
      failures: 5,
      marks: 1,
      target: leifr,
    });
    expect(prev.ratio).toBe(2);
    expect(prev.points).toBe(2);
    expect(prev.allowedTracks).toContain('Bleeding');
    store.close();
  });

  it('applyHarm allocates within family and audits', () => {
    const store = demoStore();
    const r = applyHarm(store, {
      characterSlug: 'leifr',
      family: 'physical',
      availablePoints: 2,
      allocations: [
        { track: 'Bleeding', points: 1 },
        { track: 'Crushed', points: 1 },
      ],
      actor: 'st',
    });
    expect(r.applied).toHaveLength(2);
    const ch = store.getCharacterBySlug('leifr')!;
    expect(ch.harm.Bleeding).toBe(2); // seed already had 1
    expect(ch.harm.Crushed).toBe(1);
    store.close();
  });

  it('rejects social track on physical infliction', () => {
    const store = demoStore();
    expect(() =>
      applyHarm(store, {
        characterSlug: 'leifr',
        family: 'physical',
        availablePoints: 1,
        allocations: [{ track: 'Disgrace', points: 1 }],
      }),
    ).toThrow(/not allowed/);
    store.close();
  });
});

describe('ST resource events', () => {
  it('reclaims exertion toward max', () => {
    const store = demoStore();
    const before = store.getCharacterBySlug('leifr')!.exertion.current;
    const ch = reclaimExertion(store, { characterSlug: 'leifr', points: 0 });
    // points 0 means add 0 when explicit; use fill
    const filled = reclaimExertion(store, { characterSlug: 'torvald' });
    expect(filled.exertion.current).toBe(filled.exertion.max);
    expect(before).toBeLessThanOrEqual(ch.exertion.max);
    store.close();
  });

  it('shifts fortune within 0–3', () => {
    const store = demoStore();
    const c = shiftFortune(store, { fortune: 'vitality', delta: 1 });
    expect(c.fortunes.vitality).toBe(2); // seed was 1
    const c2 = shiftFortune(store, { fortune: 'vitality', delta: 5 });
    expect(c2.fortunes.vitality).toBe(3);
    store.close();
  });

  it('sets supplies', () => {
    const store = demoStore();
    const ch = setSupplies(store, {
      characterSlug: 'torvald',
      foodDays: 5,
      waterDays: 4,
    });
    expect(ch.inventory.foodDays).toBe(5);
    expect(ch.inventory.waterDays).toBe(4);
    store.close();
  });
});
