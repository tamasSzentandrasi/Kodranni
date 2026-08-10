/**
 * Prompted Practice degrade (Skills).
 * Standard: Omen bands 0–4 → 0, 5–9 → 1, 10–14 → 2, 15–20 → 3 skills from five lowest.
 * Short: 0–9 → 0, 10–20 → 1.
 *
 * Note: Guidebook uses Omen d20 faces 1–20; band "0–4" is treated as 1–4 for a d20
 * (face 0 does not exist). Face 20 sits in the top band for both tables.
 */

export type DegradeMode = 'standard' | 'short';

export function degradeCountFromOmen(omen: number, mode: DegradeMode): number {
  if (omen < 1 || omen > 20) throw new Error(`invalid omen face: ${omen}`);

  if (mode === 'short') {
    if (omen <= 9) return 0;
    return 1;
  }

  // standard
  if (omen <= 4) return 0;
  if (omen <= 9) return 1;
  if (omen <= 14) return 2;
  return 3;
}
