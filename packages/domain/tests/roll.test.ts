import { describe, expect, it } from 'vitest';
import { mulberry32, type Rng } from '../src/rng.js';
import { resolveRoll } from '../src/roll.js';

/** Die results in order. Each value sits in the middle of that face's bucket. */
function scripted(faces: number[], sides: number[]): Rng {
  let i = 0;
  return () => {
    const face = faces[i] ?? 1;
    const side = sides[i] ?? 20;
    i += 1;
    return (face - 0.5) / side;
  };
}

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

  it('names a scene face, and leaves 7 and 13 as their own hits', () => {
    const base = {
      foundation: 1,
      skill: 0,
      exertionDice: 0,
      emptyExertion: false,
      decadence: false,
      overCapEchoInvolved: false,
      dieTier: 8 as const,
      kind: 'primitive' as const,
      exertionSpent: false,
      sceneOmenFaces: [4],
    };
    const scene = resolveRoll({ ...base, rng: scripted([1, 4], [8, 20]) });
    expect(scene.omen).toBe(4);
    expect(scene.omenHit).toBe('scene');

    const positive = resolveRoll({ ...base, rng: scripted([1, 7], [8, 20]) });
    expect(positive.omenHit).toBe('positive');

    const negative = resolveRoll({ ...base, rng: scripted([1, 13], [8, 20]) });
    expect(negative.omenHit).toBe('negative');

    const blank = resolveRoll({ ...base, rng: scripted([1, 9], [8, 20]) });
    expect(blank.omenHit).toBeNull();
  });
});
