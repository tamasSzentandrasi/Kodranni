export interface AuditEvent {
  id: string;
  ts: string;
  type: string;
  actor?: string;
  clientEventId?: string;
  payload: unknown;
}

/** Typed Foundation Myth effects (Guidebook craft ingredients). */
export type MythEffectKind =
  | 'exertion_free'
  | 'exertion_forced'
  | 'advantage'
  | 'disadvantage'
  | 'omen_faces'
  | 'practice_mod'
  | 'tide_mod'
  | 'trait_grant'
  | 'trait_deny';

export interface MythEffect {
  kind: MythEffectKind;
  /** Short chip label shown in the tracker. */
  label: string;
  /** Optional detail for hover / expand. */
  detail?: string;
  /** Omen faces when kind is omen_faces. */
  faces?: number[];
  /** Numeric delta when relevant (practice, tide, etc.). */
  amount?: number;
}

export interface FoundationMyth {
  title: string;
  /** Short blurb — UI may show on hover over the name. */
  summary?: string;
  effects: MythEffect[];
}

export interface HierarchyPlacement {
  name: string;
  axis: string;
  tier: string;
  /** Optional link to character slug when the name is a PC/NPC on sheet. */
  characterSlug?: string;
  /** Short who-we-see / flavour for diagram hover (NPCs without a full sheet). */
  note?: string;
}

export interface OutsiderRecord {
  /** Always a person — never a faction label as the name. */
  name: string;
  /** Faction / banner this person answers to (colour-coded in the UI). */
  faction?: string;
  note?: string;
  characterSlug?: string;
}

export interface CommunityRecord {
  slug: string;
  name: string;
  fortunes: {
    vitality: number;
    cohesion: number;
    surplus: number;
    standing: number;
    tradition: number;
  };
  myths: FoundationMyth[];
  hierarchyAxes: string[];
  ruler: string | null;
  rulerCharacterSlug?: string;
  placements: HierarchyPlacement[];
  outsiders: OutsiderRecord[];
}

export interface InventoryItem {
  name: string;
  /** Short functional / contextual note. */
  note?: string;
  tags?: string[];
}

export interface TraitRecord {
  name: string;
  note?: string;
}

export interface PlayerBinding {
  platform: 'discord' | 'fluxer' | 'local' | string;
  /** Display handle / nickname. */
  displayName: string;
  accountId?: string;
}

export interface SkillProgress {
  name: string;
  rating: number;
  practice: number;
  threshold: number;
  foundation?: string;
}

/**
 * Mechanical facets of a carried Echo.
 * Grouped by phase in the UI (while carried / on resolve / continuity).
 */
export type EchoEffectKind =
  | 'invoke_second_exertion'
  | 'load_cost'
  | 'on_resolve_personal'
  | 'on_resolve_group'
  | 'pivotal_fortune'
  | 'pivotal_myth'
  | 'persist_legacy'
  | 'dies_with_bearer'
  | 'custom'
  /** @deprecated legacy sparse-matrix chips — rebuilt on load */
  | 'weight_individual'
  | 'weight_group'
  | 'weight_pivotal';

export type EchoEffectPhase = 'while_carried' | 'on_resolve' | 'continuity';

export interface EchoEffect {
  kind: EchoEffectKind;
  /** UI grouping. Defaults inferred from kind when missing. */
  phase?: EchoEffectPhase;
  label: string;
  detail?: string;
}

export interface EchoRecord {
  title: string;
  /** 1 Individual · 2 Group · 3 Pivotal */
  weight: 1 | 2 | 3;
  /** Short description — shown via info mark, not preloaded. */
  note?: string;
  effects: EchoEffect[];
}

export interface CharacterRecord {
  id: string;
  slug: string;
  name: string;
  kind: 'pc' | 'npc' | 'notable';
  status: 'active' | 'dead' | 'draft';
  /** Binding claim to the community (creation tie). */
  communityTie: string;
  /** “Who do we see?” — short claim, shown as quote. */
  whoWeSee?: string;
  /**
   * Portrait file under campaign media/avatars/ (basename), or absolute/http URL.
   * Served by campaign-ui at /api/avatar/:slug when store-backed.
   */
  avatar?: string;
  /** Player account mapped to this character (display on sheet). */
  player?: PlayerBinding;
  foundations: Record<string, number>;
  foundationsEffective: Record<string, number>;
  skills: SkillProgress[];
  traits: TraitRecord[];
  /** Max = Resolve + Constitution + Charisma (raw Foundations). */
  exertion: { current: number; max: number };
  echoes: EchoRecord[];
  /** max(Strength, Dexterity) + Intellect + Authority */
  echoCapacity: number;
  echoWeight: number;
  harm: Record<string, number>;
  dying: boolean;
  /** Stored for community diagram; not primary sheet chrome. */
  hierarchy: { axis: string; tier: string }[];
  armour: { kind: 'none' | 'light' | 'heavy'; donned: boolean };
  inventory: {
    foodDays: number;
    waterDays: number;
    items: InventoryItem[];
  };
  flags: { decadence: boolean; overCapacity: boolean };
}

export interface MemberRecord {
  platform: 'discord' | 'fluxer';
  accountId: string;
  displayName?: string;
  characterId?: string;
  role: 'player' | 'storyteller';
}

export interface RollRecord {
  id: string;
  ts: string;
  characterId?: string;
  parentRollId?: string;
  data: Record<string, unknown>;
}

export interface PublicSnapshot {
  generatedAt: string;
  schemaVersion: number;
  community: CommunityRecord;
  characters: CharacterRecord[];
}
