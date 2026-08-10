import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../src/rng.js';
import { resolveRoll } from '../src/roll.js';

describe('resolveRoll', () => {
  it('returns pool faces, marks, and omen', () => {
    const r = resolveRoll({
      foundation: 2,
      skill: 2,
      exertionDice: 0,
      emptyExertion: false,
      decadence: false,
      overCapEchoInvolved: false,
      dieTier: 8,
      kind: 'unopposed',
      exertionSpent: false,
      rng: mulberry32(42),
    });
    expect(r.poolSize).toBe(4);
    expect(r.faces).toHaveLength(4);
    expect(r.omen).toBeTypeOf('number');
    expect(r.omen).toBeGreaterThanOrEqual(1);
    expect(r.omen).toBeLessThanOrEqual(20);
    expect(r.marks + r.failures).toBe(4);
  });

  it('primitive grants no practice', () => {
    const r = resolveRoll({
      foundation: 3,
      skill: 0,
      exertionDice: 0,
      emptyExertion: false,
      decadence: false,
      overCapEchoInvolved: false,
      dieTier: 8,
      kind: 'primitive',
      exertionSpent: true,
      rng: mulberry32(7),
    });
    expect(r.practiceGained).toBe(0);
  });
});
