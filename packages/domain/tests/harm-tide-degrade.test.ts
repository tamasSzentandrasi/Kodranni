import { describe, expect, it } from 'vitest';
import { armourToRatio, harmFromOpposed, harmFromUnopposed } from '../src/harm.js';
import {
  degradeCountFromOmen,
  degradePool,
  downgradeSkill,
  pickDegradeTargets,
} from '../src/degrade.js';
import {
  omenBandForFooting,
  stepTidePosition,
  tideScale,
  tideStartFromA,
  tideStepsFromMargin,
  weightsForFooting,
} from '../src/tide.js';
import { echoCapacity, exertionMax, isDecadent, isOverCapacity } from '../src/echoes.js';
import { countMarks } from '../src/marks.js';

describe('harm', () => {
  it('opposed floor(3/2)=1 with light armour (Guidebook example)', () => {
    expect(harmFromOpposed(3, 2)).toBe(1);
  });

  it('unopposed floors at 0 when Marks ≥ failures', () => {
    expect(harmFromUnopposed(1, 2, 1)).toBe(0);
  });

  it('armour ratios', () => {
    expect(armourToRatio('none', true)).toBe(1);
    expect(armourToRatio('light', true)).toBe(2);
    expect(armourToRatio('heavy', true)).toBe(3);
    expect(armourToRatio('heavy', false)).toBe(1);
  });
});

describe('tide', () => {
  it('equal 8 vs 8 → scale 15 start 8', () => {
    expect(tideScale(8, 8)).toBe(15);
    expect(tideStartFromA(8)).toBe(8);
  });

  it('skirmish: margin 3 → floor(3/2)=1 step', () => {
    expect(tideStepsFromMargin(3, 'skirmish')).toBe(1);
  });

  it('omen bands: battle slight / severe match the Guidebook', () => {
    expect(omenBandForFooting('battle', 'slightA')).toEqual({
      towardA: [1, 3],
      towardB: [19, 20],
    });
    expect(omenBandForFooting('battle', 'slightB')).toEqual({
      towardA: [1, 2],
      towardB: [18, 20],
    });
    expect(omenBandForFooting('battle', 'severeA')).toEqual({
      towardA: [1, 3],
      towardB: [20, 20],
    });
    expect(omenBandForFooting('battle', 'severeB')).toEqual({
      towardA: [1, 1],
      towardB: [18, 20],
    });
  });

  it('footing weights follow the pressured side', () => {
    expect(weightsForFooting('equal')).toEqual({ weightA: 8, weightB: 8 });
    expect(weightsForFooting('severeA')).toEqual({ weightA: 6, weightB: 12 });
    expect(weightsForFooting('slightB')).toEqual({ weightA: 8, weightB: 6 });
  });

  it('margin and omen step independently, and an untied roll stays put', () => {
    expect(
      stepTidePosition({
        position: 8,
        length: 15,
        marginSteps: 1,
        winner: 'A',
        omenStep: 'A',
      }),
    ).toBe(10);
    expect(
      stepTidePosition({
        position: 8,
        length: 15,
        marginSteps: 4,
        winner: null,
        omenStep: null,
      }),
    ).toBe(8);
    expect(
      stepTidePosition({
        position: 1,
        length: 15,
        marginSteps: 3,
        winner: 'B',
        omenStep: null,
      }),
    ).toBe(0);
  });

  it('small-skirmish floor: imbalance does not shrink below one face', () => {
    expect(omenBandForFooting('small', 'severeA')).toEqual({
      towardA: [1, 1],
      towardB: [20, 20],
    });
  });
});

describe('degrade', () => {
  it('standard bands', () => {
    expect(degradeCountFromOmen(1, 'standard')).toBe(0);
    expect(degradeCountFromOmen(5, 'standard')).toBe(0);
    expect(degradeCountFromOmen(6, 'standard')).toBe(1);
    expect(degradeCountFromOmen(10, 'standard')).toBe(1);
    expect(degradeCountFromOmen(11, 'standard')).toBe(2);
    expect(degradeCountFromOmen(15, 'standard')).toBe(2);
    expect(degradeCountFromOmen(16, 'standard')).toBe(3);
    expect(degradeCountFromOmen(20, 'standard')).toBe(3);
  });

  it('short leap', () => {
    expect(degradeCountFromOmen(1, 'short')).toBe(0);
    expect(degradeCountFromOmen(10, 'short')).toBe(0);
    expect(degradeCountFromOmen(11, 'short')).toBe(1);
    expect(degradeCountFromOmen(20, 'short')).toBe(1);
  });

  it('picks the lowest fraction, caps at the pool, and skips an untouched Skill', () => {
    const skills = [
      { name: 'Zebra', rating: 1, practice: 10, threshold: 20 },
      { name: 'Alpha', rating: 1, practice: 10, threshold: 20 },
      { name: 'High', rating: 1, practice: 18, threshold: 20 },
      { name: 'Master', rating: 3, practice: 0, threshold: 72 },
      { name: 'Empty', rating: 0, practice: 0, threshold: 24 },
      { name: 'Begun', rating: 0, practice: 1, threshold: 48 },
    ];
    expect(degradePool(skills).map((skill) => skill.name)).toEqual([
      'Begun',
      'Alpha',
      'Zebra',
      'High',
      'Master',
    ]);
    const one = pickDegradeTargets(skills, 6, 'standard', () => 0);
    expect(one.count).toBe(1);
    expect(one.pool).toEqual(['Begun', 'Alpha', 'Zebra', 'High', 'Master']);
    expect(one.picked).toEqual(['Begun']);
    const capped = pickDegradeTargets(
      [{ name: 'Only', rating: 1, practice: 1, threshold: 48 }],
      20,
      'standard',
      () => 0,
    );
    expect(capped.count).toBe(1);
    expect(capped.picked).toEqual(['Only']);
    expect(degradePool([{ name: 'Empty', rating: 0, practice: 0, threshold: 24 }])).toEqual([]);
  });

  it('downgrades one rank, and clears Practice at rating 0', () => {
    const ranked = { rating: 2, practice: 30, threshold: 48 };
    downgradeSkill(ranked, 1);
    expect(ranked).toEqual({ rating: 1, practice: 0, threshold: 96 });
    const untrained = { rating: 0, practice: 12, threshold: 24 };
    downgradeSkill(untrained, 3);
    expect(untrained).toEqual({ rating: 0, practice: 0, threshold: 12 });
  });

  it('rejects an omen face outside 1–20', () => {
    expect(() => degradeCountFromOmen(0, 'standard')).toThrow(/omen/);
    expect(() => pickDegradeTargets([], 21, 'short', () => 0)).toThrow(/omen/);
  });
});

describe('echoes + marks', () => {
  it('capacity and flags', () => {
    // max(Strength, Dexterity) + Intellect + Authority
    expect(echoCapacity(2, 1, 2, 2)).toBe(6);
    expect(echoCapacity(1, 3, 2, 1)).toBe(6);
    expect(exertionMax(2, 2, 2)).toBe(6);
    expect(isDecadent(0)).toBe(true);
    expect(isOverCapacity(7, 6)).toBe(true);
  });

  it('Marks are faces ≥ 5', () => {
    expect(countMarks([5, 4, 8, 12, 1])).toBe(3);
  });
});
