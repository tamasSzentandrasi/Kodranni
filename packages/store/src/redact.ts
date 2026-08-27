/**
 * Allowlist projection for the public snapshot (O23 / infra I3).
 * Mechanical store objects may still carry bindings; the archive must not.
 */
import type { CharacterRecord, PublicSnapshot } from './types.js';

/** Discord / platform snowflakes are 17–20 digit decimals. */
const SNOWFLAKE = /\b\d{17,20}\b/;

export function redactCharacterForPublic(ch: CharacterRecord): CharacterRecord {
  const player = ch.player
    ? { platform: ch.player.platform, displayName: ch.player.displayName }
    : undefined;
  const { initiator: _initiator, ...rest } = ch;
  return { ...rest, player };
}

export function redactSnapshot(snap: PublicSnapshot): PublicSnapshot {
  return {
    ...snap,
    characters: snap.characters.map(redactCharacterForPublic),
  };
}

/** Return human-readable violations; empty means the payload is safe to publish. */
export function publicSnapshotViolations(snap: PublicSnapshot): string[] {
  const errors: string[] = [];
  if (snap.community && 'pendingMoves' in snap.community && snap.community.pendingMoves != null) {
    errors.push('community.pendingMoves');
  }
  if (snap.community && 'fortuneMeta' in snap.community && snap.community.fortuneMeta != null) {
    errors.push('community.fortuneMeta');
  }
  if (
    snap.community &&
    'fortunesFoundedAt' in snap.community &&
    snap.community.fortunesFoundedAt != null
  ) {
    errors.push('community.fortunesFoundedAt');
  }
  for (const ch of snap.characters) {
    if (ch.status === 'draft') errors.push(`draft character ${ch.slug}`);
    if (ch.player?.accountId) errors.push(`character ${ch.slug} player.accountId`);
    if (ch.initiator) errors.push(`character ${ch.slug} initiator`);
  }
  const json = JSON.stringify(snap);
  if (SNOWFLAKE.test(json)) errors.push('payload contains a 17–20 digit id (possible snowflake)');
  return errors;
}

export function assertPublicSnapshot(snap: PublicSnapshot): void {
  const v = publicSnapshotViolations(snap);
  if (v.length) {
    throw new Error(`public snapshot is not redacted: ${v.join('; ')}`);
  }
}
