/**
 * Prompted Practice degrade (Skills).
 * Equal d20 bands (faces 1–20):
 * Standard: 1–5 → 0, 6–10 → 1, 11–15 → 2, 16–20 → 3 skills from five lowest.
 * Short: 1–10 → 0, 11–20 → 1.
 */
import type { Rng } from './rng.js';
import { skillThreshold } from './practice.js';

export type DegradeMode = 'standard' | 'short';

export interface DegradeSkill {
  name: string;
  rating: number;
  practice: number;
  threshold: number;
}

/** Rating 3 is last in line. A non-positive bar does not invent progress. */
export function degradeProgress(skill: DegradeSkill): number {
  if (skill.rating >= 3) return 1;
  if (skill.threshold <= 0) return 0;
  return skill.practice / skill.threshold;
}

/** A sheet Skill with a rank or any Practice. Untouched catalog Skills stay out. */
export function qualifiesForDegrade(skill: DegradeSkill): boolean {
  return skill.rating > 0 || skill.practice > 0;
}

/** Lowest progress first, then name. Capped at five. */
export function degradePool(skills: readonly DegradeSkill[], limit = 5): DegradeSkill[] {
  return skills
    .filter(qualifiesForDegrade)
    .slice()
    .sort((a, b) => {
      const gap = degradeProgress(a) - degradeProgress(b);
      if (gap !== 0) return gap;
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);
}

/**
 * Draw `count` names from the pool without replacement.
 * The count is capped at the pool. The caller supplies the die and the random source.
 */
export function pickDegradeTargets(
  skills: readonly DegradeSkill[],
  omen: number,
  mode: DegradeMode,
  rng: Rng,
): { count: number; pool: string[]; picked: string[] } {
  const wanted = degradeCountFromOmen(omen, mode);
  const pool = degradePool(skills);
  const count = Math.min(wanted, pool.length);
  const bag = pool.map((skill) => skill.name);
  const picked: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const index = Math.min(bag.length - 1, Math.floor(rng() * bag.length));
    const [name] = bag.splice(index, 1);
    if (name) picked.push(name);
  }
  return { count, pool: pool.map((skill) => skill.name), picked };
}

/** One rank down, or Practice cleared at rating 0. The new bar follows the ruling Foundation. */
export function downgradeSkill(
  skill: { rating: number; practice: number; threshold: number },
  rulingFoundation: number,
): void {
  if (skill.rating >= 1) skill.rating -= 1;
  if (skill.rating < 0) skill.rating = 0;
  if (skill.rating > 3) skill.rating = 3;
  skill.practice = 0;
  skill.threshold = skillThreshold(skill.rating, rulingFoundation);
}

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
