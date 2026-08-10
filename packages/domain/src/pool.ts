export type DieTier = 6 | 8 | 12;

export const DEFAULT_DIE_TIER: DieTier = 8;

export interface PoolInput {
  /** Effective Foundation after Harm (may be 0). */
  foundation: number;
  /** Skill rating 0–3; use 0 for Primitive. */
  skill: number;
  /** Extra dice from Exertion spend (0–2 with Echo). */
  exertionDice: number;
  /** Current Exertion pool is empty → −2 dice. */
  emptyExertion: boolean;
  /** No Echoes at all (Decadence) → −1 die on every roll. */
  decadence: boolean;
  /** Over capacity and this roll involves an Echo → −1 die. */
  overCapEchoInvolved: boolean;
}

/**
 * Pool size before rolling. Never drops below 1 die.
 * Guidebook: Foundation + Skill + optional Exertion, then shrinkage, floor 1.
 */
export function computePoolSize(input: PoolInput): number {
  let n =
    Math.max(0, input.foundation) +
    Math.max(0, input.skill) +
    Math.max(0, input.exertionDice);

  if (input.emptyExertion) n -= 2;
  if (input.decadence) n -= 1;
  if (input.overCapEchoInvolved) n -= 1;

  return Math.max(1, n);
}

export function effectiveFoundation(rating: number, harmOnTrack: number): number {
  return Math.max(0, rating - harmOnTrack);
}
