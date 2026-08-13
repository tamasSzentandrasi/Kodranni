import { describe, expect, it } from 'vitest';
import { demoLeif, demoEira } from '../src/seed.js';
import { refreshCharacterDerived } from '../src/derived.js';

describe('refreshCharacterDerived', () => {
  it('Leif Guidebook capacity example', () => {
    const leif = demoLeif();
    expect(leif.echoCapacity).toBe(6);
    expect(leif.exertion.max).toBe(5);
    expect(leif.echoWeight).toBe(6);
    expect(leif.flags.overCapacity).toBe(false);
    expect(leif.flags.decadence).toBe(false);
  });

  it('Decadence when no Echoes', () => {
    const ch = demoEira();
    ch.echoes = [];
    refreshCharacterDerived(ch);
    expect(ch.flags.decadence).toBe(true);
    expect(ch.echoWeight).toBe(0);
  });

  it('over-cap when weight exceeds capacity', () => {
    const ch = demoEira();
    ch.echoes = [
      { title: 'a', weight: 3 },
      { title: 'b', weight: 3 },
    ];
    refreshCharacterDerived(ch);
    expect(ch.echoWeight).toBe(6);
    expect(ch.echoCapacity).toBe(5);
    expect(ch.flags.overCapacity).toBe(true);
  });
});
