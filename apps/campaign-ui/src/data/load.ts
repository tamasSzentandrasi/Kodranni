import { existsSync, readFileSync } from 'node:fs';
import {
  defaultCampaignTomlPath,
  openSqliteStore,
  parseCampaignToml,
  type CharacterRecord,
  type PublicSnapshot,
} from '@kodranni/store';
import { fixtureCommunity, type FixtureCommunity } from './fixture';

export type ViewCommunity = FixtureCommunity & {
  source?: 'live' | 'snapshot' | 'fixture';
  storePath?: string;
};

function characterToView(ch: CharacterRecord): FixtureCommunity['characters'][number] {
  return {
    slug: ch.slug,
    name: ch.name,
    status: ch.status === 'dead' ? 'dead' : 'active',
    communityTie: ch.communityTie,
    foundations: ch.foundations,
    foundationsEffective: ch.foundationsEffective,
    skills: ch.skills,
    traits: ch.traits,
    exertion: ch.exertion,
    echoes: ch.echoes,
    echoCapacity: ch.echoCapacity,
    echoWeight: ch.echoWeight,
    harm: ch.harm,
    dying: ch.dying,
    hierarchy: ch.hierarchy,
    armour: ch.armour,
    inventory: ch.inventory,
    flags: ch.flags,
  };
}

function fromSnapshot(
  raw: PublicSnapshot,
  source: ViewCommunity['source'],
  storePath?: string,
): ViewCommunity {
  return {
    slug: raw.community.slug,
    name: raw.community.name,
    generatedAt: raw.generatedAt,
    fortunes: raw.community.fortunes,
    myths: raw.community.myths,
    hierarchyAxes: raw.community.hierarchyAxes,
    ruler: raw.community.ruler,
    placements: raw.community.placements,
    characters: raw.characters.map(characterToView),
    source,
    storePath,
  };
}

function fromLiveStore(storePath: string): ViewCommunity {
  const store = openSqliteStore(storePath);
  try {
    return fromSnapshot(store.toPublicSnapshot(), 'live', storePath);
  } finally {
    store.close();
  }
}

/**
 * Priority:
 * 1. KODRANNI_STORE_PATH — live SQLite
 * 2. KODRANNI_CAMPAIGN_SLUG — campaign.toml → store_path
 * 3. KODRANNI_PUBLIC_JSON — redacted export
 * 4. Fixture
 */
export function loadCommunity(): ViewCommunity {
  const storePath = process.env.KODRANNI_STORE_PATH;
  if (storePath && existsSync(storePath)) {
    return fromLiveStore(storePath);
  }

  const slug = process.env.KODRANNI_CAMPAIGN_SLUG;
  if (slug) {
    try {
      const tomlPath = defaultCampaignTomlPath(slug);
      if (existsSync(tomlPath)) {
        const cfg = parseCampaignToml(readFileSync(tomlPath, 'utf8'));
        if (existsSync(cfg.storePath)) {
          return fromLiveStore(cfg.storePath);
        }
      }
    } catch {
      /* fall through */
    }
  }

  const jsonPath = process.env.KODRANNI_PUBLIC_JSON;
  if (jsonPath && existsSync(jsonPath)) {
    const raw = JSON.parse(readFileSync(jsonPath, 'utf8')) as PublicSnapshot;
    return fromSnapshot(raw, 'snapshot');
  }

  return { ...fixtureCommunity, source: 'fixture' };
}

export function getCharacter(slug: string) {
  return loadCommunity().characters.find((c) => c.slug === slug);
}
