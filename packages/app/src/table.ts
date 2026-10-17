import {
  omenBandForFooting,
  tideScale,
  tideStartFromA,
  tideStepsFromMargin,
  weightsForFooting,
  stepTidePosition,
  type TideFooting,
  type TideSkirmishScale,
} from '@kodranni/domain';
import {
  emptyTableState,
  tideDyeHex,
  type CharacterRecord,
  type CommunityStorePort,
  type OpenTide,
  type RestGroup,
  type SceneFace,
  type SceneTone,
  type TableState,
} from '@kodranni/store';

const SIZES = new Set<TideSkirmishScale>(['small', 'skirmish', 'battle']);
const FOOTINGS = new Set<TideFooting>(['equal', 'slightA', 'slightB', 'severeA', 'severeB']);

function sceneTone(raw: unknown): SceneTone {
  return raw === 'positive' || raw === 'negative' || raw === 'mixed' ? raw : 'mixed';
}

function checkedFaces(
  rows: readonly { face: number; effect: string; tone?: SceneTone; hidden?: boolean }[],
): SceneFace[] {
  const seen = new Set<number>();
  const out: SceneFace[] = [];
  for (const row of rows) {
    const face = row.face;
    const effect = row.effect?.trim() ?? '';
    if (!Number.isInteger(face) || face < 1 || face > 20) {
      throw new Error('omen face must be 1–20');
    }
    if (face === 7 || face === 13) {
      throw new Error('faces 7 and 13 are always in force');
    }
    if (!effect) throw new Error('omen line required');
    if (seen.has(face)) throw new Error(`face ${face} is already in the scene`);
    seen.add(face);
    out.push({
      face,
      effect: effect.slice(0, 240),
      tone: sceneTone(row.tone),
      hidden: row.hidden === true,
    });
  }
  return out;
}

export function saveSceneFaces(
  store: CommunityStorePort,
  rows: readonly { face: number; effect: string; tone?: SceneTone; hidden?: boolean }[],
  actor?: string,
): TableState {
  const sceneFaces = checkedFaces(rows);
  const prev = store.getTableState();
  const next = { ...prev, sceneFaces };
  store.putTableState(next);
  store.appendEvent({
    type: 'TableChanged',
    actor,
    payload: { kind: 'scene', faces: sceneFaces },
  });
  return store.getTableState();
}

export function clearSceneFace(
  store: CommunityStorePort,
  face: number,
  actor?: string,
): TableState {
  const prev = store.getTableState();
  if (!prev.sceneFaces.some((r) => r.face === face)) throw new Error('no such face');
  return saveSceneFaces(
    store,
    prev.sceneFaces.filter((r) => r.face !== face),
    actor,
  );
}

export function clearScene(store: CommunityStorePort, actor?: string): TableState {
  return saveSceneFaces(store, [], actor);
}

export interface OpenTideCommand {
  size: TideSkirmishScale;
  footing: TideFooting;
  sideA: string;
  sideB: string;
  dyeA: string;
  dyeB: string;
  actor?: string;
}

export function openTide(store: CommunityStorePort, cmd: OpenTideCommand): OpenTide {
  const prev = store.getTableState();
  if (prev.tide) throw new Error('a Tide is already open');
  if (!SIZES.has(cmd.size)) throw new Error('unknown Tide size');
  if (!FOOTINGS.has(cmd.footing)) throw new Error('unknown Tide footing');
  const sideA = cmd.sideA.trim().slice(0, 32);
  const sideB = cmd.sideB.trim().slice(0, 32);
  if (!sideA || !sideB) throw new Error('both sides need a name');
  const dyeA = tideDyeHex(cmd.dyeA);
  const dyeB = tideDyeHex(cmd.dyeB);
  if (!dyeA || !dyeB) throw new Error('unknown Tide dye');
  const { weightA, weightB } = weightsForFooting(cmd.footing);
  const tide: OpenTide = {
    size: cmd.size,
    footing: cmd.footing,
    sideA,
    sideB,
    dyeA,
    dyeB,
    weightA,
    weightB,
    length: tideScale(weightA, weightB),
    start: tideStartFromA(weightA),
    position: tideStartFromA(weightA),
  };
  store.putTableState({ ...prev, tide });
  store.appendEvent({
    type: 'TableChanged',
    actor: cmd.actor,
    payload: { kind: 'tide_open', tide },
  });
  return store.getTableState().tide!;
}

export function closeTide(store: CommunityStorePort, actor?: string): OpenTide {
  const prev = store.getTableState();
  if (!prev.tide) throw new Error('no Tide is open');
  const closed = prev.tide;
  store.putTableState({ ...prev, tide: null });
  store.appendEvent({
    type: 'TableChanged',
    actor,
    payload: { kind: 'tide_close', tide: closed },
  });
  return closed;
}

export function stepTide(
  store: CommunityStorePort,
  cmd: { winner: 'A' | 'B' | null; margin: number; omen: number | null; actor?: string },
): OpenTide {
  const prev = store.getTableState();
  if (!prev.tide) throw new Error('no Tide is open');
  const tide = prev.tide;
  const band = omenBandForFooting(tide.size, tide.footing);
  let omenStep: 'A' | 'B' | null = null;
  if (cmd.omen != null) {
    if (cmd.omen >= band.towardA[0] && cmd.omen <= band.towardA[1]) omenStep = 'A';
    else if (cmd.omen >= band.towardB[0] && cmd.omen <= band.towardB[1]) omenStep = 'B';
  }
  const marginSteps =
    cmd.winner == null ? 0 : tideStepsFromMargin(Math.abs(cmd.margin), tide.size);
  const position = stepTidePosition({
    position: tide.position,
    length: tide.length,
    marginSteps,
    winner: cmd.winner,
    omenStep,
  });
  const next = { ...tide, position };
  store.putTableState({ ...prev, tide: next });
  store.appendEvent({
    type: 'TableChanged',
    actor: cmd.actor,
    payload: { kind: 'tide_step', from: tide.position, to: position, winner: cmd.winner, omen: cmd.omen },
  });
  return next;
}

export interface RestoreRow {
  characterSlug: string;
  spendFood?: boolean;
  spendWater?: boolean;
  /** Points returned. Omit to leave Exertion untouched. */
  exertion?: number | null;
}

export interface RestoreChange {
  characterSlug: string;
  name: string;
  foodDays?: number;
  waterDays?: number;
  exertion?: number;
}

export function restoreRest(
  store: CommunityStorePort,
  cmd: { rows: readonly RestoreRow[]; actor?: string },
): RestoreChange[] {
  const seen = new Set<string>();
  const planned: { ch: CharacterRecord; change: RestoreChange }[] = [];
  for (const row of cmd.rows) {
    if (seen.has(row.characterSlug)) throw new Error(`duplicate rest row: ${row.characterSlug}`);
    seen.add(row.characterSlug);
    const ch = store.getCharacterBySlug(row.characterSlug);
    if (!ch) throw new Error(`unknown character: ${row.characterSlug}`);
    if (ch.status !== 'active') throw new Error(`${ch.name} is not in play`);
    const change: RestoreChange = { characterSlug: ch.slug, name: ch.name };
    if (row.spendFood) {
      if (ch.inventory.foodDays < 1) throw new Error(`${ch.name} has no food day to spend`);
      change.foodDays = ch.inventory.foodDays - 1;
    }
    if (row.spendWater) {
      if (ch.inventory.waterDays < 1) throw new Error(`${ch.name} has no water day to spend`);
      change.waterDays = ch.inventory.waterDays - 1;
    }
    if (row.exertion != null) {
      if (!Number.isInteger(row.exertion) || row.exertion < 0) {
        throw new Error('exertion returned must be a non-negative integer');
      }
      change.exertion = Math.min(ch.exertion.max, ch.exertion.current + row.exertion);
    }
    planned.push({ ch, change });
  }
  const changes: RestoreChange[] = [];
  for (const { ch, change } of planned) {
    if (change.foodDays != null) ch.inventory.foodDays = change.foodDays;
    if (change.waterDays != null) ch.inventory.waterDays = change.waterDays;
    if (change.exertion != null) ch.exertion.current = change.exertion;
    store.putCharacter(ch);
    changes.push(change);
  }
  store.appendEvent({
    type: 'Restored',
    actor: cmd.actor,
    payload: { changes },
  });
  return changes;
}

/** Replenishment counsel, applied by the desk’s short and long rest. */
export type RestKind = 'short' | 'long';

export function restAward(kind: RestKind, ampleFood: boolean, ampleWater: boolean): number {
  let n = kind === 'short' ? 1 : 2;
  if (ampleFood) n += 1;
  if (!ampleFood || !ampleWater) n -= 1;
  return Math.max(0, n);
}

export function applyRest(
  store: CommunityStorePort,
  cmd: {
    slugs: readonly string[];
    kind: RestKind;
    ampleFood: boolean;
    ampleWater: boolean;
    actor?: string;
  },
): RestoreChange[] {
  if (cmd.kind !== 'short' && cmd.kind !== 'long') throw new Error('unknown rest');
  const award = restAward(cmd.kind, cmd.ampleFood, cmd.ampleWater);
  return restoreRest(store, {
    rows: cmd.slugs.map((characterSlug) => ({ characterSlug, exertion: award })),
    actor: cmd.actor,
  });
}

export function setSupply(
  store: CommunityStorePort,
  cmd: { characterSlug: string; foodDays?: number; waterDays?: number; actor?: string },
): RestoreChange {
  const ch = store.getCharacterBySlug(cmd.characterSlug);
  if (!ch) throw new Error(`unknown character: ${cmd.characterSlug}`);
  if (ch.status !== 'active') throw new Error(`${ch.name} is not in play`);
  const change: RestoreChange = { characterSlug: ch.slug, name: ch.name };
  if (cmd.foodDays != null) {
    if (!Number.isInteger(cmd.foodDays) || cmd.foodDays < 0 || cmd.foodDays > 99) {
      throw new Error('food days must be 0–99');
    }
    ch.inventory.foodDays = cmd.foodDays;
    change.foodDays = cmd.foodDays;
  }
  if (cmd.waterDays != null) {
    if (!Number.isInteger(cmd.waterDays) || cmd.waterDays < 0 || cmd.waterDays > 99) {
      throw new Error('water days must be 0–99');
    }
    ch.inventory.waterDays = cmd.waterDays;
    change.waterDays = cmd.waterDays;
  }
  if (change.foodDays == null && change.waterDays == null) throw new Error('nothing to set');
  store.putCharacter(ch);
  store.appendEvent({
    type: 'Restored',
    actor: cmd.actor,
    payload: { changes: [change] },
  });
  return change;
}

function exertionChange(ch: CharacterRecord, current: number): RestoreChange {
  ch.exertion.current = current;
  return { characterSlug: ch.slug, name: ch.name, exertion: current };
}

/** Absolute Exertion for one person, clamped to 0 and the derived max. */
export function setExertion(
  store: CommunityStorePort,
  cmd: { characterSlug: string; current: number; actor?: string },
): RestoreChange {
  const ch = store.getCharacterBySlug(cmd.characterSlug);
  if (!ch) throw new Error(`unknown character: ${cmd.characterSlug}`);
  if (ch.status !== 'active') throw new Error(`${ch.name} is not in play`);
  if (!Number.isInteger(cmd.current)) throw new Error('exertion must be an integer');
  const next = Math.max(0, Math.min(ch.exertion.max, cmd.current));
  const change = exertionChange(ch, next);
  store.putCharacter(ch);
  store.appendEvent({
    type: 'Restored',
    actor: cmd.actor,
    payload: { changes: [change] },
  });
  return change;
}

/** ±n Exertion for each person, each clamped to that person's own max. */
export function nudgeExertion(
  store: CommunityStorePort,
  cmd: { slugs: readonly string[]; delta: number; actor?: string },
): RestoreChange[] {
  if (!Number.isInteger(cmd.delta) || cmd.delta === 0) throw new Error('exertion step must be a non-zero integer');
  const seen = new Set<string>();
  const changes: RestoreChange[] = [];
  let moved = false;
  for (const slug of cmd.slugs) {
    if (seen.has(slug)) continue;
    seen.add(slug);
    const ch = store.getCharacterBySlug(slug);
    if (!ch || ch.status !== 'active') continue;
    const next = Math.max(0, Math.min(ch.exertion.max, ch.exertion.current + cmd.delta));
    if (next !== ch.exertion.current) moved = true;
    changes.push(exertionChange(ch, next));
    store.putCharacter(ch);
  }
  if (moved) {
    store.appendEvent({
      type: 'Restored',
      actor: cmd.actor,
      payload: { changes },
    });
  }
  return changes;
}

export function saveRestGroups(
  store: CommunityStorePort,
  groups: readonly { id: string; name: string; members: readonly string[] }[],
  actor?: string,
): RestGroup[] {
  const active = new Set(
    store
      .listCharacters()
      .filter((ch) => ch.status === 'active')
      .map((ch) => ch.slug),
  );
  const seenId = new Set<string>();
  const seenMember = new Set<string>();
  const next: RestGroup[] = [];
  for (const group of groups) {
    const id = group.id.trim().slice(0, 40);
    const name = group.name.trim().slice(0, 40);
    if (!/^[A-Za-z0-9_-]{1,40}$/.test(id)) throw new Error('group id is not usable');
    if (!name) throw new Error('a group needs a name');
    if (seenId.has(id)) throw new Error('duplicate group');
    seenId.add(id);
    const members: string[] = [];
    for (const slug of group.members) {
      if (!active.has(slug) || seenMember.has(slug)) continue;
      seenMember.add(slug);
      members.push(slug);
    }
    next.push({ id, name, members });
    if (next.length >= 12) break;
  }
  const prev = store.getTableState();
  store.putTableState({ ...prev, restGroups: next });
  store.appendEvent({
    type: 'TableChanged',
    actor,
    payload: { kind: 'rest_groups', groups: next },
  });
  return next;
}

export function readTable(store: CommunityStorePort): TableState {
  return store.getTableState() ?? emptyTableState();
}
