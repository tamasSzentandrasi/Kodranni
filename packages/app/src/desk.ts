/**
 * Storyteller desk writes. Each call stores the gesture.
 * Foundation 0 and 4 are allowed. Words and creation budgets are not spent here.
 */
import {
  FOUNDATION_HARM,
  FOUNDATION_NAMES,
  HIERARCHY_TIERS,
  absorbPractice,
  cryptoRng,
  degradePool,
  downgradeSkill,
  pickDegradeTargets,
  rollDie,
  skillByName,
  skillThreshold,
  type DegradeMode,
  type Rng,
} from '@kodranni/domain';
import {
  TAG_GROUP_ID,
  factionHueFromName,
  factionsFromLabels,
  labelId,
  type CharacterRecord,
  type CommunityRecord,
  type CommunityStorePort,
  type DegradeProposal,
  type EchoRecord,
  type FortuneKey,
  type FoundationMyth,
  type HierarchyPlacement,
  type Dye,
  type Label,
  type LabelGroup,
  type MythEffect,
  type MythEffectKind,
  type RelationMap,
} from '@kodranni/store';
import { addHallNpc } from './creation.js';
import { stEditCharacter, type StEditCharacterPatch } from './creation.js';
import { setStartingFortunes } from './events.js';

const FORTUNE_KEYS: FortuneKey[] = [
  'vitality',
  'cohesion',
  'surplus',
  'standing',
  'tradition',
];

const EFFECT_KINDS = new Set<MythEffectKind>([
  'exertion_free',
  'exertion_forced',
  'advantage',
  'disadvantage',
  'omen_faces',
  'practice_mod',
  'tide_mod',
  'trait_grant',
  'trait_deny',
]);

const TIERS = new Set<string>(HIERARCHY_TIERS);

export type DeskSeat =
  | { kind: 'unassigned' }
  | { kind: 'rung'; axis: string; tier: string }
  | { kind: 'porch' }
  | { kind: 'ruler' };

function fortuneKey(raw: string): FortuneKey {
  if ((FORTUNE_KEYS as string[]).includes(raw)) return raw as FortuneKey;
  throw new Error(`unknown fortune: ${raw}`);
}

export function deskRenameCommunity(store: CommunityStorePort, name: string): CommunityRecord {
  const trimmed = name.trim().slice(0, 80);
  if (!trimmed) throw new Error('name required');
  const community = store.getCommunity();
  community.name = trimmed;
  store.putCommunity(community);
  store.appendEvent({
    type: 'CommunityRenamed',
    actor: 'desk',
    payload: { name: trimmed },
  });
  return store.getCommunity();
}

export function deskSetFortuneLevel(
  store: CommunityStorePort,
  keyRaw: string,
  level: number,
): CommunityRecord {
  const key = fortuneKey(keyRaw);
  if (!Number.isInteger(level) || level < 0 || level > 3) {
    throw new Error('fortune state is 0–3');
  }
  const community = store.getCommunity();
  community.fortunes[key] = level as 0 | 1 | 2 | 3;
  if (community.fortunesFoundedAt) {
    community.fortuneMeta = {
      ...community.fortuneMeta,
      [key]: { at: new Date().toISOString(), source: 'st' },
    };
  }
  store.putCommunity(community);
  store.appendEvent({
    type: 'ResourceChanged',
    actor: 'desk',
    payload: { kind: 'fortune_level', key, level, founded: Boolean(community.fortunesFoundedAt) },
  });
  return store.getCommunity();
}

export function deskFoundFortunes(store: CommunityStorePort): CommunityRecord {
  const community = store.getCommunity();
  if (community.fortunesFoundedAt) throw new Error('starting fortunes already founded');
  return setStartingFortunes(store, { fortunes: community.fortunes, actor: 'desk' });
}

function applyDye(next: Dye, look: Dye): void {
  if (look.hue !== undefined) {
    const hue = Math.round(look.hue);
    if (!Number.isFinite(hue)) throw new Error('hue required');
    next.hue = ((hue % 360) + 360) % 360;
  }
  if (look.sat !== undefined) {
    const sat = Math.round(look.sat);
    if (!Number.isFinite(sat)) throw new Error('saturation required');
    next.sat = Math.min(100, Math.max(0, sat));
  }
  if (look.light !== undefined) {
    const light = Math.round(look.light);
    if (!Number.isFinite(light)) throw new Error('lightness required');
    next.light = Math.min(100, Math.max(0, light));
  }
}

export function deskSetFortuneLook(
  store: CommunityStorePort,
  keyRaw: string,
  look: Dye & { icon?: string },
): CommunityRecord {
  const key = fortuneKey(keyRaw);
  const community = store.getCommunity();
  const prev = community.fortuneLook?.[key] ?? {};
  const next = { ...prev };
  applyDye(next, look);
  if (look.icon !== undefined) next.icon = look.icon || undefined;
  community.fortuneLook = { ...community.fortuneLook, [key]: next };
  store.putCommunity(community);
  return store.getCommunity();
}

export function deskSetAxisLook(
  store: CommunityStorePort,
  name: string,
  look: Dye & { icon?: string },
): CommunityRecord {
  const axis = name.trim();
  const community = store.getCommunity();
  if (!community.hierarchyAxes.includes(axis)) throw new Error('unknown axis');
  const prev = community.axisLook?.[axis] ?? {};
  const next = { ...prev };
  applyDye(next, look);
  if (look.icon !== undefined) next.icon = look.icon || undefined;
  community.axisLook = { ...community.axisLook, [axis]: next };
  store.putCommunity(community);
  return store.getCommunity();
}

export function deskSetRulerLook(
  store: CommunityStorePort,
  look: Dye & { icon?: string; title?: string },
): CommunityRecord {
  const community = store.getCommunity();
  const prev = community.rulerLook ?? {};
  const next = { ...prev };
  applyDye(next, look);
  if (look.icon !== undefined) next.icon = look.icon || undefined;
  if (look.title !== undefined) {
    const title = look.title.trim().slice(0, 40);
    next.title = title || undefined;
  }
  community.rulerLook = next;
  store.putCommunity(community);
  return store.getCommunity();
}

function cleanEffect(raw: MythEffect): MythEffect {
  if (!EFFECT_KINDS.has(raw.kind)) throw new Error(`unknown effect: ${raw.kind}`);
  const effect: MythEffect = {
    kind: raw.kind,
    label: String(raw.label || raw.kind).trim().slice(0, 80) || raw.kind,
  };
  if (raw.detail) effect.detail = String(raw.detail).trim().slice(0, 240);
  if (raw.match) effect.match = String(raw.match).trim().slice(0, 200);
  if (raw.skill) effect.skill = String(raw.skill).trim().slice(0, 40);
  if (raw.mode === 'extra' || raw.mode === 'reduced' || raw.mode === 'foundation') {
    effect.mode = raw.mode;
  }
  if (raw.traitName) effect.traitName = String(raw.traitName).trim().slice(0, 80);
  if (raw.permanence === 'temporary' || raw.permanence === 'permanent') {
    effect.permanence = raw.permanence;
  }
  if (Array.isArray(raw.faces)) {
    effect.faces = raw.faces
      .map((n) => Math.round(Number(n)))
      .filter((n) => n >= 1 && n <= 20)
      .slice(0, 8);
  }
  if (raw.amount !== undefined && Number.isFinite(Number(raw.amount))) {
    effect.amount = Math.max(-12, Math.min(12, Math.round(Number(raw.amount))));
  }
  if (raw.threshold !== undefined && Number.isFinite(Number(raw.threshold))) {
    effect.threshold = Math.max(-12, Math.min(12, Math.round(Number(raw.threshold))));
  }
  if (
    (effect.kind === 'exertion_free' || effect.kind === 'exertion_forced') &&
    effect.amount === undefined
  ) {
    effect.amount = 1;
  }
  if (effect.kind === 'practice_mod') {
    if (!effect.mode) effect.mode = 'extra';
    if (effect.amount === undefined) effect.amount = 1;
  }
  if (effect.kind === 'tide_mod') {
    if (effect.amount === undefined) effect.amount = 0;
    if (effect.threshold === undefined) effect.threshold = 0;
  }
  if (
    (effect.kind === 'trait_grant' || effect.kind === 'trait_deny') &&
    !effect.permanence
  ) {
    effect.permanence = 'temporary';
  }
  return effect;
}

export function deskSetMyths(store: CommunityStorePort, myths: FoundationMyth[]): CommunityRecord {
  if (!Array.isArray(myths)) throw new Error('myths required');
  if (myths.length > 3) throw new Error('three myths at most');
  const community = store.getCommunity();
  community.myths = myths.map((m) => {
    const title = String(m?.title ?? '').trim().slice(0, 120);
    if (!title) throw new Error('myth needs a title');
    const effects = Array.isArray(m.effects) ? m.effects : [];
    if (effects.length > 5) throw new Error('five modifiers at most');
    const summary = m.summary ? String(m.summary).trim().slice(0, 400) : undefined;
    return { title, summary, effects: effects.map(cleanEffect) };
  });
  store.putCommunity(community);
  store.appendEvent({
    type: 'MythsSet',
    actor: 'desk',
    payload: { count: community.myths.length },
  });
  return store.getCommunity();
}

function samePerson(
  name: string,
  slug: string | undefined,
  otherName: string,
  otherSlug?: string,
): boolean {
  if (slug && otherSlug && slug === otherSlug) return true;
  return name.trim().toLowerCase() === otherName.trim().toLowerCase();
}

function axisEq(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function canonicalAxis(axes: readonly string[], axis: string): string | undefined {
  return axes.find((name) => axisEq(name, axis));
}

function syncHierarchy(store: CommunityStorePort, community: CommunityRecord): void {
  for (const ch of store.listCharacters()) {
    const rows = (community.placements ?? []).filter((p) =>
      samePerson(ch.name, ch.slug, p.name, p.characterSlug),
    );
    const hierarchy = rows.map((p) => ({ axis: p.axis, tier: p.tier }));
    const prev = JSON.stringify(ch.hierarchy ?? []);
    if (prev !== JSON.stringify(hierarchy)) {
      ch.hierarchy = hierarchy;
      store.putCharacter(ch);
    }
  }
}

export function deskPlace(
  store: CommunityStorePort,
  cmd: { slug?: string; name: string; from: DeskSeat; to: DeskSeat; copy: boolean },
): CommunityRecord {
  const community = store.getCommunity();
  const named = cmd.name.trim();
  if (!named) throw new Error('name required');
  const ch = cmd.slug
    ? store.getCharacterBySlug(cmd.slug)
    : store.listCharacters().find((c) => c.name.toLowerCase() === named.toLowerCase());
  const personName = ch?.name ?? named;
  const personSlug = ch?.slug ?? cmd.slug;
  const matches = (name: string, slug?: string) => samePerson(personName, personSlug, name, slug);

  let copy = cmd.copy;
  let dest = cmd.to;
  if (copy && (dest.kind === 'porch' || cmd.from.kind === 'porch')) {
    throw new Error('an outsider is not also on a ladder');
  }
  if (copy && dest.kind === 'ruler' && community.ruler) {
    throw new Error('the ruler seat is taken');
  }
  if (copy && dest.kind === 'rung') {
    const axis = canonicalAxis(community.hierarchyAxes, dest.axis);
    if (!axis) throw new Error('unknown axis');
    const present = (community.placements ?? []).some(
      (p) => axisEq(p.axis, axis) && matches(p.name, p.characterSlug),
    );
    if (present) throw new Error('already on this ladder');
    dest = { kind: 'rung', axis, tier: dest.tier };
  }

  if (!copy) {
    if (cmd.from.kind === 'rung') {
      const axis = cmd.from.axis;
      community.placements = (community.placements ?? []).filter(
        (p) => !(p.axis === axis && matches(p.name, p.characterSlug)),
      );
    } else if (cmd.from.kind === 'porch') {
      community.outsiders = (community.outsiders ?? []).filter(
        (o) => !matches(o.name, o.characterSlug),
      );
    } else if (cmd.from.kind === 'ruler') {
      if (matches(community.ruler ?? '', community.rulerCharacterSlug)) {
        community.ruler = null;
        community.rulerCharacterSlug = undefined;
      }
    }
  }

  if (dest.kind === 'rung') {
    if (!community.hierarchyAxes.includes(dest.axis)) throw new Error('unknown axis');
    if (!TIERS.has(dest.tier)) throw new Error('unknown rung');
    if (!copy) {
      community.outsiders = (community.outsiders ?? []).filter(
        (o) => !matches(o.name, o.characterSlug),
      );
    }
    const row: HierarchyPlacement = {
      name: personName,
      axis: dest.axis,
      tier: dest.tier,
      characterSlug: personSlug,
    };
    const idx = (community.placements ?? []).findIndex(
      (p) => axisEq(p.axis, dest.axis) && matches(p.name, p.characterSlug),
    );
    if (idx >= 0) community.placements[idx] = { ...community.placements[idx], ...row };
    else community.placements = [...(community.placements ?? []), row];
  } else if (dest.kind === 'porch') {
    community.placements = (community.placements ?? []).filter(
      (p) => !matches(p.name, p.characterSlug),
    );
    if (matches(community.ruler ?? '', community.rulerCharacterSlug)) {
      community.ruler = null;
      community.rulerCharacterSlug = undefined;
    }
    const already = (community.outsiders ?? []).some((o) => matches(o.name, o.characterSlug));
    if (!already) {
      community.outsiders = [
        ...(community.outsiders ?? []),
        { name: personName, characterSlug: personSlug },
      ];
    }
  } else if (dest.kind === 'ruler') {
    if (!copy) {
      community.outsiders = (community.outsiders ?? []).filter(
        (o) => !matches(o.name, o.characterSlug),
      );
    }
    community.ruler = personName;
    community.rulerCharacterSlug = personSlug;
  }

  store.putCommunity(community);
  syncHierarchy(store, store.getCommunity());
  store.appendEvent({
    type: 'HierarchyPlaced',
    actor: 'desk',
    payload: { name: personName, slug: personSlug, to: dest, copy },
  });
  return store.getCommunity();
}

export function deskAddAxis(store: CommunityStorePort, name: string): CommunityRecord {
  const axis = name.trim().slice(0, 40);
  if (!axis) throw new Error('name required');
  const community = store.getCommunity();
  if (community.hierarchyAxes.length >= 5) throw new Error('five axes at most');
  if (community.hierarchyAxes.some((a) => a.toLowerCase() === axis.toLowerCase())) {
    throw new Error('that axis exists');
  }
  community.hierarchyAxes = [...community.hierarchyAxes, axis];
  store.putCommunity(community);
  return store.getCommunity();
}

export function deskRenameAxis(
  store: CommunityStorePort,
  from: string,
  to: string,
): CommunityRecord {
  const next = to.trim().slice(0, 40);
  if (!next) throw new Error('name required');
  const community = store.getCommunity();
  if (!community.hierarchyAxes.includes(from)) throw new Error('unknown axis');
  if (community.hierarchyAxes.some((a) => a !== from && a.toLowerCase() === next.toLowerCase())) {
    throw new Error('that axis exists');
  }
  community.hierarchyAxes = community.hierarchyAxes.map((a) => (a === from ? next : a));
  community.placements = (community.placements ?? []).map((p) =>
    p.axis === from ? { ...p, axis: next } : p,
  );
  if (community.axisLook?.[from]) {
    const look = { ...community.axisLook };
    look[next] = look[from]!;
    delete look[from];
    community.axisLook = look;
  }
  store.putCommunity(community);
  syncHierarchy(store, store.getCommunity());
  return store.getCommunity();
}

export function deskRemoveAxis(store: CommunityStorePort, name: string): CommunityRecord {
  const community = store.getCommunity();
  if (!community.hierarchyAxes.includes(name)) throw new Error('unknown axis');
  if (community.hierarchyAxes.length <= 3) throw new Error('three ladders at least');
  community.hierarchyAxes = community.hierarchyAxes.filter((a) => a !== name);
  if (community.axisLook?.[name]) {
    const look = { ...community.axisLook };
    delete look[name];
    community.axisLook = look;
  }
  community.placements = (community.placements ?? []).filter((p) => p.axis !== name);
  store.putCommunity(community);
  syncHierarchy(store, store.getCommunity());
  return store.getCommunity();
}

export function deskAddNpc(store: CommunityStorePort, name: string) {
  return addHallNpc(store, { name, actor: 'desk' });
}

function dropIds(ids: string[] | undefined, gone: Set<string>): string[] | undefined {
  const next = (ids ?? []).filter((id) => !gone.has(id));
  return next.length ? next : undefined;
}

export function deskAddGroup(store: CommunityStorePort, name: string): CommunityRecord {
  const trimmed = name.trim().slice(0, 40);
  if (!trimmed) throw new Error('name required');
  const community = store.getCommunity();
  const id = `g-${labelId('faction', trimmed).slice(4) || 'cat'}`;
  if ((community.labelGroups ?? []).some((g) => g.id === id || g.name.toLowerCase() === trimmed.toLowerCase())) {
    throw new Error('that category exists');
  }
  community.labelGroups = [...(community.labelGroups ?? []), { id, name: trimmed, kind: 'faction' }];
  store.putCommunity(community);
  return store.getCommunity();
}

export function deskRenameGroup(
  store: CommunityStorePort,
  id: string,
  name: string,
): CommunityRecord {
  const trimmed = name.trim().slice(0, 40);
  if (!trimmed) throw new Error('name required');
  const community = store.getCommunity();
  const group = (community.labelGroups ?? []).find((g) => g.id === id);
  if (!group) throw new Error('unknown category');
  group.name = trimmed;
  store.putCommunity(community);
  return store.getCommunity();
}

export function deskRemoveGroup(store: CommunityStorePort, id: string): CommunityRecord {
  const community = store.getCommunity();
  const group = (community.labelGroups ?? []).find((g) => g.id === id);
  if (!group || group.kind !== 'faction') throw new Error('unknown category');
  const gone = new Set((community.labels ?? []).filter((l) => l.groupId === id).map((l) => l.id));
  community.labelGroups = (community.labelGroups ?? []).filter((g) => g.id !== id);
  community.labels = (community.labels ?? []).filter((l) => l.groupId !== id);
  community.factions = factionsFromLabels(community);
  store.putCommunity(community);
  scrubLabelIds(store, gone);
  return store.getCommunity();
}

export function deskOrderGroups(store: CommunityStorePort, ids: string[]): CommunityRecord {
  const community = store.getCommunity();
  const byId = new Map((community.labelGroups ?? []).map((g) => [g.id, g]));
  const ordered: LabelGroup[] = [];
  for (const id of ids) {
    const g = byId.get(id);
    if (g) {
      ordered.push(g);
      byId.delete(id);
    }
  }
  community.labelGroups = [...ordered, ...byId.values()];
  store.putCommunity(community);
  return store.getCommunity();
}

export function deskAddLabel(
  store: CommunityStorePort,
  groupId: string,
  name: string,
): CommunityRecord {
  const trimmed = name.trim().slice(0, 40);
  if (!trimmed) throw new Error('name required');
  const community = store.getCommunity();
  const group = (community.labelGroups ?? []).find((g) => g.id === groupId);
  if (!group) throw new Error('unknown category');
  if ((community.labels ?? []).some((l) => l.groupId === groupId && l.name.toLowerCase() === trimmed.toLowerCase())) {
    throw new Error('that name exists');
  }
  const kind = group.kind === 'tag' ? 'tag' : 'faction';
  const id = labelId(kind, trimmed);
  const label: Label = {
    id,
    groupId,
    name: trimmed,
    hue: kind === 'faction' ? factionHueFromName(trimmed) : undefined,
  };
  community.labels = [...(community.labels ?? []), label];
  community.factions = factionsFromLabels(community);
  store.putCommunity(community);
  return store.getCommunity();
}

export function deskRenameLabel(
  store: CommunityStorePort,
  id: string,
  name: string,
): CommunityRecord {
  const trimmed = name.trim().slice(0, 40);
  if (!trimmed) throw new Error('name required');
  const community = store.getCommunity();
  const label = (community.labels ?? []).find((l) => l.id === id);
  if (!label) throw new Error('unknown label');
  label.name = trimmed;
  community.factions = factionsFromLabels(community);
  store.putCommunity(community);
  return store.getCommunity();
}

export function deskLabelHue(
  store: CommunityStorePort,
  id: string,
  hue: number,
  tone?: { sat?: number; light?: number },
): CommunityRecord {
  const community = store.getCommunity();
  const label = (community.labels ?? []).find((l) => l.id === id);
  if (!label) throw new Error('unknown label');
  applyDye(label, { hue, sat: tone?.sat, light: tone?.light });
  community.factions = factionsFromLabels(community);
  store.putCommunity(community);
  return store.getCommunity();
}

export function deskLabelIcon(
  store: CommunityStorePort,
  id: string,
  icon: string,
): CommunityRecord {
  const community = store.getCommunity();
  const label = (community.labels ?? []).find((l) => l.id === id);
  if (!label) throw new Error('unknown label');
  label.icon = icon || undefined;
  store.putCommunity(community);
  return store.getCommunity();
}

function scrubLabelIds(store: CommunityStorePort, gone: Set<string>): void {
  if (gone.size === 0) return;
  const community = store.getCommunity();
  community.outsiders = (community.outsiders ?? []).map((o) => ({
    ...o,
    labelIds: dropIds(o.labelIds, gone),
  }));
  community.placements = (community.placements ?? []).map((p) => ({
    ...p,
    labelIds: dropIds(p.labelIds, gone),
  }));
  store.putCommunity(community);
  for (const ch of store.listCharacters()) {
    if ((ch.labelIds ?? []).some((id) => gone.has(id))) {
      ch.labelIds = (ch.labelIds ?? []).filter((id) => !gone.has(id));
      store.putCharacter(ch);
    }
  }
}

export function deskRemoveLabel(store: CommunityStorePort, id: string): CommunityRecord {
  const community = store.getCommunity();
  if (!(community.labels ?? []).some((l) => l.id === id)) throw new Error('unknown label');
  community.labels = (community.labels ?? []).filter((l) => l.id !== id);
  community.factions = factionsFromLabels(community);
  store.putCommunity(community);
  scrubLabelIds(store, new Set([id]));
  return store.getCommunity();
}

export function deskOrderLabels(
  store: CommunityStorePort,
  groupId: string,
  ids: string[],
): CommunityRecord {
  const community = store.getCommunity();
  const mine = (community.labels ?? []).filter((l) => l.groupId === groupId);
  const byId = new Map(mine.map((l) => [l.id, l]));
  const ordered: Label[] = [];
  for (const id of ids) {
    const label = byId.get(id);
    if (label) {
      ordered.push(label);
      byId.delete(id);
    }
  }
  const others = (community.labels ?? []).filter((l) => l.groupId !== groupId);
  community.labels = [...others, ...ordered, ...byId.values()];
  store.putCommunity(community);
  return store.getCommunity();
}

/** Move a faction into another category, or reorder inside the list that receives it. */
export function deskMoveLabel(
  store: CommunityStorePort,
  id: string,
  groupId: string,
  ids: string[],
): CommunityRecord {
  const community = store.getCommunity();
  const label = (community.labels ?? []).find((l) => l.id === id);
  const group = (community.labelGroups ?? []).find((g) => g.id === groupId);
  if (!label || !group) throw new Error('unknown label');
  const fromTag = label.groupId === TAG_GROUP_ID;
  const toTag = group.kind === 'tag' || group.id === TAG_GROUP_ID;
  if (fromTag !== toTag) throw new Error('a faction stays with the factions');
  label.groupId = group.id;
  if (!toTag && label.hue == null) label.hue = factionHueFromName(label.name);
  store.putCommunity(community);
  return deskOrderLabels(store, group.id, ids.length ? ids : [id]);
}

export function deskMembership(
  store: CommunityStorePort,
  slug: string,
  labelIdValue: string,
  on: boolean,
): void {
  const ch = store.getCharacterBySlug(slug);
  if (!ch) throw new Error(`unknown character: ${slug}`);
  const community = store.getCommunity();
  if (!(community.labels ?? []).some((l) => l.id === labelIdValue)) {
    throw new Error('unknown label');
  }
  const ids = new Set(ch.labelIds ?? []);
  if (on) ids.add(labelIdValue);
  else ids.delete(labelIdValue);
  ch.labelIds = [...ids];
  store.putCharacter(ch);
}

function clearFromDiagram(store: CommunityStorePort, slug: string, name: string): void {
  const community = store.getCommunity();
  community.placements = (community.placements ?? []).filter(
    (p) => !samePerson(name, slug, p.name, p.characterSlug),
  );
  community.outsiders = (community.outsiders ?? []).filter(
    (o) => !samePerson(name, slug, o.name, o.characterSlug),
  );
  if (samePerson(name, slug, community.ruler ?? '', community.rulerCharacterSlug)) {
    community.ruler = null;
    community.rulerCharacterSlug = undefined;
  }
  store.putCommunity(community);
}

export function deskMarkDead(store: CommunityStorePort, slug: string) {
  const ch = store.getCharacterBySlug(slug);
  if (!ch) throw new Error(`unknown character: ${slug}`);
  ch.status = 'dead';
  ch.hierarchy = [];
  store.putCharacter(ch);
  clearFromDiagram(store, ch.slug, ch.name);
  store.appendEvent({
    type: 'CharacterDied',
    actor: 'desk',
    payload: { characterSlug: ch.slug },
  });
  return store.getCharacterBySlug(slug);
}

export function deskRemoveCharacter(store: CommunityStorePort, slug: string, confirm: string): void {
  const ch = store.getCharacterBySlug(slug);
  if (!ch) throw new Error(`unknown character: ${slug}`);
  if (confirm !== ch.name) throw new Error('type the name to remove them');
  clearFromDiagram(store, ch.slug, ch.name);
  store.deleteCharacter(slug);
  store.appendEvent({
    type: 'CharacterRemoved',
    actor: 'desk',
    payload: { characterSlug: slug, name: ch.name },
  });
}

function renameInCommunity(store: CommunityStorePort, slug: string, from: string, to: string): void {
  if (from === to) return;
  const community = store.getCommunity();
  community.placements = (community.placements ?? []).map((p) =>
    samePerson(from, slug, p.name, p.characterSlug) ? { ...p, name: to, characterSlug: slug } : p,
  );
  community.outsiders = (community.outsiders ?? []).map((o) =>
    samePerson(from, slug, o.name, o.characterSlug) ? { ...o, name: to, characterSlug: slug } : o,
  );
  if (samePerson(from, slug, community.ruler ?? '', community.rulerCharacterSlug)) {
    community.ruler = to;
    community.rulerCharacterSlug = slug;
  }
  store.putCommunity(community);
}

function absorbPivotal(
  store: CommunityStorePort,
  before: EchoRecord[],
  after: EchoRecord[],
  fortune?: { key: string; level: number },
): void {
  const was = new Set(
    before.filter((e) => e.weight === 3 && e.resolved).map((e) => e.title),
  );
  const newly = after.filter((e) => e.weight === 3 && e.resolved && !was.has(e.title));
  if (newly.length === 0) return;
  const community = store.getCommunity();
  let myths = [...(community.myths ?? [])];
  for (const echo of newly) {
    if (myths.length >= 3) myths = myths.slice(1);
    myths.push({
      title: echo.title,
      summary: echo.resolved?.narrative,
      effects: [],
    });
  }
  community.myths = myths;
  store.putCommunity(community);
  if (fortune) deskSetFortuneLevel(store, fortune.key, fortune.level);
}

export function deskEditCharacter(
  store: CommunityStorePort,
  slug: string,
  patch: StEditCharacterPatch,
  pivotal?: { key: string; level: number },
) {
  const before = store.getCharacterBySlug(slug);
  if (!before) throw new Error(`unknown character: ${slug}`);
  const next: StEditCharacterPatch = { ...patch };
  delete next.foundationPointsDelta;
  delete next.skillPointsDelta;
  delete next.wordsDelta;
  if (next.harm) {
    for (const [track, value] of Object.entries(next.harm)) {
      if (!Number.isInteger(value) || value < 0 || value > 3) {
        throw new Error('harm is 0–3');
      }
      const prev = before.harm[track] ?? 0;
      if (before.dying && prev >= 3 && value < prev && next.dying !== false) {
        throw new Error('stabilise before lowering a track at 3');
      }
    }
    const merged = { ...before.harm, ...next.harm };
    const anyThree = Object.values(merged).some((n) => n >= 3);
    if (next.dying !== false) next.dying = anyThree;
  }
  if (next.foundations) {
    for (const [name, value] of Object.entries(next.foundations)) {
      if (!(FOUNDATION_NAMES as readonly string[]).includes(name)) {
        throw new Error(`unknown foundation: ${name}`);
      }
      if (!Number.isInteger(value) || value < 0 || value > 4) {
        throw new Error('foundation is 0–4');
      }
    }
  }
  const fromName = before.name;
  const echoesBefore = before.echoes ?? [];
  const ch = stEditCharacter(store, { characterSlug: slug, patch: next, actor: 'desk' });
  if (next.foundations) {
    rebalanceRuledSkills(ch, Object.keys(next.foundations));
    store.putCharacter(ch);
  }
  if (next.name && next.name.trim() && next.name.trim() !== fromName) {
    renameInCommunity(store, slug, fromName, ch.name);
  }
  if (next.echoes) absorbPivotal(store, echoesBefore, ch.echoes ?? [], pivotal);
  return store.getCharacterBySlug(slug)!;
}

export function deskFoundationStep(
  store: CommunityStorePort,
  slug: string,
  name: string,
  delta: number,
) {
  if (!(FOUNDATION_NAMES as readonly string[]).includes(name)) {
    throw new Error(`unknown foundation: ${name}`);
  }
  const ch = store.getCharacterBySlug(slug);
  if (!ch) throw new Error(`unknown character: ${slug}`);
  const cur = ch.foundations[name] ?? 1;
  const value = Math.max(0, Math.min(4, cur + delta));
  return deskEditCharacter(store, slug, { foundations: { [name]: value } });
}

export function deskHarmStep(store: CommunityStorePort, slug: string, track: string, delta: number) {
  const known = new Set(Object.values(FOUNDATION_HARM));
  if (!known.has(track)) throw new Error(`unknown harm track: ${track}`);
  const ch = store.getCharacterBySlug(slug);
  if (!ch) throw new Error(`unknown character: ${slug}`);
  const cur = ch.harm[track] ?? 0;
  const value = Math.max(0, Math.min(3, cur + delta));
  return deskEditCharacter(store, slug, { harm: { [track]: value } });
}

export function deskStabilise(store: CommunityStorePort, slug: string) {
  return deskEditCharacter(store, slug, { dying: false });
}

export function deskSkillStep(
  store: CommunityStorePort,
  slug: string,
  skillName: string,
  ratingDelta: number,
  practiceDelta: number,
) {
  const def = skillByName(skillName);
  if (!def) throw new Error(`unknown skill: ${skillName}`);
  const ch = store.getCharacterBySlug(slug);
  if (!ch) throw new Error(`unknown character: ${slug}`);
  const skills = (ch.skills ?? []).map((s) => ({ ...s }));
  let row = skills.find((s) => s.name === skillName);
  const ruling = ch.foundations[def.foundation] ?? 1;
  if (!row) {
    row = {
      name: skillName,
      rating: 0,
      practice: 0,
      threshold: skillThreshold(0, ruling),
      foundation: def.foundation,
    };
    skills.push(row);
  }
  if (ratingDelta) row.rating = Math.max(0, Math.min(3, row.rating + ratingDelta));
  if (practiceDelta && row.rating < 3) row.practice = Math.max(0, row.practice + practiceDelta);
  row.threshold = skillThreshold(row.rating, ruling);
  row.foundation = def.foundation;
  return deskEditCharacter(store, slug, { skills });
}

function rebalanceRuledSkills(ch: CharacterRecord, names: string[]): void {
  const touched = new Set(names);
  for (const skill of ch.skills ?? []) {
    const def = skillByName(skill.name);
    const rulingName = def?.foundation ?? skill.foundation;
    if (!rulingName || !touched.has(rulingName)) continue;
    absorbPractice(skill, ch.foundations[rulingName] ?? 1);
    if (def) skill.foundation = def.foundation;
  }
}

function degradeSkillRows(ch: CharacterRecord) {
  return (ch.skills ?? []).map((skill) => ({
    name: skill.name,
    rating: skill.rating,
    practice: skill.practice,
    threshold: skill.threshold,
  }));
}

/** Roll a fresh d20 and store the proposal. Confirm is what writes the ranks. */
export function deskProposeDegrade(
  store: CommunityStorePort,
  slug: string,
  mode: DegradeMode,
  rng: Rng = cryptoRng(),
): DegradeProposal {
  if (mode !== 'standard' && mode !== 'short') throw new Error('unknown time-leap');
  const ch = store.getCharacterBySlug(slug);
  if (!ch) throw new Error(`unknown character: ${slug}`);
  const omen = rollDie(20, rng);
  const draw = pickDegradeTargets(degradeSkillRows(ch), omen, mode, rng);
  const proposal: DegradeProposal = { slug, mode, omen, pool: draw.pool, picked: draw.picked };
  store.putDegradeProposal(slug, proposal);
  return proposal;
}

/** Apply the stored pick. A cleared proposal writes nothing. */
export function deskConfirmDegrade(store: CommunityStorePort, slug: string): CharacterRecord {
  const ch = store.getCharacterBySlug(slug);
  if (!ch) throw new Error(`unknown character: ${slug}`);
  const proposal = store.getDegradeProposal(slug);
  if (!proposal) return ch;
  const pool = new Set(degradePool(degradeSkillRows(ch)).map((skill) => skill.name));
  if (proposal.picked.some((name) => !pool.has(name))) {
    throw new Error('propose the time leap again');
  }
  if (proposal.picked.length > 0) {
    for (const name of proposal.picked) {
      const skill = ch.skills.find((row) => row.name === name);
      if (!skill) throw new Error('propose the time leap again');
      const def = skillByName(skill.name);
      downgradeSkill(skill, ch.foundations[def?.foundation ?? skill.foundation] ?? 1);
      if (def) skill.foundation = def.foundation;
    }
    store.putCharacter(ch);
  }
  store.putDegradeProposal(slug, null);
  return store.getCharacterBySlug(slug)!;
}

/** Drop the proposal. The sheet is unchanged. */
export function deskDismissDegrade(store: CommunityStorePort, slug: string): void {
  if (!store.getCharacterBySlug(slug)) throw new Error(`unknown character: ${slug}`);
  store.putDegradeProposal(slug, null);
}

export function deskExertion(store: CommunityStorePort, slug: string, current: number) {
  const ch = store.getCharacterBySlug(slug);
  if (!ch) throw new Error(`unknown character: ${slug}`);
  const max = ch.exertion?.max ?? 0;
  const value = Math.max(0, Math.min(max, Math.round(current)));
  return deskEditCharacter(store, slug, { exertionCurrent: value });
}

export function deskClaimEcho(
  store: CommunityStorePort,
  fromSlug: string,
  title: string,
  toSlug: string,
) {
  const from = store.getCharacterBySlug(fromSlug);
  const to = store.getCharacterBySlug(toSlug);
  if (!from || !to) throw new Error('unknown character');
  if (to.status === 'dead') throw new Error('claim onto a living person');
  const echo = (from.echoes ?? []).find(
    (e) => e.title === title && e.resolved && (e.weight === 2 || e.weight === 3),
  );
  if (!echo) throw new Error('that echo cannot be claimed');
  const copy: EchoRecord = {
    ...echo,
    resolved: undefined,
    group: echo.group?.map((g) => ({ ...g })),
  };
  to.echoes = [...(to.echoes ?? []), copy];
  store.putCharacter(to);
  return to;
}

export function deskReopenEcho(store: CommunityStorePort, slug: string, title: string) {
  const ch = store.getCharacterBySlug(slug);
  if (!ch) throw new Error(`unknown character: ${slug}`);
  const echoes = (ch.echoes ?? []).map((e) =>
    e.title === title ? { ...e, resolved: undefined } : e,
  );
  return deskEditCharacter(store, slug, { echoes });
}

export function deskSetNotebook(store: CommunityStorePort, text: string): void {
  const community = store.getCommunity();
  community.notebook = String(text ?? '').slice(0, 20000);
  store.putCommunity(community);
}

export function deskSetMap(store: CommunityStorePort, map: RelationMap): void {
  if (!map || !Array.isArray(map.nodes) || !Array.isArray(map.edges)) {
    throw new Error('map needs nodes and edges');
  }
  store.putRelationMap({ nodes: map.nodes, edges: map.edges });
}
