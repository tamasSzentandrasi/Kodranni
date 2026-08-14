import { randomUUID } from 'node:crypto';
import { DEFAULT_DIE_TIER, type DieTier, cryptoRng, resolveRoll, type Rng } from '@kodranni/domain';
import {
  refreshCharacterDerived,
  type CharacterRecord,
  type CommunityStorePort,
} from '@kodranni/store';

export interface PlayerRollCommand {
  characterSlug: string;
  /** Foundation name as on sheet (e.g. Strength). */
  foundation: string;
  /** Skill name; omit or empty for Primitive. */
  skill?: string;
  dieTier?: DieTier;
  /** 0–2; second die requires matching Echo invoke. */
  exertionDice?: number;
  echoInvoked?: boolean;
  mythTagged?: boolean;
  parentRollId?: string;
  clientEventId?: string;
  actor?: string;
  primitive?: boolean;
  rng?: Rng;
  /** Opposed practice context after both rolls exist. */
  opposedMargin?: number;
  lostOpposed?: boolean;
  kind?: 'unopposed' | 'opposed' | 'primitive';
}

export interface PlayerRollResult {
  rollId: string;
  character: CharacterRecord;
  poolSize: number;
  dieTier: DieTier;
  faces: number[];
  marks: number;
  failures: number;
  omen: number | null;
  omenHit: string | null;
  practiceGained: number;
  practiceReasons: string[];
  poolFormula: string;
  whyPool: string;
  reused: boolean;
}

export function executePlayerRoll(
  store: CommunityStorePort,
  cmd: PlayerRollCommand,
): PlayerRollResult {
  if (cmd.clientEventId && store.hasClientEvent(cmd.clientEventId)) {
    // Recover last roll for this client event from events payload if present
    // For simplicity return a throw — caller should not double-submit without handling.
    // Better: find event and reconstruct. We'll scan rolls via events.
  }

  if (cmd.clientEventId && store.hasClientEvent(cmd.clientEventId)) {
    throw new Error(`duplicate clientEventId: ${cmd.clientEventId}`);
  }

  const ch = store.getCharacterBySlug(cmd.characterSlug);
  if (!ch) throw new Error(`unknown character slug: ${cmd.characterSlug}`);
  if (ch.status === 'dead') throw new Error(`${ch.name} is dead`);

  refreshCharacterDerived(ch);

  const primitive = cmd.primitive || !cmd.skill;
  const skillName = cmd.skill?.trim() || '';
  const skill = primitive ? undefined : ch.skills.find((s) => s.name === skillName);
  if (!primitive && !skill) {
    throw new Error(`character lacks skill: ${skillName}`);
  }

  const foundationRating = ch.foundationsEffective[cmd.foundation];
  if (foundationRating === undefined) {
    throw new Error(`unknown foundation: ${cmd.foundation}`);
  }

  let exertionDice = cmd.exertionDice ?? 0;
  if (exertionDice < 0 || exertionDice > 2) {
    throw new Error('exertionDice must be 0–2');
  }
  if (exertionDice === 2 && !cmd.echoInvoked) {
    throw new Error('second Exertion die requires Echo invocation');
  }
  if (exertionDice > 0 && ch.exertion.current < exertionDice) {
    throw new Error('not enough Exertion');
  }
  if (ch.dying && exertionDice < 1) {
    throw new Error('Dying characters must spend Exertion on every roll');
  }

  const willSpend = exertionDice;
  // Guidebook: empty Exertion means current pool is zero when the roll is thrown
  const emptyExertion = ch.exertion.current === 0;

  const dieTier = cmd.dieTier ?? DEFAULT_DIE_TIER;
  const kind = primitive ? 'primitive' : (cmd.kind ?? 'unopposed');

  const resolved = resolveRoll({
    foundation: foundationRating,
    skill: skill?.rating ?? 0,
    exertionDice: willSpend,
    emptyExertion,
    decadence: ch.flags.decadence,
    overCapEchoInvolved: ch.flags.overCapacity && Boolean(cmd.echoInvoked),
    dieTier,
    kind,
    exertionSpent: willSpend > 0,
    opposedMargin: cmd.opposedMargin,
    lostOpposed: cmd.lostOpposed,
    rng: cmd.rng ?? cryptoRng(),
  });

  // Apply mutations
  if (willSpend > 0) {
    ch.exertion.current -= willSpend;
  }
  if (ch.dying && ch.exertion.current <= 0) {
    ch.status = 'dead';
  }

  if (skill && resolved.practiceGained > 0) {
    skill.practice += resolved.practiceGained;
    // level-up if threshold met
    while (skill.rating < 3 && skill.practice >= skill.threshold) {
      skill.practice -= skill.threshold;
      skill.rating += 1;
      // threshold for next rank uses domain helper via stored threshold update in app later; simple bump:
      if (skill.rating === 1) skill.threshold = 48;
      else if (skill.rating === 2) skill.threshold = 72;
      else skill.threshold = 9999;
    }
  }

  refreshCharacterDerived(ch);
  store.putCharacter(ch);

  const rollId = randomUUID();
  const whyParts: string[] = [
    `Foundation ${cmd.foundation}=${foundationRating}`,
    primitive ? 'Primitive (no Skill)' : `Skill ${skillName}=${skill!.rating}`,
  ];
  if (willSpend) whyParts.push(`Exertion +${willSpend}`);
  if (emptyExertion) whyParts.push('empty Exertion −2 (floor 1)');
  if (ch.flags.decadence) whyParts.push('Decadence −1');
  if (ch.flags.overCapacity && cmd.echoInvoked) whyParts.push('over-cap Echo −1');

  const poolFormula = primitive
    ? `${foundationRating}${willSpend ? `+${willSpend}` : ''} = ${resolved.poolSize}d${dieTier}`
    : `${foundationRating}+${skill!.rating}${willSpend ? `+${willSpend}` : ''} = ${resolved.poolSize}d${dieTier}`;

  const rollData = {
    characterSlug: ch.slug,
    foundation: cmd.foundation,
    skill: skillName || null,
    primitive,
    dieTier,
    faces: resolved.faces,
    marks: resolved.marks,
    failures: resolved.failures,
    omen: resolved.omen,
    omenHit: resolved.omenHit,
    practiceGained: resolved.practiceGained,
    poolSize: resolved.poolSize,
    poolFormula,
    whyPool: whyParts.join('; '),
    mythTagged: Boolean(cmd.mythTagged),
    echoInvoked: Boolean(cmd.echoInvoked),
  };

  store.insertRoll({
    id: rollId,
    ts: new Date().toISOString(),
    characterId: ch.id,
    parentRollId: cmd.parentRollId,
    data: rollData,
  });

  store.appendEvent({
    type: 'RollResolved',
    actor: cmd.actor,
    clientEventId: cmd.clientEventId,
    payload: { rollId, ...rollData },
  });

  return {
    rollId,
    character: ch,
    poolSize: resolved.poolSize,
    dieTier,
    faces: resolved.faces,
    marks: resolved.marks,
    failures: resolved.failures,
    omen: resolved.omen,
    omenHit: resolved.omenHit,
    practiceGained: resolved.practiceGained,
    practiceReasons: resolved.practiceReasons,
    poolFormula,
    whyPool: whyParts.join('; '),
    reused: false,
  };
}

export interface StorytellerNpcRollCommand {
  label: string;
  foundation: number;
  skill: number;
  dieTier?: DieTier;
  exertionDice?: number;
  emptyExertion?: boolean;
  clientEventId?: string;
  actor?: string;
  parentRollId?: string;
  rng?: Rng;
}

export function executeStorytellerNpcRoll(
  store: CommunityStorePort,
  cmd: StorytellerNpcRollCommand,
) {
  const dieTier = cmd.dieTier ?? DEFAULT_DIE_TIER;
  const exertionDice = cmd.exertionDice ?? 0;
  const resolved = resolveRoll({
    foundation: cmd.foundation,
    skill: cmd.skill,
    exertionDice,
    emptyExertion: Boolean(cmd.emptyExertion),
    decadence: false,
    overCapEchoInvolved: false,
    dieTier,
    kind: 'unopposed',
    exertionSpent: exertionDice > 0,
    rng: cmd.rng ?? cryptoRng(),
  });

  const rollId = randomUUID();
  const rollData = {
    label: cmd.label,
    npc: true,
    foundation: cmd.foundation,
    skill: cmd.skill,
    dieTier,
    faces: resolved.faces,
    marks: resolved.marks,
    failures: resolved.failures,
    omen: resolved.omen,
    omenHit: resolved.omenHit,
    poolSize: resolved.poolSize,
  };

  store.insertRoll({
    id: rollId,
    ts: new Date().toISOString(),
    parentRollId: cmd.parentRollId,
    data: rollData,
  });
  store.appendEvent({
    type: 'NpcRollResolved',
    actor: cmd.actor,
    clientEventId: cmd.clientEventId,
    payload: { rollId, ...rollData },
  });

  return { rollId, ...resolved, dieTier };
}
