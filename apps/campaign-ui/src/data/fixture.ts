/** Fixture when no live store is configured — Aspalath after the night the knife missed. */
import { buildDemoHall } from '@kodranni/store';
import type { CharacterRecord } from '@kodranni/store/types';

export interface FixtureCreation {
  foundationPoints: number;
  skillPoints: number;
  words: number;
  birthOmenGranted: boolean;
  guidingHandGranted: boolean;
  locked: boolean;
  claimable?: boolean;
  placeholder?: boolean;
}

export interface FixtureCharacter {
  slug: string;
  name: string;
  kind?: 'pc' | 'npc' | 'notable';
  status: 'active' | 'dead' | 'draft' | 'pending_review';
  communityTie: string;
  concept?: string;
  whoWeSee?: string;
  avatar?: string;
  player?: { platform: string; displayName: string; accountId?: string };
  initiator?: { platform: string; displayName: string; accountId: string };
  creation?: FixtureCreation;
  foundations: Record<string, number>;
  foundationsEffective: Record<string, number>;
  skills: { name: string; rating: number; practice: number; threshold: number; foundation?: string }[];
  traits: { name: string; note?: string }[];
  exertion: { current: number; max: number };
  echoes: {
    title: string;
    weight: number;
    invokeWhen?: string;
    note?: string;
    group?: { name: string; characterSlug?: string; note?: string }[];
    groupLabel?: string;
    resolved?: { narrative: string; at?: string };
    effects?: { kind: string; phase?: string; label: string; detail?: string }[];
  }[];
  echoCapacity: number;
  echoWeight: number;
  harm: Record<string, number>;
  dying: boolean;
  hierarchy: { axis: string; tier: string }[];
  armour: { kind: 'none' | 'light' | 'heavy'; donned: boolean };
  inventory: {
    foodDays: number;
    waterDays: number;
    items: { name: string; note?: string; tags?: string[]; icon?: string }[];
  };
  flags: { decadence: boolean; overCapacity: boolean };
  labelIds?: string[];
}

export interface FixtureMyth {
  title: string;
  summary?: string;
  effects: {
    kind: string;
    label: string;
    detail?: string;
    faces?: number[];
    amount?: number;
  }[];
}

export interface FixtureCommunity {
  slug: string;
  name: string;
  generatedAt: string;
  fortunes: Record<string, number>;
  myths: FixtureMyth[];
  hierarchyAxes: string[];
  ruler: string | null;
  rulerCharacterSlug?: string;
  placements: {
    name: string;
    axis: string;
    tier: string;
    characterSlug?: string;
    note?: string;
  }[];
  outsiders: { name: string; faction?: string; note?: string; characterSlug?: string; labelIds?: string[] }[];
  labelGroups?: { id: string; name: string; kind: 'faction' | 'tag' }[];
  labels?: { id: string; groupId: string; name: string; hue?: number }[];
  factions?: { name: string; hue: number }[];
  /** Live hall only; archive snapshots omit. */
  fortunesFoundedAt?: string;
  fortuneMeta?: Partial<
    Record<string, { at: string; source: 'founding' | 'st' | 'pivotal'; note?: string }>
  >;
  pendingMoves?: {
    id: string;
    name: string;
    characterSlug?: string;
    axis: string;
    fromTier: string;
    toTier: string;
    requestedBy?: string;
    note?: string;
  }[];
  characters: FixtureCharacter[];
}

function toFixtureCharacter(ch: CharacterRecord): FixtureCharacter {
  return {
    slug: ch.slug,
    name: ch.name,
    kind: ch.kind,
    status: ch.status,
    communityTie: ch.communityTie,
    concept: ch.concept,
    whoWeSee: ch.whoWeSee,
    player: ch.player,
    creation: ch.creation,
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
    labelIds: ch.labelIds,
  };
}

const { community: demoCommunity, characters: demoCharacters } = buildDemoHall();

export const fixtureCommunity: FixtureCommunity = {
  slug: demoCommunity.slug,
  name: demoCommunity.name,
  generatedAt: new Date().toISOString(),
  fortunes: demoCommunity.fortunes,
  myths: demoCommunity.myths,
  hierarchyAxes: demoCommunity.hierarchyAxes,
  ruler: demoCommunity.ruler,
  rulerCharacterSlug: demoCommunity.rulerCharacterSlug,
  placements: demoCommunity.placements,
  outsiders: demoCommunity.outsiders,
  labelGroups: demoCommunity.labelGroups,
  labels: demoCommunity.labels,
  factions: demoCommunity.factions,
  fortunesFoundedAt: demoCommunity.fortunesFoundedAt,
  characters: demoCharacters.map(toFixtureCharacter),
};
