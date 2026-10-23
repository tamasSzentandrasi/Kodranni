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

/**
 * Book presets. The suffix is the side under pressure: it keeps the wider
 * bad Omen band and the lower weight. Severe is 6 vs 12; slight is 6 vs 8.
 */
export function weightsForFooting(footing: TideFooting): { weightA: number; weightB: number } {
  switch (footing) {
    case 'equal':
      return { weightA: 8, weightB: 8 };
    case 'slightA':
      return { weightA: 6, weightB: 8 };
    case 'slightB':
      return { weightA: 8, weightB: 6 };
    case 'severeA':
      return { weightA: 6, weightB: 12 };
    case 'severeB':
      return { weightA: 12, weightB: 6 };
  }
}

/**
 * Position 0 is side A's collapse.
 * Winner A moves away from that end, toward B.
 * An omen step of A is a face that pushes toward A's collapse.
 */
export function stepTidePosition(input: {
  position: number;
  length: number;
  marginSteps: number;
  winner: 'A' | 'B' | null;
  omenStep: 'A' | 'B' | null;
}): number {
  let position = input.position;
  if (input.winner === 'A') position += input.marginSteps;
  if (input.winner === 'B') position -= input.marginSteps;
  if (input.omenStep === 'A') position -= 1;
  if (input.omenStep === 'B') position += 1;
  return Math.max(0, Math.min(input.length, position));
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
