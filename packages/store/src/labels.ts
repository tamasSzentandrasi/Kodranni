/**
 * Campaign labels: factions (world groups) and tags (ST-defined).
 * Not hierarchy axes. Multi-membership. Migrates CommunityRecord.factions
 * and OutsiderRecord.faction on read.
 */
import type {
  CharacterRecord,
  CommunityRecord,
  HierarchyPlacement,
  Label,
  LabelGroup,
  OutsiderRecord,
} from './types.js';

export const FACTION_GROUP_ID = 'g-faction';
export const TAG_GROUP_ID = 'g-tag';

export const DEFAULT_LABEL_GROUPS: LabelGroup[] = [
  { id: FACTION_GROUP_ID, name: 'Factions', kind: 'faction' },
  { id: TAG_GROUP_ID, name: 'Tags', kind: 'tag' },
];

export function labelKey(name: string): string {
  return name.trim().toLowerCase();
}

export function labelId(kind: 'faction' | 'tag', name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return `${kind === 'faction' ? 'fac' : 'tag'}-${slug || 'x'}`;
}

export function factionHueFromName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h % 360;
}

function uniqueId(taken: Set<string>, base: string): string {
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

export function ensureLabelGroups(groups: LabelGroup[] | undefined): LabelGroup[] {
  const out = [...(groups ?? [])];
  const ids = new Set(out.map((g) => g.id));
  for (const g of DEFAULT_LABEL_GROUPS) {
    if (!ids.has(g.id)) out.push({ ...g });
  }
  return out;
}

export function labelsInGroup(c: CommunityRecord, groupId: string): Label[] {
  return (c.labels ?? []).filter((l) => l.groupId === groupId);
}

export function factionLabels(c: CommunityRecord): Label[] {
  return labelsInGroup(c, FACTION_GROUP_ID);
}

/** Compat: { name, hue }[] for HallRites / older callers. */
export function factionsFromLabels(c: CommunityRecord): { name: string; hue: number }[] {
  return factionLabels(c).map((l) => ({
    name: l.name,
    hue: l.hue ?? factionHueFromName(l.name),
  }));
}

export function findLabel(
  c: CommunityRecord,
  name: string,
  groupId = FACTION_GROUP_ID,
): Label | undefined {
  const k = labelKey(name);
  return (c.labels ?? []).find((l) => l.groupId === groupId && labelKey(l.name) === k);
}

export function upsertFactionLabel(
  c: CommunityRecord,
  name: string,
  hue?: number,
): Label {
  c.labelGroups = ensureLabelGroups(c.labelGroups);
  c.labels = [...(c.labels ?? [])];
  const existing = findLabel(c, name, FACTION_GROUP_ID);
  if (existing) {
    if (hue != null && Number.isFinite(hue)) {
      existing.hue = ((hue % 360) + 360) % 360;
    }
    return existing;
  }
  const taken = new Set(c.labels.map((l) => l.id));
  const id = uniqueId(taken, labelId('faction', name));
  const h = hue != null && Number.isFinite(hue) ? ((hue % 360) + 360) % 360 : factionHueFromName(name);
  const label: Label = { id, groupId: FACTION_GROUP_ID, name: name.trim(), hue: h };
  c.labels.push(label);
  return label;
}

export function upsertTagLabel(c: CommunityRecord, name: string): Label {
  c.labelGroups = ensureLabelGroups(c.labelGroups);
  c.labels = [...(c.labels ?? [])];
  const existing = findLabel(c, name, TAG_GROUP_ID);
  if (existing) return existing;
  const taken = new Set(c.labels.map((l) => l.id));
  const id = uniqueId(taken, labelId('tag', name));
  const label: Label = { id, groupId: TAG_GROUP_ID, name: name.trim() };
  c.labels.push(label);
  return label;
}

function attach(c: CommunityRecord, ids: string[] | undefined, id: string): string[] {
  const lab = (c.labels ?? []).find((l) => l.id === id);
  const group = (c.labelGroups ?? []).find((g) => g.id === lab?.groupId);
  let out = [...(ids ?? [])];
  if (lab && group?.kind === 'faction') {
    const same = new Set((c.labels ?? []).filter((l) => l.groupId === lab.groupId).map((l) => l.id));
    out = out.filter((x) => !same.has(x));
  }
  if (!out.includes(id)) out.push(id);
  return out;
}

/**
 * Lift legacy `factions[]` and `OutsiderRecord.faction` into labels + labelIds.
 * Idempotent. Re-derives `factions` from the faction group for old readers.
 */
export function migrateCommunityLabels(raw: CommunityRecord): CommunityRecord {
  const c: CommunityRecord = {
    ...raw,
    labelGroups: ensureLabelGroups(raw.labelGroups),
    labels: [...(raw.labels ?? [])],
    outsiders: (raw.outsiders ?? []).map((o) => ({ ...o })),
    placements: (raw.placements ?? []).map((p) => ({ ...p })),
  };

  for (const f of raw.factions ?? []) {
    const name = String(f.name ?? '').trim();
    if (!name) continue;
    upsertFactionLabel(c, name, f.hue);
  }

  c.outsiders = c.outsiders.map((o) => {
    const legacy = o.faction?.trim();
    let labelIds = [...(o.labelIds ?? [])];
    if (legacy) {
      const lab = upsertFactionLabel(c, legacy);
      labelIds = attach(c, labelIds, lab.id);
    }
    const next: OutsiderRecord = { name: o.name, note: o.note, characterSlug: o.characterSlug };
    if (labelIds.length) next.labelIds = labelIds;
    return next;
  });

  c.factions = factionsFromLabels(c);
  return c;
}

export function personLabelIds(opts: {
  character?: Pick<CharacterRecord, 'labelIds'> | undefined;
  outsider?: Pick<OutsiderRecord, 'labelIds' | 'faction'> | undefined;
  placement?: Pick<HierarchyPlacement, 'labelIds' | 'characterSlug'> | undefined;
}): string[] {
  if (opts.character?.labelIds?.length) return [...opts.character.labelIds];
  if (opts.outsider?.labelIds?.length) return [...opts.outsider.labelIds];
  if (opts.placement && !opts.placement.characterSlug && opts.placement.labelIds?.length) {
    return [...opts.placement.labelIds];
  }
  return [];
}

export function labelsByIds(c: CommunityRecord, ids: string[]): Label[] {
  const map = new Map((c.labels ?? []).map((l) => [l.id, l] as const));
  const out: Label[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    const l = map.get(id);
    if (!l || seen.has(l.id)) continue;
    seen.add(l.id);
    out.push(l);
  }
  return out;
}
