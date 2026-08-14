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

  it('flags overCapacity when weight exceeds capacity (penalty only on Echo-involved rolls)', () => {
    // Flag = load state. Dice −1 applies only when the roll involves an Echo (invoke/tag).
    const ch = demoTomas();
    ch.echoes = [
      { title: 'a', weight: 3 },
      { title: 'b', weight: 3 },
    ];
    refreshCharacterDerived(ch);
    expect(ch.echoWeight).toBe(6);
    expect(ch.echoCapacity).toBe(5);
    expect(ch.flags.overCapacity).toBe(true);
    // At capacity (not over): flag false
    ch.echoes = [{ title: 'a', weight: 5 }];
    refreshCharacterDerived(ch);
    expect(ch.flags.overCapacity).toBe(false);
  });
});


