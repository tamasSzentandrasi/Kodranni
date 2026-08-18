import { describe, expect, it } from 'vitest';
import { armourToRatio, harmFromOpposed, harmFromUnopposed } from '../src/harm.js';
import { degradeCountFromOmen } from '../src/degrade.js';
import { omenBandForFooting, tideScale, tideStartFromA, tideStepsFromMargin } from '../src/tide.js';
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
