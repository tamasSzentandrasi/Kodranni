import { randomUUID } from 'node:crypto';
import {
  DEFAULT_DIE_TIER,
  type DieTier,
  computePoolSize,
  cryptoRng,
  resolveRoll,
  skillByName,
  type Rng,
} from '@kodranni/domain';
import {
  refreshCharacterDerived,
  type CharacterRecord,
  type CommunityStorePort,
} from '@kodranni/store';
import { stepTide } from './table.js';

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
  /** Title of the Echo the table agreed, when one is invoked. */
  echoName?: string;
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
  omenEffect?: string;
  /** Hidden scene face. The public card keeps the number and drops the line. */
  omenSecret?: boolean;
  /** Storyteller-only line. Not written onto the roll row. */
  omenWhisper?: string;
  practiceGained: number;
  practiceReasons: string[];
  poolFormula: string;
  whyPool: string;
  reused: boolean;
}

function publishOmen(
  store: CommunityStorePort,
  scene: readonly { face: number; effect: string; hidden?: boolean }[],
  omen: number | null,
  hit: string | null,
  rollId: string,
): { effect?: string; secret: boolean; whisper?: string } {
  if (hit === 'positive') return { effect: 'Positive Consequence', secret: false };
  if (hit === 'negative') return { effect: 'Negative Consequence', secret: false };
  if (hit === 'scene' && omen != null) {
    const row = scene.find((item) => item.face === omen);
    if (row?.hidden) {
      const prev = store.getTableState();
      const whispers = [
        ...prev.whispers,
        { face: omen, effect: row.effect, rollId, at: new Date().toISOString() },
      ].slice(-12);
      store.putTableState({ ...prev, whispers });
      return { secret: true, whisper: row.effect };
    }
    if (row) return { effect: row.effect, secret: false };
  }
  return { secret: false };
}

/**
 * An opposed roll while a Tide is open moves the marker.
 * The opening roll is side A: more Marks there increases position.
 * A reply with more Marks is side B. A tie leaves the margin step at rest; the Omen may still move.
 * Unopposed rolls do not step.
 */
function stepOpposedTide(
  store: CommunityStorePort,
  cmd: PlayerRollCommand,
  marks: number,
  omen: number | null,
): { from: number } | undefined {
  if (!cmd.parentRollId) return undefined;
  const parent = store.getRoll(cmd.parentRollId);
  const open = store.getTableState().tide;
  if (!parent || !open) return undefined;
  const parentMarks = Number((parent.data as { marks?: number }).marks ?? 0);
  const winner = parentMarks > marks ? 'A' : marks > parentMarks ? 'B' : null;
  const from = open.position;
  stepTide(store, {
    winner,
    margin: Math.abs(parentMarks - marks),
    omen,
    actor: cmd.actor,
  });
  return { from };
}

/** The pool Cast will roll, without spending or writing a roll. */
export function previewPlayerPool(
  store: CommunityStorePort,
  cmd: PlayerRollCommand,
): { poolSize: number; poolFormula: string; whyPool: string } {
  const ch = store.getCharacterBySlug(cmd.characterSlug);
  if (!ch) throw new Error(`unknown character slug: ${cmd.characterSlug}`);
  if (ch.status === 'dead') throw new Error(`${ch.name} is dead`);
  refreshCharacterDerived(ch);

  const skillName = cmd.skill?.trim() || '';
  const primitive = Boolean(cmd.primitive) || !skillName;
  let skill = primitive ? undefined : ch.skills.find((s) => s.name === skillName);
  if (!primitive) {
    const def = skillByName(skillName);
    if (!def) throw new Error(`unknown skill: ${skillName}`);
    if (!skill) {
      skill = { name: def.name, rating: 0, practice: 0, threshold: 24, foundation: def.foundation };
    }
  }
  const foundationRating = ch.foundationsEffective[cmd.foundation];
  if (foundationRating === undefined) throw new Error(`unknown foundation: ${cmd.foundation}`);

  let exertionDice = cmd.exertionDice ?? 0;
  if (exertionDice < 0 || exertionDice > 2) throw new Error('exertionDice must be 0–2');
  if (exertionDice === 2 && !cmd.echoInvoked) {
    throw new Error('second Exertion die requires a named Echo');
  }
  if (exertionDice > 0 && ch.exertion.current < exertionDice) {
    throw new Error('not enough Exertion');
  }
  if (ch.dying && exertionDice < 1) {
    throw new Error('Dying characters must spend Exertion on every roll');
  }

  const dieTier = cmd.dieTier ?? DEFAULT_DIE_TIER;
  const emptyExertion = ch.exertion.current === 0;
  const poolSize = computePoolSize({
    foundation: foundationRating,
    skill: skill?.rating ?? 0,
    exertionDice,
    emptyExertion,
    decadence: ch.flags.decadence,
    overCapEchoInvolved: ch.flags.overCapacity && Boolean(cmd.echoInvoked),
  });
  const skillRating = skill?.rating ?? 0;
  const whyParts: string[] = [
    `Foundation ${cmd.foundation}=${foundationRating}`,
    primitive
      ? 'Primitive (no Skill)'
      : `Skill ${skillName}=${skillRating}${skillRating === 0 ? ' (untrained)' : ''}`,
  ];
  if (exertionDice) whyParts.push(`Exertion +${exertionDice}`);
  if (emptyExertion) whyParts.push('empty Exertion −2 (floor 1)');
  if (ch.flags.decadence) whyParts.push('Decadence −1');
  if (ch.flags.overCapacity && cmd.echoInvoked) whyParts.push('over-cap Echo −1');
  const poolFormula = primitive
    ? `${foundationRating}${exertionDice ? `+${exertionDice}` : ''} = ${poolSize}d${dieTier}`
    : `${foundationRating}+${skillRating}${exertionDice ? `+${exertionDice}` : ''} = ${poolSize}d${dieTier}`;
  return { poolSize, poolFormula, whyPool: whyParts.join('; ') };
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

  const skillName = cmd.skill?.trim() || '';
  const primitive = Boolean(cmd.primitive) || !skillName;
  // Guidebook: named skills may be untrained (rating 0). Only "Primitive" omits Skill entirely.
  let skill = primitive ? undefined : ch.skills.find((s) => s.name === skillName);
  if (!primitive) {
    const def = skillByName(skillName);
    if (!def) throw new Error(`unknown skill: ${skillName}`);
    if (!skill) {
      // Untrained — virtual row; persisted only if Practice is gained
      skill = {
        name: def.name,
        rating: 0,
        practice: 0,
        threshold: 24,
        foundation: def.foundation,
      };
    }
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
    throw new Error('second Exertion die requires a named Echo');
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

  const scene = store.getTableState().sceneFaces;
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
    sceneOmenFaces: scene.map((row) => row.face),
  });

  const skillRating = skill?.rating ?? 0;
  const priorSkill = skillName ? ch.skills.find((s) => s.name === skillName) : undefined;
  const sheetBefore = {
    exertion: ch.exertion.current,
    status: ch.status,
    dying: Boolean(ch.dying),
    skill: skillName
      ? {
          name: skillName,
          existed: Boolean(priorSkill),
          rating: priorSkill?.rating ?? 0,
          practice: priorSkill?.practice ?? 0,
          threshold: priorSkill?.threshold ?? 24,
        }
      : null,
  };
  // Apply mutations
  if (willSpend > 0) {
    ch.exertion.current -= willSpend;
  }
  const diedOnRoll = ch.status !== 'dead' && Boolean(ch.dying) && ch.exertion.current <= 0;
  if (diedOnRoll) {
    ch.status = 'dead';
  }

  if (skill && resolved.practiceGained > 0) {
    skill.practice += resolved.practiceGained;
    while (skill.rating < 3 && skill.practice >= skill.threshold) {
      skill.practice -= skill.threshold;
      skill.rating += 1;
      if (skill.rating === 1) skill.threshold = 48;
      else if (skill.rating === 2) skill.threshold = 72;
      else skill.threshold = 9999;
    }
    if (!ch.skills.some((s) => s.name === skill.name)) {
      ch.skills.push(skill);
    }
  }

  refreshCharacterDerived(ch);
  store.putCharacter(ch);

  const rollId = randomUUID();
  const omen = publishOmen(store, scene, resolved.omen, resolved.omenHit, rollId);
  const tideStep = stepOpposedTide(store, cmd, resolved.marks, resolved.omen);
  const whyParts: string[] = [
    `Foundation ${cmd.foundation}=${foundationRating}`,
    primitive
      ? 'Primitive (no Skill)'
      : `Skill ${skillName}=${skillRating}${skillRating === 0 ? ' (untrained)' : ''}`,
  ];
  if (willSpend) whyParts.push(`Exertion +${willSpend}`);
  if (emptyExertion) whyParts.push('empty Exertion −2 (floor 1)');
  if (ch.flags.decadence) whyParts.push('Decadence −1');
  if (ch.flags.overCapacity && cmd.echoInvoked) whyParts.push('over-cap Echo −1');

  const poolFormula = primitive
    ? `${foundationRating}${willSpend ? `+${willSpend}` : ''} = ${resolved.poolSize}d${dieTier}`
    : `${foundationRating}+${skillRating}${willSpend ? `+${willSpend}` : ''} = ${resolved.poolSize}d${dieTier}`;

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
    omenEffect: omen.effect,
    practiceGained: resolved.practiceGained,
    poolSize: resolved.poolSize,
    poolFormula,
    whyPool: whyParts.join('; '),
    mythTagged: Boolean(cmd.mythTagged),
    echoInvoked: Boolean(cmd.echoInvoked),
    echoName: cmd.echoName ?? null,
    exertionSpent: willSpend,
    diedOnRoll,
    sheetBefore,
    ...(tideStep ? { tideStep } : {}),
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
    omenEffect: omen.effect,
    omenSecret: omen.secret || undefined,
    omenWhisper: omen.whisper,
    practiceGained: resolved.practiceGained,
    practiceReasons: resolved.practiceReasons,
    poolFormula,
    whyPool: whyParts.join('; '),
    reused: false,
  };
}

/** Reverse one roll’s Exertion, the Practice it wrote, Harm from that card, and a linked Tide step. */
export function undoPlayerRoll(
  store: CommunityStorePort,
  rollId: string,
  actor?: string,
): { name: string } {
  const roll = store.getRoll(rollId);
  if (!roll) throw new Error('unknown roll');
  const already = store
    .listEvents('RollUndone')
    .some((event) => (event.payload as { rollId?: string }).rollId === rollId);
  if (already) throw new Error('that roll is already undone');

  const data = roll.data as {
    npc?: boolean;
    characterSlug?: string;
    exertionSpent?: number;
    diedOnRoll?: boolean;
    sheetBefore?: {
      status?: string;
      dying?: boolean;
      skill?: {
        name: string;
        existed: boolean;
        rating: number;
        practice: number;
        threshold: number;
      } | null;
    };
    tideStep?: { from?: number };
  };
  if (data.npc || !data.characterSlug) throw new Error('an NPC roll has no sheet to undo');
  const ch = store.getCharacterBySlug(data.characterSlug);
  if (!ch) throw new Error(`unknown character slug: ${data.characterSlug}`);

  const spent = data.exertionSpent ?? 0;
  if (spent > 0) {
    ch.exertion.current = Math.min(ch.exertion.max, ch.exertion.current + spent);
  }
  if (data.diedOnRoll && ch.status === 'dead' && data.sheetBefore?.status) {
    ch.status = data.sheetBefore.status as CharacterRecord['status'];
    ch.dying = Boolean(data.sheetBefore.dying);
  }
  const prior = data.sheetBefore?.skill;
  if (prior) {
    if (!prior.existed) {
      ch.skills = ch.skills.filter((s) => s.name !== prior.name);
    } else {
      const skill = ch.skills.find((s) => s.name === prior.name);
      if (skill) {
        skill.rating = prior.rating;
        skill.practice = prior.practice;
        skill.threshold = prior.threshold;
      }
    }
  }

  for (const event of store.listEvents('HarmApplied')) {
    const payload = event.payload as {
      rollId?: string;
      applied?: { track: string; points: number }[];
    };
    if (payload.rollId !== rollId) continue;
    for (const applied of payload.applied ?? []) {
      ch.harm[applied.track] = Math.max(0, (ch.harm[applied.track] ?? 0) - applied.points);
    }
  }
  if (!Object.values(ch.harm).some((points) => points >= 3)) ch.dying = false;

  refreshCharacterDerived(ch);
  store.putCharacter(ch);

  const from = data.tideStep?.from;
  if (typeof from === 'number') {
    const table = store.getTableState();
    if (table.tide) {
      store.putTableState({ ...table, tide: { ...table.tide, position: from } });
    }
  }

  store.appendEvent({
    type: 'RollUndone',
    actor,
    payload: { rollId, characterSlug: ch.slug },
  });
  return { name: ch.name };
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
  const scene = store.getTableState().sceneFaces;
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
    sceneOmenFaces: scene.map((row) => row.face),
  });

  const rollId = randomUUID();
  const omen = publishOmen(store, scene, resolved.omen, resolved.omenHit, rollId);
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
    omenEffect: omen.effect,
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

  return {
    rollId,
    ...resolved,
    dieTier,
    omenEffect: omen.effect,
    omenSecret: omen.secret || undefined,
    omenWhisper: omen.whisper,
  };
}
