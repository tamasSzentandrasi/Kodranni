/**
 * Public snapshot restore — repopulate a campaign sqlite from public.json.
 * Archive snapshots have no drafts, members, or snowflakes.
 */
import type { CommunityStorePort } from './port.js';
import type { PublicSnapshot } from './types.js';

export function parsePublicSnapshot(raw: string): PublicSnapshot {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new Error('snapshot is not JSON');
  }
  if (!parsed || typeof parsed !== 'object') throw new Error('snapshot is not an object');
  const snap = parsed as PublicSnapshot;
  if (!snap.community || typeof snap.community !== 'object') {
    throw new Error('snapshot missing community');
  }
  if (!Array.isArray(snap.characters)) throw new Error('snapshot missing characters');
  return snap;
}

/**
 * Replace the campaign hall and published characters with a snapshot.
 * Keeps the local campaign slug (the ?campaign= id); takes the campaign name from the snapshot.
 */
export function applyPublicSnapshot(
  store: CommunityStorePort,
  snap: PublicSnapshot,
  slug: string,
): void {
  const name = String(snap.community.name ?? '').trim() || slug;
  store.putCommunity({
    ...snap.community,
    slug,
    name,
  });
  for (const ch of store.listCharacters()) {
    store.deleteCharacter(ch.slug);
  }
  for (const ch of snap.characters) {
    store.putCharacter({ ...ch, status: ch.status === 'draft' ? 'active' : (ch.status ?? 'active') });
  }
}

/** Campaign title → slug for Found. */
export function slugFromCampaignName(name: string): string {
  const s = name
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  if (!s) throw new Error('campaign name needs a letter or digit');
  return s;
}
