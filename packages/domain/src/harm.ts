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

/** Harm track families — an infliction is one family only (Guidebook). */
export type HarmFamily = 'physical' | 'mental' | 'social';

export const HARM_TRACKS: Record<HarmFamily, readonly string[]> = {
  physical: ['Crushed', 'Bleeding', 'Fever'],
  mental: ['Fog', 'Disoriented', 'Shock'],
  social: ['Tarnished', 'Exposed', 'Disgrace'],
} as const;

export function isHarmTrack(name: string): boolean {
  return Object.values(HARM_TRACKS).some((tracks) => tracks.includes(name));
}

export function familyForTrack(track: string): HarmFamily | undefined {
  for (const [fam, tracks] of Object.entries(HARM_TRACKS) as [HarmFamily, readonly string[]][]) {
    if (tracks.includes(track)) return fam;
  }
  return undefined;
}

/**
 * Reputation protection ratio from hierarchy tier gap (max two tiers → ratio 3).
 * gap 0 → 1, gap 1 → 2, gap ≥2 → 3.
 */
export function reputationGapToRatio(tierGap: number): ProtectionRatio {
  const g = Math.max(0, Math.floor(tierGap));
  if (g <= 0) return 1;
  if (g === 1) return 2;
  return 3;
}

/** Precalculate available harm points from roll outcomes (ST still assigns tracks). */
export function precalcHarmPoints(input: {
  kind: 'opposed' | 'unopposed';
  ratio: ProtectionRatio;
  /** Opposed: winner marks − loser marks (positive if attacker wins). */
  marksDifference?: number;
  /** Unopposed: failures and marks on the roll. */
  failures?: number;
  marks?: number;
}): number {
  if (input.kind === 'opposed') {
    return harmFromOpposed(input.marksDifference ?? 0, input.ratio);
  }
  return harmFromUnopposed(input.failures ?? 0, input.marks ?? 0, input.ratio);
}
