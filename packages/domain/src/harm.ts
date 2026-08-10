export type ProtectionRatio = 1 | 2 | 3;

/**
 * Opposed Harm points: floor(marksDifference / protectionRatio).
 * Unopposed: floor(max(0, failures − marks) / protectionRatio).
 */
export function harmFromOpposed(marksDifference: number, ratio: ProtectionRatio): number {
  if (marksDifference <= 0) return 0;
  return Math.floor(marksDifference / ratio);
}

export function harmFromUnopposed(
  failures: number,
  marks: number,
  ratio: ProtectionRatio,
): number {
  const raw = failures - marks;
  if (raw <= 0) return 0;
  return Math.floor(raw / ratio);
}

export type Armour = 'none' | 'light' | 'heavy';

export function armourToRatio(armour: Armour, donned: boolean): ProtectionRatio {
  if (!donned || armour === 'none') return 1;
  if (armour === 'light') return 2;
  return 3;
}
