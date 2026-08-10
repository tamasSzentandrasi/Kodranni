import { countFailures, countMarks } from './marks.js';
import { computePoolSize, type DieTier, type PoolInput } from './pool.js';
import { practiceGain, type PracticeRollKind } from './practice.js';
import { rollDice, type Rng } from './rng.js';

export interface ResolveRollInput extends PoolInput {
  dieTier: DieTier;
  /** Include Omen d20 (always true in Kodranni; kept explicit). */
  includeOmen?: boolean;
  kind: PracticeRollKind | 'primitive';
  exertionSpent: boolean;
  /** Opposed margin for practice (this side marks − other). */
  opposedMargin?: number;
  lostOpposed?: boolean;
  rng: Rng;
  /** Optional scene Omen faces that fire Consequence (plus defaults 7, 13). */
  sceneOmenFaces?: readonly number[];
}

export interface ResolveRollResult {
  poolSize: number;
  dieTier: DieTier;
  faces: number[];
  marks: number;
  failures: number;
  omen: number | null;
  omenHit: 'positive' | 'negative' | 'scene' | null;
  practiceGained: number;
  practiceReasons: string[];
}

const DEFAULT_POSITIVE_OMEN = 7;
const DEFAULT_NEGATIVE_OMEN = 13;

export function resolveRoll(input: ResolveRollInput): ResolveRollResult {
  const poolSize = computePoolSize(input);
  const faces = rollDice(poolSize, input.dieTier, input.rng);
  const marks = countMarks(faces);
  const failures = countFailures(faces);

  let omen: number | null = null;
  let omenHit: ResolveRollResult['omenHit'] = null;
  if (input.includeOmen !== false) {
    omen = rollDice(1, 20, input.rng)[0]!;
    const scene = input.sceneOmenFaces ?? [];
    if (scene.includes(omen)) omenHit = 'scene';
    else if (omen === DEFAULT_POSITIVE_OMEN) omenHit = 'positive';
    else if (omen === DEFAULT_NEGATIVE_OMEN) omenHit = 'negative';
  }

  const usedSkill = input.kind !== 'primitive' && input.skill > 0;
  const practice =
    input.kind === 'primitive'
      ? { gained: 0, reasons: ['primitive'] }
      : practiceGain({
          kind: input.kind === 'opposed' ? 'opposed' : 'unopposed',
          usedSkill,
          exertionSpent: input.exertionSpent,
          marks,
          failures,
          margin: input.opposedMargin,
          lostOpposed: input.lostOpposed,
        });

  return {
    poolSize,
    dieTier: input.dieTier,
    faces,
    marks,
    failures,
    omen,
    omenHit,
    practiceGained: practice.gained,
    practiceReasons: practice.reasons,
  };
}
