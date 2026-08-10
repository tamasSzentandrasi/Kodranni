import { existsSync, readFileSync } from 'node:fs';
import { fixtureCommunity, type FixtureCommunity } from './fixture';

/**
 * Prefer KODRANNI_PUBLIC_JSON (export from `kodranni campaign export-json`).
 * Falls back to built-in fixture for design work without a local store.
 */
export function loadCommunity(): FixtureCommunity {
  const path = process.env.KODRANNI_PUBLIC_JSON;
  if (path && existsSync(path)) {
    const raw = JSON.parse(readFileSync(path, 'utf8')) as {
      generatedAt: string;
      community: FixtureCommunity;
      characters: FixtureCommunity['characters'];
    };
    return {
      slug: raw.community.slug,
      name: raw.community.name,
      generatedAt: raw.generatedAt,
      fortunes: raw.community.fortunes,
      myths: raw.community.myths,
      hierarchyAxes: raw.community.hierarchyAxes,
      ruler: raw.community.ruler,
      placements: raw.community.placements,
      characters: raw.characters.map((ch) => ({
        ...ch,
        status: ch.status === 'dead' ? 'dead' : 'active',
      })),
    };
  }
  return fixtureCommunity;
}

export function getCharacter(slug: string) {
  return loadCommunity().characters.find((c) => c.slug === slug);
}
