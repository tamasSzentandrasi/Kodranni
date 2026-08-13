import { describe, expect, it } from 'vitest';
import { demoCapacityProfile, demoTomas } from '../src/seed.js';
import { refreshCharacterDerived } from '../src/derived.js';

describe('refreshCharacterDerived', () => {
  it('Guidebook capacity profile: max(2,1)+2+2 = 6; Exertion 2+2+1 = 5', () => {
    const ch = demoCapacityProfile('Leif');
    expect(ch.echoCapacity).toBe(6);
    expect(ch.exertion.max).toBe(5);
    expect(ch.echoWeight).toBe(6);
    expect(ch.flags.overCapacity).toBe(false);
    expect(ch.flags.decadence).toBe(false);
  });

  it('Decadence when no Echoes', () => {
    const ch = demoTomas();
    ch.echoes = [];
    refreshCharacterDerived(ch);
    expect(ch.flags.decadence).toBe(true);
    expect(ch.echoWeight).toBe(0);
  });

  it('over-cap when weight exceeds capacity', () => {
    const ch = demoTomas();
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

