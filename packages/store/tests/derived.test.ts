import { describe, expect, it } from 'vitest';
import { demoJakov, demoTomaso } from '../src/seed.js';
import { refreshCharacterDerived } from '../src/derived.js';

describe('refreshCharacterDerived', () => {
  it('Jakov capacity: max(3,2)+2+2 = 7; Exertion 2+2+1 = 5; echo weight 5', () => {
    const ch = demoJakov();
    expect(ch.echoCapacity).toBe(7);
    expect(ch.exertion.max).toBe(5);
    expect(ch.echoWeight).toBe(5);
    expect(ch.flags.overCapacity).toBe(false);
    expect(ch.flags.decadence).toBe(false);
  });

  it('Decadence when no active Echoes', () => {
    const ch = demoTomaso();
    ch.echoes = [];
    refreshCharacterDerived(ch);
    expect(ch.flags.decadence).toBe(true);
    expect(ch.echoWeight).toBe(0);
  });

  it('resolved Echoes do not count toward weight', () => {
    const ch = demoTomaso();
    expect(ch.echoes.some((e) => e.resolved)).toBe(true);
    expect(ch.echoWeight).toBe(2);
  });

  it('flags overCapacity when weight exceeds capacity', () => {
    const ch = demoTomaso();
    ch.echoes = [
      { title: 'a', weight: 3, invokeWhen: 'x' },
      { title: 'b', weight: 3, invokeWhen: 'y' },
      { title: 'c', weight: 3, invokeWhen: 'z' },
    ];
    refreshCharacterDerived(ch);
    expect(ch.echoWeight).toBe(9);
    expect(ch.echoCapacity).toBe(6);
    expect(ch.flags.overCapacity).toBe(true);
  });
});
