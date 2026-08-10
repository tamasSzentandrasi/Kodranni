/**
 * Tide setup (Dice Mechanics).
 * scale = weight_A + weight_B − 1
 * start from reference side weight (commonly players).
 */
export function tideScale(weightA: number, weightB: number): number {
  return weightA + weightB - 1;
}

export function tideStartFromA(weightA: number): number {
  return weightA;
}

export type TideSkirmishScale = 'tiny' | 'small' | 'battle' | 'large';

/** Marks difference required per Tide point (large = Omen only → Infinity sentinel). */
export function marksPerTidePoint(scale: TideSkirmishScale): number {
  switch (scale) {
    case 'tiny':
      return 1;
    case 'small':
      return 2;
    case 'battle':
      return 3;
    case 'large':
      return Number.POSITIVE_INFINITY;
  }
}

export function tideStepsFromMargin(marginAbs: number, scale: TideSkirmishScale): number {
  const per = marksPerTidePoint(scale);
  if (!Number.isFinite(per)) return 0;
  return Math.floor(marginAbs / per);
}
