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
    status: ch.status === 'dead' ? 'dead' : ch.status === 'draft' ? 'draft' : 'active',
    communityTie: ch.communityTie,
    whoWeSee: ch.whoWeSee,
    player: ch.player,
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
    rulerCharacterSlug: raw.community.rulerCharacterSlug,
    placements: raw.community.placements,
    outsiders: raw.community.outsiders ?? [],
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

export const FORTUNE_LABELS: Record<number, string> = {
  0: 'Crisis',
  1: 'Strained',
  2: 'Steady',
  3: 'Abundance',
};

export const MYTH_KIND_COLUMNS: { kind: string; header: string }[] = [
  { kind: 'exertion_free', header: 'Exertion free' },
  { kind: 'exertion_forced', header: 'Exertion cost' },
  { kind: 'advantage', header: 'Advantage' },
  { kind: 'disadvantage', header: 'Disadvantage' },
  { kind: 'omen_faces', header: 'Omen faces' },
  { kind: 'practice_mod', header: 'Practice' },
  { kind: 'tide_mod', header: 'Tide' },
  { kind: 'trait_grant', header: 'Trait grant' },
  { kind: 'trait_deny', header: 'Trait deny' },
];
