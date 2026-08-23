import { randomUUID } from 'node:crypto';
import {
  practiceThreshold,
  rollDie,
  skillByName,
  type Rng,
  cryptoRng,
} from '@kodranni/domain';
import {
  refreshCharacterDerived,
  type CharacterRecord,
  type CommunityStorePort,
  type CreationState,
  type EchoRecord,
  type InventoryItem,
  type MemberRecord,
  type PlayerBinding,
  type SkillProgress,
  type TraitRecord,
} from '@kodranni/store';
import {
  PREP_FOUNDATION_POINTS,
  PREP_SKILL_POINTS,
  birthOmenPoints,
  foundationStepCost,
  guidingHandPoints,
  refundFoundationCost,
  refundSkillCost,
  skillStepCost,
} from './costs.js';

export const FOUNDATION_NAMES = [
  'Strength',
  'Dexterity',
  'Constitution',
  'Intellect',
  'Perception',
  'Resolve',
  'Charisma',
  'Guile',
  'Authority',
] as const;

const EMPTY_HARM: Record<string, number> = {
  Crushed: 0,
  Bleeding: 0,
  Fever: 0,
  Fog: 0,
  Disoriented: 0,
  Shock: 0,
  Tarnished: 0,
  Exposed: 0,
  Disgrace: 0,
};

function baseFoundations(): Record<string, number> {
  return Object.fromEntries(FOUNDATION_NAMES.map((n) => [n, 1]));
}

function defaultCreation(overrides?: Partial<CreationState>): CreationState {
  return {
    foundationPoints: PREP_FOUNDATION_POINTS,
    skillPoints: PREP_SKILL_POINTS,
    words: 0,
    birthOmenGranted: false,
    guidingHandGranted: false,
    locked: false,
    claimable: false,
    ...overrides,
  };
}

/** Living seed sheets without creation block are treated as locked. */
export function isCreationLocked(ch: CharacterRecord): boolean {
  if (ch.creation) return ch.creation.locked;
  return ch.status === 'active' || ch.status === 'dead';
}

export function ensureCreation(ch: CharacterRecord): CreationState {
  if (!ch.creation) {
    ch.creation = defaultCreation({
      foundationPoints: 0,
      skillPoints: 0,
      locked: isCreationLocked(ch),
    });
  }
  return ch.creation;
}

function slugify(name: string): string {
  const base = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return base || 'character';
}

function uniqueSlug(store: CommunityStorePort, base: string): string {
  let slug = base;
  let n = 2;
  while (store.getCharacterBySlug(slug)) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

function emptyDraft(partial: {
  id?: string;
  slug: string;
  name: string;
  kind?: CharacterRecord['kind'];
  status?: CharacterRecord['status'];
  communityTie?: string;
  concept?: string;
  initiator?: CharacterRecord['initiator'];
  player?: PlayerBinding;
  creation?: CreationState;
  claimable?: boolean;
}): CharacterRecord {
  const creation = partial.creation ?? defaultCreation({ claimable: partial.claimable });
  if (partial.claimable) creation.claimable = true;
  const ch: CharacterRecord = {
    id: partial.id ?? randomUUID(),
    slug: partial.slug,
    name: partial.name,
    kind: partial.kind ?? 'pc',
    status: partial.status ?? 'draft',
    communityTie: partial.communityTie ?? '',
    concept: partial.concept,
    initiator: partial.initiator,
    player: partial.player,
    creation,
    foundations: baseFoundations(),
    foundationsEffective: {},
    skills: [],
    traits: [],
    exertion: { current: 0, max: 0 },
    echoes: [],
    echoCapacity: 0,
    echoWeight: 0,
    harm: { ...EMPTY_HARM },
    dying: false,
    hierarchy: [{ axis: 'Arms', tier: 'Outcast' }],
    armour: { kind: 'none', donned: false },
    inventory: { foodDays: 0, waterDays: 0, items: [] },
    flags: { decadence: true, overCapacity: false },
  };
  return refreshCharacterDerived(ch);
}

// --- Start create / claim from bot ---

export interface StartCreateFromBotCommand {
  platform: 'discord' | 'fluxer' | string;
  accountId: string;
  displayName: string;
  /** Optional provisional name; default “Unnamed”. */
  name?: string;
  actor?: string;
}

export interface StartCreateFromBotResult {
  character: CharacterRecord;
}

/** Bot: player starts creation — draft + initiator for Confirm @mention. */
export function startCreateFromBot(
  store: CommunityStorePort,
  cmd: StartCreateFromBotCommand,
): StartCreateFromBotResult {
  const name = (cmd.name?.trim() || 'Unnamed').slice(0, 80);
  const slug = uniqueSlug(store, slugify(name === 'Unnamed' ? `draft-${cmd.accountId.slice(-6)}` : name));
  const initiator = {
    platform: cmd.platform,
    accountId: cmd.accountId,
    displayName: cmd.displayName,
  };
  const ch = emptyDraft({
    slug,
    name,
    initiator,
    // Not fully bound until ST Approve — player field set on approve
  });
  store.putCharacter(ch);
  store.appendEvent({
    type: 'CharacterDraftStarted',
    actor: cmd.actor ?? cmd.accountId,
    payload: {
      characterSlug: ch.slug,
      platform: cmd.platform,
      accountId: cmd.accountId,
    },
  });
  return { character: store.getCharacterBySlug(ch.slug)! };
}

export interface CreatePrebuiltCommand {
  name: string;
  slug?: string;
  concept?: string;
  communityTie?: string;
  claimable?: boolean;
  /** If false, keep locked living prebuilt; default claimable draft unlocked. */
  asDraft?: boolean;
  actor?: string;
}

/** ST creates a prebuilt (often claimable guest). */
export function createPrebuilt(
  store: CommunityStorePort,
  cmd: CreatePrebuiltCommand,
): CharacterRecord {
  const name = cmd.name.trim();
  if (!name) throw new Error('name required');
  const slug = uniqueSlug(store, cmd.slug ? slugify(cmd.slug) : slugify(name));
  const asDraft = cmd.asDraft !== false;
  const ch = emptyDraft({
    slug,
    name,
    concept: cmd.concept,
    communityTie: cmd.communityTie ?? '',
    status: asDraft ? 'draft' : 'active',
    creation: defaultCreation({
      claimable: cmd.claimable ?? true,
      locked: !asDraft,
      foundationPoints: asDraft ? PREP_FOUNDATION_POINTS : 0,
      skillPoints: asDraft ? PREP_SKILL_POINTS : 0,
    }),
  });
  store.putCharacter(ch);
  store.appendEvent({
    type: 'CharacterPrebuiltCreated',
    actor: cmd.actor,
    payload: { characterSlug: ch.slug, claimable: ch.creation?.claimable },
  });
  return store.getCharacterBySlug(ch.slug)!;
}

export interface StartClaimFromBotCommand {
  platform: 'discord' | 'fluxer' | string;
  accountId: string;
  displayName: string;
  characterSlug: string;
  actor?: string;
}

/** Bot: player claims a claimable prebuilt — attaches initiator. */
export function startClaimFromBot(
  store: CommunityStorePort,
  cmd: StartClaimFromBotCommand,
): CharacterRecord {
  const ch = store.getCharacterBySlug(cmd.characterSlug);
  if (!ch) throw new Error(`unknown character: ${cmd.characterSlug}`);
  const creation = ensureCreation(ch);
  if (!creation.claimable) {
    throw new Error('character is not claimable');
  }
  if (ch.player?.accountId && ch.player.accountId !== cmd.accountId) {
    throw new Error('character already claimed by another player');
  }
  ch.initiator = {
    platform: cmd.platform,
    accountId: cmd.accountId,
    displayName: cmd.displayName,
  };
  // Soft claim on sheet until Confirm + Approve
  ch.player = {
    platform: cmd.platform,
    accountId: cmd.accountId,
    displayName: cmd.displayName,
  };
  store.putCharacter(ch);
  store.appendEvent({
    type: 'CharacterClaimStarted',
    actor: cmd.actor ?? cmd.accountId,
    payload: {
      characterSlug: ch.slug,
      platform: cmd.platform,
      accountId: cmd.accountId,
    },
  });
  return store.getCharacterBySlug(ch.slug)!;
}

/** Sheet: claim without bot is allowed only if already claimable — still needs initiator for Confirm. */
export function claimCharacter(
  store: CommunityStorePort,
  cmd: {
    characterSlug: string;
    platform: string;
    accountId: string;
    displayName: string;
    actor?: string;
  },
): CharacterRecord {
  return startClaimFromBot(store, cmd);
}

// --- Confirm / ST review ---

export interface ConfirmReturnToTableResult {
  character: CharacterRecord;
  /** Platform account to @mention in the review card. */
  mention: { platform: string; accountId: string; displayName: string };
}

export function confirmReturnToTable(
  store: CommunityStorePort,
  cmd: { characterSlug: string; actor?: string },
): ConfirmReturnToTableResult {
  const ch = store.getCharacterBySlug(cmd.characterSlug);
  if (!ch) throw new Error(`unknown character: ${cmd.characterSlug}`);
  if (ch.status !== 'draft' && ch.status !== 'pending_review') {
    throw new Error('only draft characters can return to table');
  }
  const init = ch.initiator;
  if (!init?.accountId) {
    throw new Error('start creation from the table bot first (no platform identity)');
  }
  ch.status = 'pending_review';
  store.putCharacter(ch);
  store.appendEvent({
    type: 'CharacterReturnedToTable',
    actor: cmd.actor ?? init.accountId,
    payload: {
      characterSlug: ch.slug,
      platform: init.platform,
      accountId: init.accountId,
    },
  });
  return {
    character: store.getCharacterBySlug(ch.slug)!,
    mention: {
      platform: init.platform,
      accountId: init.accountId,
      displayName: init.displayName,
    },
  };
}

export type StReviewDecision = 'approve' | 'request_changes' | 'deny';

export function stReviewCharacter(
  store: CommunityStorePort,
  cmd: {
    characterSlug: string;
    decision: StReviewDecision;
    note?: string;
    actor?: string;
  },
): CharacterRecord {
  const ch = store.getCharacterBySlug(cmd.characterSlug);
  if (!ch) throw new Error(`unknown character: ${cmd.characterSlug}`);
  const init = ch.initiator;

  if (cmd.decision === 'approve') {
    if (!init?.accountId) throw new Error('cannot approve without initiator identity');
    ch.status = 'active';
    const creation = ensureCreation(ch);
    creation.locked = true;
    creation.claimable = false;
    ch.player = {
      platform: init.platform,
      accountId: init.accountId,
      displayName: init.displayName,
    };
    const member: MemberRecord = {
      platform: init.platform as MemberRecord['platform'],
      accountId: init.accountId,
      displayName: init.displayName,
      characterId: ch.id,
      focusedCharacterId: ch.id,
      role: 'player',
    };
    // Preserve storyteller role if already ST
    const existing = store.listMembers().find(
      (m) => m.platform === member.platform && m.accountId === member.accountId,
    );
    if (existing?.role === 'storyteller') {
      member.role = 'storyteller';
      member.characterId = existing.characterId ?? ch.id;
      member.focusedCharacterId = ch.id;
    }
    store.putMember(member);
    store.putCharacter(ch);
    store.appendEvent({
      type: 'CharacterApproved',
      actor: cmd.actor,
      payload: {
        characterSlug: ch.slug,
        platform: init.platform,
        accountId: init.accountId,
        note: cmd.note,
      },
    });
    return store.getCharacterBySlug(ch.slug)!;
  }

  if (cmd.decision === 'request_changes') {
    ch.status = 'draft';
    store.putCharacter(ch);
    store.appendEvent({
      type: 'CharacterChangesRequested',
      actor: cmd.actor,
      payload: { characterSlug: ch.slug, note: cmd.note },
    });
    return store.getCharacterBySlug(ch.slug)!;
  }

  // deny
  ch.status = 'draft';
  // Clear claim soft-bind but keep draft for ST disposal
  if (ch.creation) ch.creation.claimable = ch.creation.claimable ?? false;
  store.putCharacter(ch);
  store.appendEvent({
    type: 'CharacterDenied',
    actor: cmd.actor,
    payload: { characterSlug: ch.slug, note: cmd.note },
  });
  return store.getCharacterBySlug(ch.slug)!;
}

// --- Lock / unlock ---

export function lockCharacter(
  store: CommunityStorePort,
  cmd: { characterSlug: string; actor?: string },
): CharacterRecord {
  const ch = store.getCharacterBySlug(cmd.characterSlug);
  if (!ch) throw new Error(`unknown character: ${cmd.characterSlug}`);
  const creation = ensureCreation(ch);
  creation.locked = true;
  if (ch.status === 'draft' || ch.status === 'pending_review') {
    ch.status = 'active';
  }
  store.putCharacter(ch);
  store.appendEvent({
    type: 'CharacterLocked',
    actor: cmd.actor,
    payload: { characterSlug: ch.slug },
  });
  return store.getCharacterBySlug(ch.slug)!;
}

export function unlockCharacter(
  store: CommunityStorePort,
  cmd: { characterSlug: string; actor?: string },
): CharacterRecord {
  const ch = store.getCharacterBySlug(cmd.characterSlug);
  if (!ch) throw new Error(`unknown character: ${cmd.characterSlug}`);
  const creation = ensureCreation(ch);
  creation.locked = false;
  store.putCharacter(ch);
  store.appendEvent({
    type: 'CharacterUnlocked',
    actor: cmd.actor,
    payload: { characterSlug: ch.slug },
  });
  return store.getCharacterBySlug(ch.slug)!;
}

// --- Spends ---

export function spendFoundation(
  store: CommunityStorePort,
  cmd: {
    characterSlug: string;
    foundation: string;
    /** Target rating after spend (must be current+1 for normal path). */
    toRating?: number;
    actor?: string;
  },
): CharacterRecord {
  const ch = store.getCharacterBySlug(cmd.characterSlug);
  if (!ch) throw new Error(`unknown character: ${cmd.characterSlug}`);
  if (isCreationLocked(ch)) throw new Error('character is locked; unlock to spend');
  const creation = ensureCreation(ch);
  const name = cmd.foundation;
  if (!(name in ch.foundations) && !FOUNDATION_NAMES.includes(name as (typeof FOUNDATION_NAMES)[number])) {
    throw new Error(`unknown foundation: ${name}`);
  }
  const from = ch.foundations[name] ?? 1;
  const to = cmd.toRating ?? from + 1;
  if (to !== from + 1) throw new Error('raise Foundations one rank at a time');
  if (to > 3) throw new Error('Foundation max 3 without ST+Trait path');
  if (from < 0) throw new Error('invalid Foundation rating');
  const cost = foundationStepCost(from);
  if (creation.foundationPoints < cost) {
    throw new Error(`need ${cost} Foundation points (have ${creation.foundationPoints})`);
  }
  creation.foundationPoints -= cost;
  ch.foundations[name] = to;
  store.putCharacter(ch);
  store.appendEvent({
    type: 'FoundationSpent',
    actor: cmd.actor,
    payload: { characterSlug: ch.slug, foundation: name, from, to, cost },
  });
  return store.getCharacterBySlug(ch.slug)!;
}

export function spendSkill(
  store: CommunityStorePort,
  cmd: {
    characterSlug: string;
    skill: string;
    toRating?: number;
    actor?: string;
  },
): CharacterRecord {
  const ch = store.getCharacterBySlug(cmd.characterSlug);
  if (!ch) throw new Error(`unknown character: ${cmd.characterSlug}`);
  if (isCreationLocked(ch)) throw new Error('character is locked; unlock to spend');
  const creation = ensureCreation(ch);
  const def = skillByName(cmd.skill);
  if (!def) throw new Error(`unknown skill: ${cmd.skill}`);
  let skill = ch.skills.find((s) => s.name === cmd.skill);
  const from = skill?.rating ?? 0;
  const to = cmd.toRating ?? from + 1;
  if (to !== from + 1) throw new Error('raise Skills one rank at a time');
  if (to > 3) throw new Error('Skill max 3');
  const cost = skillStepCost(from);
  if (creation.skillPoints < cost) {
    throw new Error(`need ${cost} Skill points (have ${creation.skillPoints})`);
  }
  creation.skillPoints -= cost;
  const foundationRating = ch.foundations[def.foundation] ?? 1;
  const threshold = practiceThreshold(
    Math.min(2, from) as 0 | 1 | 2,
    foundationRating,
  );
  if (!skill) {
    skill = {
      name: def.name,
      rating: to,
      practice: 0,
      threshold,
      foundation: def.foundation,
    };
    ch.skills.push(skill);
  } else {
    skill.rating = to;
    skill.threshold = practiceThreshold(
      Math.min(2, to === 3 ? 2 : to) as 0 | 1 | 2,
      foundationRating,
    );
    skill.foundation = def.foundation;
  }
  store.putCharacter(ch);
  store.appendEvent({
    type: 'SkillSpent',
    actor: cmd.actor,
    payload: { characterSlug: ch.slug, skill: cmd.skill, from, to, cost },
  });
  return store.getCharacterBySlug(ch.slug)!;
}

/** Lower Foundation one rank (min 1) and refund the step cost. */
export function refundFoundation(
  store: CommunityStorePort,
  cmd: {
    characterSlug: string;
    foundation: string;
    actor?: string;
  },
): CharacterRecord {
  const ch = store.getCharacterBySlug(cmd.characterSlug);
  if (!ch) throw new Error(`unknown character: ${cmd.characterSlug}`);
  if (isCreationLocked(ch)) throw new Error('character is locked; unlock to refund');
  const creation = ensureCreation(ch);
  const name = cmd.foundation;
  if (!(name in ch.foundations) && !FOUNDATION_NAMES.includes(name as (typeof FOUNDATION_NAMES)[number])) {
    throw new Error(`unknown foundation: ${name}`);
  }
  const from = ch.foundations[name] ?? 1;
  const refund = refundFoundationCost(from);
  if (refund == null) throw new Error('cannot lower Foundation below 1');
  const to = from - 1;
  creation.foundationPoints += refund;
  ch.foundations[name] = to;
  store.putCharacter(ch);
  store.appendEvent({
    type: 'FoundationRefunded',
    actor: cmd.actor,
    payload: { characterSlug: ch.slug, foundation: name, from, to, refund },
  });
  return store.getCharacterBySlug(ch.slug)!;
}

/** Lower Skill one rank (min 0) and refund the step cost; remove row at 0. */
export function refundSkill(
  store: CommunityStorePort,
  cmd: {
    characterSlug: string;
    skill: string;
    actor?: string;
  },
): CharacterRecord {
  const ch = store.getCharacterBySlug(cmd.characterSlug);
  if (!ch) throw new Error(`unknown character: ${cmd.characterSlug}`);
  if (isCreationLocked(ch)) throw new Error('character is locked; unlock to refund');
  const creation = ensureCreation(ch);
  const def = skillByName(cmd.skill);
  if (!def) throw new Error(`unknown skill: ${cmd.skill}`);
  const skill = ch.skills.find((s) => s.name === cmd.skill);
  const from = skill?.rating ?? 0;
  const refund = refundSkillCost(from);
  if (refund == null) throw new Error('cannot lower Skill below 0');
  const to = from - 1;
  creation.skillPoints += refund;
  if (!skill || to <= 0) {
    ch.skills = ch.skills.filter((s) => s.name !== cmd.skill);
  } else {
    const foundationRating = ch.foundations[def.foundation] ?? 1;
    skill.rating = to;
    skill.threshold = practiceThreshold(
      Math.min(2, to === 3 ? 2 : to) as 0 | 1 | 2,
      foundationRating,
    );
  }
  store.putCharacter(ch);
  store.appendEvent({
    type: 'SkillRefunded',
    actor: cmd.actor,
    payload: { characterSlug: ch.slug, skill: cmd.skill, from, to, refund },
  });
  return store.getCharacterBySlug(ch.slug)!;
}

// --- Weighing dice grants (bot rolls face, app grants points) ---

export function grantBirthOmen(
  store: CommunityStorePort,
  cmd: {
    characterSlug: string;
    /** d20 face 1–20 from bot adapter. */
    face: number;
    actor?: string;
  },
): { character: CharacterRecord; face: number; points: number } {
  const ch = store.getCharacterBySlug(cmd.characterSlug);
  if (!ch) throw new Error(`unknown character: ${cmd.characterSlug}`);
  const creation = ensureCreation(ch);
  if (creation.birthOmenGranted) throw new Error('Birth Omen already granted');
  if (isCreationLocked(ch)) throw new Error('character is locked');
  const points = birthOmenPoints(cmd.face);
  creation.foundationPoints += points;
  creation.birthOmenGranted = true;
  store.putCharacter(ch);
  store.appendEvent({
    type: 'BirthOmenGranted',
    actor: cmd.actor,
    payload: { characterSlug: ch.slug, face: cmd.face, points },
  });
  return {
    character: store.getCharacterBySlug(ch.slug)!,
    face: cmd.face,
    points,
  };
}

export function grantGuidingHand(
  store: CommunityStorePort,
  cmd: {
    characterSlug: string;
    face: number;
    actor?: string;
  },
): { character: CharacterRecord; face: number; points: number } {
  const ch = store.getCharacterBySlug(cmd.characterSlug);
  if (!ch) throw new Error(`unknown character: ${cmd.characterSlug}`);
  const creation = ensureCreation(ch);
  if (creation.guidingHandGranted) throw new Error('Guiding Hand already granted');
  if (isCreationLocked(ch)) throw new Error('character is locked');
  const points = guidingHandPoints(cmd.face);
  creation.skillPoints += points;
  creation.guidingHandGranted = true;
  store.putCharacter(ch);
  store.appendEvent({
    type: 'GuidingHandGranted',
    actor: cmd.actor,
    payload: { characterSlug: ch.slug, face: cmd.face, points },
  });
  return {
    character: store.getCharacterBySlug(ch.slug)!,
    face: cmd.face,
    points,
  };
}

/** Roll d20 with rng then grant — for tests / bot helpers. */
export function rollAndGrantBirthOmen(
  store: CommunityStorePort,
  cmd: { characterSlug: string; rng?: Rng; actor?: string },
) {
  const rng = cmd.rng ?? cryptoRng();
  const face = rollDie(20, rng);
  return grantBirthOmen(store, { characterSlug: cmd.characterSlug, face, actor: cmd.actor });
}

export function rollAndGrantGuidingHand(
  store: CommunityStorePort,
  cmd: { characterSlug: string; rng?: Rng; actor?: string },
) {
  const rng = cmd.rng ?? cryptoRng();
  const face = rollDie(20, rng);
  return grantGuidingHand(store, { characterSlug: cmd.characterSlug, face, actor: cmd.actor });
}

// --- Words / Wanting ---

export function grantWord(
  store: CommunityStorePort,
  cmd: { characterSlug: string; amount?: number; actor?: string; reason?: string },
): CharacterRecord {
  const ch = store.getCharacterBySlug(cmd.characterSlug);
  if (!ch) throw new Error(`unknown character: ${cmd.characterSlug}`);
  const creation = ensureCreation(ch);
  const amount = cmd.amount ?? 1;
  if (amount <= 0 || !Number.isInteger(amount)) throw new Error('amount must be positive integer');
  creation.words += amount;
  store.putCharacter(ch);
  store.appendEvent({
    type: 'WordGranted',
    actor: cmd.actor,
    payload: {
      characterSlug: ch.slug,
      amount,
      reason: cmd.reason,
      words: creation.words,
    },
  });
  return store.getCharacterBySlug(ch.slug)!;
}

export type WantingMenuId =
  | 'plus_one_foundation'
  | 'plus_two_foundation_split'
  | 'plus_five_skill'
  | 'positive_trait';

/**
 * Wanting menu (1 Word each). Caller supplies named Foundations/Skills/Trait
 * and pay path; ST approval of Negative Trait is external.
 */
export function spendWordWanting(
  store: CommunityStorePort,
  cmd: {
    characterSlug: string;
    menu: WantingMenuId;
    /** For +1 Found / −1 Found pay / trait name */
    foundation?: string;
    /** Two different Foundations for +2 split */
    foundations?: [string, string];
    /** Skill points to remove (named skills, total ranks removed) */
    removeSkills?: { skill: string; ranks: number }[];
    /** Skills to raise with +5 package (total rank steps ≤ 5 after cost accounting — simplified: grant 5 skill pts) */
    addSkillPoints?: number;
    traitName?: string;
    traitNote?: string;
    /** Take Negative Trait instead of removing 5 skill pts (+2 Found path) */
    negativeTrait?: { name: string; note?: string };
    actor?: string;
  },
): CharacterRecord {
  const ch = store.getCharacterBySlug(cmd.characterSlug);
  if (!ch) throw new Error(`unknown character: ${cmd.characterSlug}`);
  if (isCreationLocked(ch)) throw new Error('character is locked; unlock for Wanting');
  const creation = ensureCreation(ch);
  if (creation.words < 1) throw new Error('no Words remaining');

  const removeSkillRanks = (need: number) => {
    const list = cmd.removeSkills ?? [];
    let removed = 0;
    for (const r of list) {
      const sk = ch.skills.find((s) => s.name === r.skill);
      if (!sk) throw new Error(`unknown skill to remove: ${r.skill}`);
      if (r.ranks <= 0 || r.ranks > sk.rating) {
        throw new Error(`invalid ranks for ${r.skill}`);
      }
      sk.rating -= r.ranks;
      removed += r.ranks;
      if (sk.rating <= 0) {
        ch.skills = ch.skills.filter((s) => s.name !== r.skill);
      }
    }
    if (removed !== need) {
      throw new Error(`must remove exactly ${need} skill ranks (removed ${removed})`);
    }
  };

  switch (cmd.menu) {
    case 'plus_one_foundation': {
      if (!cmd.foundation) throw new Error('foundation required');
      removeSkillRanks(3);
      const from = ch.foundations[cmd.foundation] ?? 0;
      if (from >= 3) throw new Error(`${cmd.foundation} already at maximum`);
      ch.foundations[cmd.foundation] = from + 1;
      break;
    }
    case 'plus_two_foundation_split': {
      const pair = cmd.foundations;
      if (!pair || pair[0] === pair[1]) {
        throw new Error('two different foundations required');
      }
      if (cmd.negativeTrait) {
        ch.traits.push({
          name: cmd.negativeTrait.name,
          note: cmd.negativeTrait.note,
        });
      } else {
        removeSkillRanks(5);
      }
      for (const name of pair) {
        const from = ch.foundations[name] ?? 0;
        if (from >= 3) throw new Error(`${name} already at maximum`);
        ch.foundations[name] = from + 1;
      }
      break;
    }
    case 'plus_five_skill': {
      if (!cmd.foundation) throw new Error('foundation to reduce required');
      const f = ch.foundations[cmd.foundation] ?? 0;
      if (f < 1) throw new Error('cannot reduce Foundation at ∅ further without ST');
      ch.foundations[cmd.foundation] = f - 1;
      creation.skillPoints += cmd.addSkillPoints ?? 5;
      break;
    }
    case 'positive_trait': {
      if (!cmd.traitName) throw new Error('traitName required');
      removeSkillRanks(3);
      ch.traits.push({ name: cmd.traitName, note: cmd.traitNote });
      break;
    }
    default:
      throw new Error(`unknown Wanting menu: ${cmd.menu}`);
  }

  creation.words -= 1;
  store.putCharacter(ch);
  store.appendEvent({
    type: 'WantingSpent',
    actor: cmd.actor,
    payload: {
      characterSlug: ch.slug,
      menu: cmd.menu,
      words: creation.words,
      foundation: cmd.foundation,
      foundations: cmd.foundations,
      traitName: cmd.traitName,
      negativeTrait: cmd.negativeTrait?.name,
      removeSkills: cmd.removeSkills,
    },
  });
  return store.getCharacterBySlug(ch.slug)!;
}

// --- ST full edit (marks, concept, etc.) ---

export interface StEditCharacterPatch {
  name?: string;
  concept?: string;
  communityTie?: string;
  whoWeSee?: string;
  foundations?: Record<string, number>;
  skills?: SkillProgress[];
  traits?: TraitRecord[];
  echoes?: EchoRecord[];
  harm?: Record<string, number>;
  inventoryItems?: InventoryItem[];
  foodDays?: number;
  waterDays?: number;
  armour?: { kind: 'none' | 'light' | 'heavy'; donned: boolean };
  foundationPointsDelta?: number;
  skillPointsDelta?: number;
  wordsDelta?: number;
  claimable?: boolean;
}

/** ST patches any character fields — preferred path for claim marks. */
export function stEditCharacter(
  store: CommunityStorePort,
  cmd: {
    characterSlug: string;
    patch: StEditCharacterPatch;
    actor?: string;
  },
): CharacterRecord {
  const ch = store.getCharacterBySlug(cmd.characterSlug);
  if (!ch) throw new Error(`unknown character: ${cmd.characterSlug}`);
  const p = cmd.patch;
  if (p.name !== undefined) ch.name = p.name.trim() || ch.name;
  if (p.concept !== undefined) ch.concept = p.concept;
  if (p.communityTie !== undefined) ch.communityTie = p.communityTie;
  if (p.whoWeSee !== undefined) ch.whoWeSee = p.whoWeSee;
  if (p.foundations) {
    for (const [k, v] of Object.entries(p.foundations)) {
      if (!Number.isInteger(v) || v < 0 || v > 4) {
        throw new Error(`invalid foundation ${k}=${v}`);
      }
      ch.foundations[k] = v;
    }
  }
  if (p.skills) ch.skills = p.skills.map((s) => ({ ...s }));
  if (p.traits) ch.traits = p.traits.map((t) => ({ ...t }));
  if (p.echoes) ch.echoes = p.echoes.map((e) => ({ ...e }));
  if (p.harm) {
    for (const [k, v] of Object.entries(p.harm)) {
      ch.harm[k] = v;
    }
  }
  if (p.inventoryItems) ch.inventory.items = p.inventoryItems.map((i) => ({ ...i }));
  if (p.foodDays !== undefined) ch.inventory.foodDays = p.foodDays;
  if (p.waterDays !== undefined) ch.inventory.waterDays = p.waterDays;
  if (p.armour) ch.armour = { ...p.armour };
  const creation = ensureCreation(ch);
  if (p.foundationPointsDelta) creation.foundationPoints += p.foundationPointsDelta;
  if (p.skillPointsDelta) creation.skillPoints += p.skillPointsDelta;
  if (p.wordsDelta) creation.words += p.wordsDelta;
  if (p.claimable !== undefined) creation.claimable = p.claimable;
  store.putCharacter(ch);
  store.appendEvent({
    type: 'CharacterStEdited',
    actor: cmd.actor,
    payload: { characterSlug: ch.slug, keys: Object.keys(p) },
  });
  return store.getCharacterBySlug(ch.slug)!;
}

// --- Multi-character focus ---

export function listCharactersForAccount(
  store: CommunityStorePort,
  platform: string,
  accountId: string,
): CharacterRecord[] {
  return store.listCharacters().filter(
    (c) =>
      c.status !== 'dead' &&
      ((c.player?.platform === platform && c.player?.accountId === accountId) ||
        (c.initiator?.platform === platform && c.initiator?.accountId === accountId)),
  );
}

export function resolveFocusedCharacter(
  store: CommunityStorePort,
  platform: string,
  accountId: string,
): CharacterRecord | undefined {
  const member = store.listMembers().find(
    (m) => m.platform === platform && m.accountId === accountId,
  );
  const bound = listCharactersForAccount(store, platform, accountId).filter(
    (c) => c.status === 'active',
  );
  if (member?.focusedCharacterId) {
    const focused = bound.find((c) => c.id === member.focusedCharacterId);
    if (focused) return focused;
  }
  if (member?.characterId) {
    const primary = bound.find((c) => c.id === member.characterId);
    if (primary) return primary;
  }
  if (bound.length === 1) return bound[0];
  return undefined;
}

export function setFocusedCharacter(
  store: CommunityStorePort,
  cmd: {
    platform: 'discord' | 'fluxer' | string;
    accountId: string;
    characterSlug: string;
    displayName?: string;
    actor?: string;
  },
): CharacterRecord {
  const ch = store.getCharacterBySlug(cmd.characterSlug);
  if (!ch) throw new Error(`unknown character: ${cmd.characterSlug}`);
  if (ch.player?.accountId !== cmd.accountId && ch.initiator?.accountId !== cmd.accountId) {
    throw new Error('character not bound to this account');
  }
  const existing = store.listMembers().find(
    (m) => m.platform === cmd.platform && m.accountId === cmd.accountId,
  );
  const member: MemberRecord = {
    platform: cmd.platform as MemberRecord['platform'],
    accountId: cmd.accountId,
    displayName: cmd.displayName ?? existing?.displayName,
    characterId: ch.id,
    focusedCharacterId: ch.id,
    role: existing?.role ?? 'player',
  };
  store.putMember(member);
  store.appendEvent({
    type: 'CharacterFocusSet',
    actor: cmd.actor ?? cmd.accountId,
    payload: {
      platform: cmd.platform,
      accountId: cmd.accountId,
      characterSlug: ch.slug,
    },
  });
  return ch;
}

/** Update draft concept/tie from sheet (owner path). */
export function updateDraftConcept(
  store: CommunityStorePort,
  cmd: {
    characterSlug: string;
    name?: string;
    concept?: string;
    communityTie?: string;
    whoWeSee?: string;
    actor?: string;
  },
): CharacterRecord {
  const ch = store.getCharacterBySlug(cmd.characterSlug);
  if (!ch) throw new Error(`unknown character: ${cmd.characterSlug}`);
  if (isCreationLocked(ch) && ch.status === 'active') {
    throw new Error('character is locked');
  }
  if (cmd.name !== undefined) ch.name = cmd.name.trim() || ch.name;
  if (cmd.concept !== undefined) ch.concept = cmd.concept;
  if (cmd.communityTie !== undefined) ch.communityTie = cmd.communityTie;
  if (cmd.whoWeSee !== undefined) ch.whoWeSee = cmd.whoWeSee;
  store.putCharacter(ch);
  store.appendEvent({
    type: 'DraftConceptUpdated',
    actor: cmd.actor,
    payload: { characterSlug: ch.slug },
  });
  return store.getCharacterBySlug(ch.slug)!;
}
