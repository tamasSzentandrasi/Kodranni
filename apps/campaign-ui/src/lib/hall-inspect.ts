import type { ViewCommunity } from '../data/load';

export type InspectPlacement = { axis: string; tier: string };

export type InspectPending = {
  axis: string;
  fromTier: string;
  toTier: string;
  note?: string;
};

export type InspectPerson = {
  id: string;
  kind: 'member' | 'outsider' | 'ruler';
  name: string;
  slug?: string;
  whoWeSee: string;
  pc: boolean;
  ruler?: boolean;
  faction?: string;
  placements: InspectPlacement[];
  pending: InspectPending[];
};

export function inspectId(name: string, slug?: string): string {
  return (slug || name).trim().toLowerCase();
}

export function hallIsBusy(c: ViewCommunity): boolean {
  if ((c.placements ?? []).length >= 12) return true;
  const axes = c.hierarchyAxes ?? [];
  return axes.some(
    (axis) =>
      (c.placements ?? []).filter((p) => p.axis === axis && p.tier === 'Outcast').length > 8,
  );
}

export function buildInspectPeople(c: ViewCommunity): InspectPerson[] {
  const map = new Map<string, InspectPerson>();

  const who = (name: string, slug?: string, note?: string): string => {
    if (note) return note;
    if (slug) {
      const ch = c.characters.find((x) => x.slug === slug);
      if (ch?.whoWeSee) return ch.whoWeSee;
    }
    const byName = c.characters.find((x) => x.name.toLowerCase() === name.toLowerCase());
    return byName?.whoWeSee ?? '';
  };

  const isPc = (slug?: string): boolean => {
    if (!slug) return false;
    const ch = c.characters.find((x) => x.slug === slug);
    if (!ch) return true;
    return (ch.kind ?? 'pc') !== 'npc';
  };

  const upsert = (partial: {
    kind: InspectPerson['kind'];
    name: string;
    slug?: string;
    whoWeSee?: string;
    faction?: string;
    ruler?: boolean;
  }): InspectPerson => {
    const id = inspectId(partial.name, partial.slug);
    const existing = map.get(id);
    if (existing) {
      if (partial.slug) existing.slug = partial.slug;
      if (partial.whoWeSee && !existing.whoWeSee) existing.whoWeSee = partial.whoWeSee;
      if (partial.faction) existing.faction = partial.faction;
      if (partial.ruler) existing.ruler = true;
      if (partial.kind === 'outsider') existing.kind = 'outsider';
      existing.pc = isPc(existing.slug);
      return existing;
    }
    const person: InspectPerson = {
      id,
      kind: partial.kind,
      name: partial.name,
      slug: partial.slug,
      whoWeSee: partial.whoWeSee ?? '',
      pc: isPc(partial.slug),
      ruler: partial.ruler,
      faction: partial.faction,
      placements: [],
      pending: [],
    };
    map.set(id, person);
    if (partial.slug && inspectId(partial.name) !== id) map.set(inspectId(partial.name), person);
    return person;
  };

  for (const p of c.placements ?? []) {
    const person = upsert({
      kind: 'member',
      name: p.name,
      slug: p.characterSlug,
      whoWeSee: who(p.name, p.characterSlug, p.note),
    });
    person.placements.push({ axis: p.axis, tier: p.tier });
  }

  for (const o of c.outsiders ?? []) {
    upsert({
      kind: 'outsider',
      name: o.name,
      slug: o.characterSlug,
      whoWeSee: o.note || who(o.name, o.characterSlug),
      faction: o.faction,
    });
  }

  if (c.ruler) {
    upsert({
      kind: 'ruler',
      name: c.ruler,
      slug: c.rulerCharacterSlug,
      whoWeSee: who(c.ruler, c.rulerCharacterSlug),
      ruler: true,
    });
  }

  for (const mv of c.pendingMoves ?? []) {
    const person = upsert({
      kind: 'member',
      name: mv.name,
      slug: mv.characterSlug,
      whoWeSee: who(mv.name, mv.characterSlug, mv.note),
    });
    person.pending.push({
      axis: mv.axis,
      fromTier: mv.fromTier,
      toTier: mv.toTier,
      note: mv.note,
    });
  }

  const seen = new Set<InspectPerson>();
  const out: InspectPerson[] = [];
  for (const p of map.values()) {
    if (seen.has(p)) continue;
    seen.add(p);
    out.push(p);
  }
  return out;
}

export function peopleJson(people: InspectPerson[]): string {
  return JSON.stringify(people).replace(/</g, '\\u003c');
}
