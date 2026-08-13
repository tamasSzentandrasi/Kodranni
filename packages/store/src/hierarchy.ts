import type {
  CharacterRecord,
  CommunityRecord,
  HierarchyPlacement,
  OutsiderRecord,
} from './types.js';

const DEFAULT_TIER = 'Outcast';

/**
 * Every community member (character not listed as outsider) must appear on
 * every hierarchy axis. Missing placements default to Outcast.
 * Explicit placements (higher tiers) are preserved.
 */
export function completeMemberPlacements(
  community: CommunityRecord,
  characters: CharacterRecord[],
): HierarchyPlacement[] {
  const outsiderSlugs = new Set(
    (community.outsiders ?? [])
      .map((o) => o.characterSlug)
      .filter((s): s is string => Boolean(s)),
  );
  const outsiderNames = new Set(
    (community.outsiders ?? []).map((o) => o.name.toLowerCase()),
  );

  const members = characters.filter(
    (ch) =>
      ch.status !== 'draft' &&
      !outsiderSlugs.has(ch.slug) &&
      !outsiderNames.has(ch.name.toLowerCase()),
  );

  const byKey = new Map<string, HierarchyPlacement>();
  for (const p of community.placements ?? []) {
    const key = `${p.axis}::${(p.characterSlug ?? p.name).toLowerCase()}`;
    byKey.set(key, p);
  }

  // Named NPCs already on diagram (no character sheet) keep their placements
  const result: HierarchyPlacement[] = [...(community.placements ?? [])];

  for (const ch of members) {
    for (const axis of community.hierarchyAxes) {
      const keySlug = `${axis}::${ch.slug.toLowerCase()}`;
      const keyName = `${axis}::${ch.name.toLowerCase()}`;
      if (byKey.has(keySlug) || byKey.has(keyName)) continue;
      const placement: HierarchyPlacement = {
        name: ch.name,
        axis,
        tier: DEFAULT_TIER,
        characterSlug: ch.slug,
      };
      result.push(placement);
      byKey.set(keySlug, placement);
    }
  }

  return result;
}

/**
 * When an outsider joins the community: remove from outsiders list and ensure
 * Outcast (or given tier) placement on every axis.
 */
export function inductOutsiderIntoCommunity(
  community: CommunityRecord,
  outsider: OutsiderRecord,
  opts?: { tier?: string; characterSlug?: string },
): CommunityRecord {
  const tier = opts?.tier ?? DEFAULT_TIER;
  const slug = opts?.characterSlug ?? outsider.characterSlug;
  const name = outsider.name;

  const outsiders = (community.outsiders ?? []).filter(
    (o) => o.name !== outsider.name && o.characterSlug !== outsider.characterSlug,
  );

  let placements = (community.placements ?? []).filter(
    (p) =>
      !(
        (slug && p.characterSlug === slug) ||
        p.name.toLowerCase() === name.toLowerCase()
      ),
  );

  for (const axis of community.hierarchyAxes) {
    placements.push({
      name,
      axis,
      tier,
      characterSlug: slug,
    });
  }

  return { ...community, outsiders, placements };
}

export function isOutsiderName(
  community: CommunityRecord,
  name: string,
  characterSlug?: string,
): boolean {
  return (community.outsiders ?? []).some(
    (o) =>
      o.name.toLowerCase() === name.toLowerCase() ||
      (characterSlug && o.characterSlug === characterSlug),
  );
}
