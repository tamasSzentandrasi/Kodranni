import {
  HARM_TRACKS,
  armourToRatio,
  familyForTrack,
  precalcHarmPoints,
  type Armour,
  type HarmFamily,
  type ProtectionRatio,
} from '@kodranni/domain';
import {
  refreshCharacterDerived,
  type CharacterRecord,
  type CommunityStorePort,
} from '@kodranni/store';

export interface HarmPreview {
  points: number;
  family: HarmFamily;
  allowedTracks: readonly string[];
  ratio: ProtectionRatio;
  kind: 'opposed' | 'unopposed';
}

/**
 * Preview harm available for ST assignment.
 * Physical ratio defaults from target armour; mental/social use `ratio` or 1.
 */
export function previewHarm(input: {
  kind: 'opposed' | 'unopposed';
  family: HarmFamily;
  marksDifference?: number;
  failures?: number;
  marks?: number;
  /** Mental/social: ST or hierarchy-derived ratio. Physical ignored if target given. */
  ratio?: ProtectionRatio;
  /** For physical — compute armour ratio when provided. */
  target?: Pick<CharacterRecord, 'armour'>;
}): HarmPreview {
  let ratio: ProtectionRatio = input.ratio ?? 1;
  if (input.family === 'physical' && input.target) {
    ratio = armourToRatio(
      input.target.armour.kind as Armour,
      input.target.armour.donned,
    );
  }
  const points = precalcHarmPoints({
    kind: input.kind,
    ratio,
    marksDifference: input.marksDifference,
    failures: input.failures,
    marks: input.marks,
  });
  return {
    points,
    family: input.family,
    allowedTracks: HARM_TRACKS[input.family],
    ratio,
    kind: input.kind,
  };
}

/** Preview from a stored roll payload when present. */
export function previewHarmFromRoll(
  store: CommunityStorePort,
  rollId: string,
  family: HarmFamily,
  opts?: {
    marksDifference?: number;
    ratio?: ProtectionRatio;
    targetSlug?: string;
  },
): HarmPreview {
  const roll = store.getRoll(rollId);
  if (!roll) throw new Error(`unknown roll: ${rollId}`);
  const data = roll.data as {
    marks?: number;
    failures?: number;
    kind?: string;
    characterSlug?: string;
  };
  const kind =
    data.kind === 'opposed' || opts?.marksDifference != null ? 'opposed' : 'unopposed';
  const targetSlug = opts?.targetSlug ?? data.characterSlug;
  const target = targetSlug ? store.getCharacterBySlug(targetSlug) : undefined;
  return previewHarm({
    kind,
    family,
    marks: data.marks,
    failures: data.failures,
    marksDifference: opts?.marksDifference,
    ratio: opts?.ratio,
    target: target ?? undefined,
  });
}

export interface HarmAllocation {
  track: string;
  points: number;
}

export interface ApplyHarmCommand {
  characterSlug: string;
  family: HarmFamily;
  /** Total points available (from preview); allocations must sum to ≤ this. */
  availablePoints: number;
  allocations: HarmAllocation[];
  rollId?: string;
  actor?: string;
  clientEventId?: string;
}

export interface ApplyHarmResult {
  character: CharacterRecord;
  applied: HarmAllocation[];
  dying: boolean;
}

export function applyHarm(
  store: CommunityStorePort,
  cmd: ApplyHarmCommand,
): ApplyHarmResult {
  if (cmd.clientEventId && store.hasClientEvent(cmd.clientEventId)) {
    throw new Error(`duplicate clientEventId: ${cmd.clientEventId}`);
  }

  const ch = store.getCharacterBySlug(cmd.characterSlug);
  if (!ch) throw new Error(`unknown character slug: ${cmd.characterSlug}`);
  if (ch.status === 'dead') throw new Error(`${ch.name} is dead`);

  const allowed = new Set(HARM_TRACKS[cmd.family]);
  let sum = 0;
  for (const a of cmd.allocations) {
    if (a.points < 0 || !Number.isInteger(a.points)) {
      throw new Error(`invalid points for ${a.track}`);
    }
    if (a.points === 0) continue;
    if (!allowed.has(a.track)) {
      throw new Error(
        `track ${a.track} not allowed for ${cmd.family} infliction (allowed: ${[...allowed].join(', ')})`,
      );
    }
    const fam = familyForTrack(a.track);
    if (fam !== cmd.family) {
      throw new Error(`mixed harm families not allowed`);
    }
    sum += a.points;
  }
  if (sum > cmd.availablePoints) {
    throw new Error(
      `allocations sum ${sum} exceeds available ${cmd.availablePoints}`,
    );
  }
  if (sum === 0) {
    throw new Error('no harm points allocated');
  }

  const applied: HarmAllocation[] = [];
  for (const a of cmd.allocations) {
    if (a.points <= 0) continue;
    const before = ch.harm[a.track] ?? 0;
    // Cap track at 3 (Dying threshold)
    const next = Math.min(3, before + a.points);
    const gained = next - before;
    if (gained <= 0) continue;
    ch.harm[a.track] = next;
    applied.push({ track: a.track, points: gained });
  }

  if (Object.values(ch.harm).some((p) => p >= 3)) {
    ch.dying = true;
  }

  refreshCharacterDerived(ch);
  store.putCharacter(ch);
  store.appendEvent({
    type: 'HarmApplied',
    actor: cmd.actor,
    clientEventId: cmd.clientEventId,
    payload: {
      characterSlug: ch.slug,
      characterId: ch.id,
      family: cmd.family,
      availablePoints: cmd.availablePoints,
      applied,
      rollId: cmd.rollId,
      dying: ch.dying,
    },
  });

  return { character: ch, applied, dying: ch.dying };
}
