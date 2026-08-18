/**
 * Prompted Practice degrade (Skills).
 * Equal d20 bands (faces 1–20):
 * Standard: 1–5 → 0, 6–10 → 1, 11–15 → 2, 16–20 → 3 skills from five lowest.
 * Short: 1–10 → 0, 11–20 → 1.
 */

export type DegradeMode = 'standard' | 'short';

export function degradeCountFromOmen(omen: number, mode: DegradeMode): number {
  if (omen < 1 || omen > 20) throw new Error(`invalid omen face: ${omen}`);

  if (mode === 'short') {
    if (omen <= 10) return 0;
    return 1;
  }

  // standard — four equal 5-face bands
  if (omen <= 5) return 0;
  if (omen <= 10) return 1;
  if (omen <= 15) return 2;
  return 3;
}
