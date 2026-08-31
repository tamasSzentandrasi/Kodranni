/**
 * Hall live-rev: SHA-256 of the hall payload after completeMemberPlacements.
 * generatedAt, player, initiator, and accountId are not in the hashed object.
 */
import { createHash } from 'node:crypto';
import {
  completeMemberPlacements,
  type CharacterRecord,
  type CommunityRecord,
} from '@kodranni/store';

export type HallRevCharacter = {
  slug: string;
  name: string;
  status: CharacterRecord['status'];
  whoWeSee: string;
  hierarchy: CharacterRecord['hierarchy'];
  labelIds: string[];
};

export type HallRevPayload = {
  fortunes: CommunityRecord['fortunes'];
  fortunesFoundedAt?: string;
  fortuneMeta: NonNullable<CommunityRecord['fortuneMeta']>;
  myths: CommunityRecord['myths'];
  hierarchyAxes: CommunityRecord['hierarchyAxes'];
  ruler: CommunityRecord['ruler'];
  rulerCharacterSlug?: string;
  placements: CommunityRecord['placements'];
  outsiders: CommunityRecord['outsiders'];
  labels: NonNullable<CommunityRecord['labels']>;
  pendingMoves: NonNullable<CommunityRecord['pendingMoves']>;
  characters: HallRevCharacter[];
};

export function hallRevPayload(
  community: CommunityRecord,
  characters: CharacterRecord[],
): HallRevPayload {
  const placements = completeMemberPlacements(community, characters);
  const payload: HallRevPayload = {
    fortunes: community.fortunes,
    fortuneMeta: community.fortuneMeta ?? {},
    myths: community.myths ?? [],
    hierarchyAxes: community.hierarchyAxes,
    ruler: community.ruler,
    placements,
    outsiders: community.outsiders ?? [],
    labels: community.labels ?? [],
    pendingMoves: community.pendingMoves ?? [],
    characters: characters.map((ch) => ({
      slug: ch.slug,
      name: ch.name,
      status: ch.status,
      whoWeSee: ch.whoWeSee ?? '',
      hierarchy: ch.hierarchy ?? [],
      labelIds: ch.labelIds ?? [],
    })),
  };
  if (community.fortunesFoundedAt) payload.fortunesFoundedAt = community.fortunesFoundedAt;
  if (community.rulerCharacterSlug) payload.rulerCharacterSlug = community.rulerCharacterSlug;
  return payload;
}

/** JSON with recursively sorted object keys. Undefined object values are omitted. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(',')}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}

export function hashHallRev(payload: HallRevPayload): string {
  return createHash('sha256').update(stableStringify(payload)).digest('hex');
}

export function communityRevHash(
  community: CommunityRecord,
  characters: CharacterRecord[],
): string {
  return hashHallRev(hallRevPayload(community, characters));
}
