import { describe, expect, it } from 'vitest';
import {
  HARM_TRACKS,
  precalcHarmPoints,
  reputationGapToRatio,
} from '../src/harm.js';

describe('precalcHarmPoints', () => {
  it('opposed floors marksDifference / ratio', () => {
    expect(precalcHarmPoints({ kind: 'opposed', marksDifference: 3, ratio: 2 })).toBe(1);
    expect(precalcHarmPoints({ kind: 'opposed', marksDifference: 0, ratio: 1 })).toBe(0);
  });

  it('unopposed floors (failures − marks) / ratio', () => {
    expect(
      precalcHarmPoints({ kind: 'unopposed', failures: 4, marks: 1, ratio: 1 }),
    ).toBe(3);
  });
});

describe('reputationGapToRatio', () => {
  it('maps gap to 1|2|3', () => {
    expect(reputationGapToRatio(0)).toBe(1);
    expect(reputationGapToRatio(1)).toBe(2);
    expect(reputationGapToRatio(2)).toBe(3);
    expect(reputationGapToRatio(5)).toBe(3);
  });
});

describe('HARM_TRACKS', () => {
  it('has nine tracks', () => {
    const n = Object.values(HARM_TRACKS).flat().length;
    expect(n).toBe(9);
  });
});
