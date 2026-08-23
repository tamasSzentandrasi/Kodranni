/**
 * Character creation point costs — Guidebook authority
 * (src/content/docs/character-creation.md).
 */

/** Cost to raise one Foundation rank (from → from+1). */
export function foundationStepCost(from: number): number {
  if (from === 0) return 1; // 0 → 1 (restore after Wanting −1 / ST path)
  if (from === 1) return 1; // 1 → 2
  if (from === 2) return 2; // 2 → 3
  throw new Error(`no Foundation step cost from ${from} (max 3 without ST+Trait)`);
}

/** Cost to raise one Skill rank (from → from+1). */
export function skillStepCost(from: number): number {
  if (from === 0) return 1; // 0 → 1
  if (from === 1) return 2; // 1 → 2
  if (from === 2) return 3; // 2 → 3
  throw new Error(`no Skill step cost from ${from} (max 3)`);
}

/** Cumulative cost from rank `from` to rank `to` (exclusive of path validation). */
export function cumulativeStepCost(
  from: number,
  to: number,
  stepCost: (from: number) => number,
): number {
  if (to < from) throw new Error('to must be ≥ from');
  if (to === from) return 0;
  let total = 0;
  for (let r = from; r < to; r++) total += stepCost(r);
  return total;
}

/** Next Foundation rank cost, or null if already at normal max (3). */
export function nextFoundationCost(rating: number): number | null {
  if (rating >= 3) return null;
  if (rating < 0) return null;
  try {
    return foundationStepCost(rating);
  } catch {
    return null;
  }
}

/** Next Skill rank cost, or null if already at max 3. */
export function nextSkillCost(rating: number): number | null {
  if (rating >= 3) return null;
  if (rating < 0) return null;
  try {
    return skillStepCost(rating);
  } catch {
    return null;
  }
}

/**
 * Points refunded when lowering Foundation by one rank (to ≥ 1).
 * Mirrors the cost that was paid for the step just undone.
 */
export function refundFoundationCost(rating: number): number | null {
  if (rating <= 1) return null;
  if (rating > 3) return null;
  try {
    return foundationStepCost(rating - 1);
  } catch {
    return null;
  }
}

/** Points refunded when lowering Skill by one rank (to ≥ 0). */
export function refundSkillCost(rating: number): number | null {
  if (rating <= 0) return null;
  if (rating > 3) return null;
  try {
    return skillStepCost(rating - 1);
  } catch {
    return null;
  }
}

/** Birth Omen: d20 face → Foundation points (⌈n/2⌉, range 1–10). */
export function birthOmenPoints(face: number): number {
  if (!Number.isInteger(face) || face < 1 || face > 20) {
    throw new Error('Birth Omen face must be an integer 1–20');
  }
  return Math.ceil(face / 2);
}

/** Guiding Hand: d20 face → Skill points (full face, range 1–20). */
export function guidingHandPoints(face: number): number {
  if (!Number.isInteger(face) || face < 1 || face > 20) {
    throw new Error('Guiding Hand face must be an integer 1–20');
  }
  return face;
}

/** Private prep grants. */
export const PREP_FOUNDATION_POINTS = 4;
export const PREP_SKILL_POINTS = 12;
