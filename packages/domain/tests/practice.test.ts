import { describe, expect, it } from 'vitest';
import { practiceGain, practiceThreshold } from '../src/practice.js';

describe('practiceGain', () => {
  it('Primitive / no skill → 0', () => {
    expect(
      practiceGain({
        kind: 'unopposed',
        usedSkill: false,
        exertionSpent: true,
        marks: 4,
        failures: 0,
      }).gained,
    ).toBe(0);
  });

  it('unopposed: more failures than Marks → +2 (Exertion free)', () => {
    const r = practiceGain({
      kind: 'unopposed',
      usedSkill: true,
      exertionSpent: false,
      marks: 1,
      failures: 3,
    });
    expect(r.gained).toBe(2);
  });

  it('unopposed: Exertion + 4 Marks → +2 (floor 4/2)', () => {
    const r = practiceGain({
      kind: 'unopposed',
      usedSkill: true,
      exertionSpent: true,
      marks: 4,
      failures: 0,
    });
    expect(r.gained).toBe(2);
  });

  it('opposed: margin with Exertion awards margin', () => {
    const r = practiceGain({
      kind: 'opposed',
      usedSkill: true,
      exertionSpent: true,
      marks: 3,
      failures: 1,
      margin: 2,
      lostOpposed: false,
    });
    expect(r.gained).toBe(2);
  });

  it('opposed: margin 0 → no automatic margin Practice', () => {
    const r = practiceGain({
      kind: 'opposed',
      usedSkill: true,
      exertionSpent: true,
      marks: 2,
      failures: 1,
      margin: 0,
      lostOpposed: false,
    });
    expect(r.gained).toBe(0);
  });

  it('opposed loss → +2 regardless of Exertion', () => {
    const r = practiceGain({
      kind: 'opposed',
      usedSkill: true,
      exertionSpent: false,
      marks: 0,
      failures: 3,
      margin: -2,
      lostOpposed: true,
    });
    expect(r.gained).toBe(2);
  });
});

describe('practiceThreshold', () => {
  it('base 0→1 is 24; Foundation 3 halves; Foundation 1 doubles', () => {
    expect(practiceThreshold(0, 2)).toBe(24);
    expect(practiceThreshold(0, 3)).toBe(12);
    expect(practiceThreshold(0, 1)).toBe(48);
  });
});
