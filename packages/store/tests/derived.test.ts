import { describe, expect, it } from 'vitest';
import { demoLeifr, demoTorvald } from '../src/seed.js';
import { refreshCharacterDerived } from '../src/derived.js';

describe('refreshCharacterDerived', () => {
  it('Guidebook capacity profile: max(2,1)+2+2 = 6; Exertion 2+2+1 = 5', () => {
    const ch = demoLeifr();
    expect(ch.echoCapacity).toBe(6);
    expect(ch.exertion.max).toBe(5);
    expect(ch.echoWeight).toBe(6);
    expect(ch.flags.overCapacity).toBe(false);
    expect(ch.flags.decadence).toBe(false);
  });

  it('Decadence when no active Echoes', () => {
    const ch = demoTorvald();
    ch.echoes = [];
    refreshCharacterDerived(ch);
    expect(ch.flags.decadence).toBe(true);
    expect(ch.echoWeight).toBe(0);
  });

  it('resolved Echoes do not count toward weight', () => {
    const ch = demoTorvald();
    // Torvald has one active weight-2 and one resolved weight-1
    expect(ch.echoes.some((e) => e.resolved)).toBe(true);
    expect(ch.echoWeight).toBe(2);
  });

  it('flags overCapacity when weight exceeds capacity', () => {
    const ch = demoTorvald();
    ch.echoes = [
      { title: 'a', weight: 3, invokeWhen: 'x' },
      { title: 'b', weight: 3, invokeWhen: 'y' },
    ];
    refreshCharacterDerived(ch);
    expect(ch.echoWeight).toBe(6);
    expect(ch.echoCapacity).toBe(5);
    expect(ch.flags.overCapacity).toBe(true);
  });
});
