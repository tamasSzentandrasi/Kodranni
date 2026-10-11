import type {
  CharacterRecord,
  CommunityRecord,
  HierarchyPlacement,
  OutsiderRecord,
} from './types.js';

const DEFAULT_TIER = 'Outcast';

/**
 * Keep the placements the desk wrote. A character with none is Unassigned.
 * Dead people leave the diagram. Nothing is invented onto a rung.
 */
export function completeMemberPlacements(
  community: CommunityRecord,
  characters: CharacterRecord[],
): HierarchyPlacement[] {
  const deadSlugs = new Set(
    characters.filter((ch) => ch.status === 'dead').map((ch) => ch.slug),
  );
  const deadNames = new Set(
    characters.filter((ch) => ch.status === 'dead').map((ch) => ch.name.toLowerCase()),
  );
  return (community.placements ?? []).filter((p) => {
    if (p.characterSlug && deadSlugs.has(p.characterSlug)) return false;
    if (deadNames.has(p.name.toLowerCase())) return false;
    return true;
  });
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
