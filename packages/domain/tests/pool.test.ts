import { describe, expect, it } from 'vitest';
import { computePoolSize, effectiveFoundation } from '../src/pool.js';

describe('computePoolSize', () => {
  it('Foundation + Skill (Tomas pool: 2+2 = 4)', () => {
    expect(
      computePoolSize({
        foundation: 2,
        skill: 2,
        exertionDice: 0,
        emptyExertion: false,
        decadence: false,
        overCapEchoInvolved: false,
      }),
    ).toBe(4);
  });

  it('Primitive uses Foundation only', () => {
    expect(
      computePoolSize({
        foundation: 3,
        skill: 0,
        exertionDice: 0,
        emptyExertion: false,
        decadence: false,
        overCapEchoInvolved: false,
      }),
    ).toBe(3);
  });

  it('empty Exertion applies −2 with floor 1', () => {
    expect(
      computePoolSize({
        foundation: 1,
        skill: 0,
        exertionDice: 0,
        emptyExertion: true,
        decadence: false,
        overCapEchoInvolved: false,
      }),
    ).toBe(1);
  });

  it('Decadence −1', () => {
    expect(
      computePoolSize({
        foundation: 2,
        skill: 1,
        exertionDice: 0,
        emptyExertion: false,
        decadence: true,
        overCapEchoInvolved: false,
      }),
    ).toBe(2);
  });

  it('over-cap Echo involved −1', () => {
    expect(
      computePoolSize({
        foundation: 2,
        skill: 2,
        exertionDice: 1,
        emptyExertion: false,
        decadence: false,
        overCapEchoInvolved: true,
      }),
    ).toBe(4);
  });

  it('never below 1 even when all penalties stack', () => {
    expect(
      computePoolSize({
        foundation: 1,
        skill: 0,
        exertionDice: 0,
        emptyExertion: true,
        decadence: true,
        overCapEchoInvolved: true,
      }),
    ).toBe(1);
  });
});

describe('effectiveFoundation', () => {
  it('subtracts Harm and floors at 0', () => {
    expect(effectiveFoundation(2, 1)).toBe(1);
    expect(effectiveFoundation(2, 5)).toBe(0);
  });
});
