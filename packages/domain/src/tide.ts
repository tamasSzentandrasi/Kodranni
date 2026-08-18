/**
 * Tide setup and Omen bands (Tide chapter).
 * scale = weight_A + weight_B − 1
 * start from reference side weight (commonly players).
 * Three sizes only: small skirmish, skirmish, battle.
 */

export function tideScale(weightA: number, weightB: number): number {
  return weightA + weightB - 1;
}

export function tideStartFromA(weightA: number): number {
  return weightA;
}

export type TideSkirmishScale = 'small' | 'skirmish' | 'battle';

export type TideFooting = 'equal' | 'slightA' | 'slightB' | 'severeA' | 'severeB';

export type OmenBand = { towardA: [number, number]; towardB: [number, number] };

/** Marks difference required per Tide point. */
export function marksPerTidePoint(scale: TideSkirmishScale): number {
  switch (scale) {
    case 'small':
      return 1;
    case 'skirmish':
      return 2;
    case 'battle':
      return 3;
  }
}

export function tideStepsFromMargin(marginAbs: number, scale: TideSkirmishScale): number {
  const per = marksPerTidePoint(scale);
  return Math.floor(marginAbs / per);
}

const SIZE_ORDER: TideSkirmishScale[] = ['small', 'skirmish', 'battle'];

/** Equal-footing Omen width at each size. Inclusive face ranges. */
export function equalOmenBand(scale: TideSkirmishScale): OmenBand {
  switch (scale) {
    case 'small':
      return { towardA: [1, 1], towardB: [20, 20] };
    case 'skirmish':
      return { towardA: [1, 2], towardB: [19, 20] };
    case 'battle':
      return { towardA: [1, 3], towardB: [18, 20] };
  }
}

/**
 * Imbalance: disadvantaged side keeps its bad band at current size.
 * Good band is taken from N sizes smaller (slight N=1, severe N=2).
 * Good band cannot shrink below one face (Small skirmish floor).
 */
export function omenBandForFooting(scale: TideSkirmishScale, footing: TideFooting): OmenBand {
  const eq = equalOmenBand(scale);
  if (footing === 'equal') return eq;

  const n = footing.startsWith('slight') ? 1 : 2;
  const idx = SIZE_ORDER.indexOf(scale);
  const smaller = SIZE_ORDER[Math.max(0, idx - n)]!;
  const good = equalOmenBand(smaller);

  if (footing.endsWith('A')) {
    return { towardA: eq.towardA, towardB: good.towardB };
  }
  return { towardA: good.towardA, towardB: eq.towardB };
}
