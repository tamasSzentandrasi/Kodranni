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

export type FortuneKey = 'vitality' | 'cohesion' | 'surplus' | 'standing' | 'tradition';

export type FortuneSource = 'founding' | 'st' | 'pivotal';

export interface FortuneMeta {
  at: string;
  source: FortuneSource;
  /** Short, table-visible — never accountId. */
  note?: string;
}

export interface HierarchyMoveRequest {
  id: string;
  name: string;
  characterSlug?: string;
  axis: string;
  fromTier: string;
  toTier: string;
  /** Display name only — never accountId. */
  requestedBy?: string;
  note?: string;
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
  /** ISO. Absent until founding; live hall only. */
  fortunesFoundedAt?: string;
  /** Last-change per Fortune; live hall only. */
  fortuneMeta?: Partial<Record<FortuneKey, FortuneMeta>>;
  /** Pending hierarchy move requests; live hall only. */
  pendingMoves?: HierarchyMoveRequest[];
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

/**
 * Creation / Weighing budgets on a character sheet.
 * Dice for Birth Omen / Guiding Hand are rolled on the bot; points land here.
 */
export interface CreationState {
  /** Remaining Foundation points to spend. */
  foundationPoints: number;
  /** Remaining Skill points to spend. */
  skillPoints: number;
  /** Remaining Words for The Wanting (own sheet only). */
  words: number;
  /** True after bot grants Birth Omen points. */
  birthOmenGranted: boolean;
  /** True after bot grants Guiding Hand points. */
  guidingHandGranted: boolean;
  /**
   * When true, free creation spends are blocked (living record).
   * ST unlock re-opens spends; drafts start unlocked.
   */
  locked: boolean;
  /** ST prebuilt open for player claim. */
  claimable?: boolean;
}

export interface SkillProgress {
  name: string;
  rating: number;
  practice: number;
  threshold: number;
  foundation?: string;
}

/** Named person who shares a Group Echo (weight 2). */
export interface EchoStakeholder {
  name: string;
  characterSlug?: string;
  note?: string;
}

export interface EchoResolution {
  /** What happened when the concern was settled, broken, or transcended. */
  narrative: string;
  /** Optional ISO timestamp when resolved. */
  at?: string;
}

/**
 * Optional automation chips — not the primary sheet chrome.
 * Live sheet emphasises invokeWhen, weight, and stake (group/community).
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
  | 'weight_individual'
  | 'weight_group'
  | 'weight_pivotal';

export type EchoEffectPhase = 'while_carried' | 'on_resolve' | 'continuity';

export interface EchoEffect {
  kind: EchoEffectKind;
  phase?: EchoEffectPhase;
  label: string;
  detail?: string;
}

export interface EchoRecord {
  title: string;
  /** 1 Individual · 2 Group · 3 Pivotal */
  weight: 1 | 2 | 3;
  /**
   * Precise condition under which the player may argue the Echo is invokable
   * (scene match). This is the primary sheet text for active Echoes.
   */
  invokeWhen: string;
  /** Optional flavour / secondary note. */
  note?: string;
  /**
   * Weight 2: the actual people who share this burden (expandable list).
   * Weight 1 / 3: usually empty — individual bearer or whole community.
   */
  group?: EchoStakeholder[];
  /** Optional short label for the group circle (weight 2). */
  groupLabel?: string;
  /** When set, Echo is resolved — faded card: name, weight, narrative only. */
  resolved?: EchoResolution;
  /** Legacy / automation effects (defaults by weight). Not primary UI. */
  effects?: EchoEffect[];
}

export interface CharacterRecord {
  id: string;
  slug: string;
  name: string;
  kind: 'pc' | 'npc' | 'notable';
  /**
   * draft — private prep / Weighing
   * pending_review — player confirmed; awaiting ST Approve
   * active — living campaign record
   * dead — retired
   */
  status: 'active' | 'dead' | 'draft' | 'pending_review';
  /** Binding claim to the community (creation tie). */
  communityTie: string;
  /** Longer concept prose (2–5 sentences); optional alongside communityTie. */
  concept?: string;
  /** “Who do we see?” — short claim, shown as quote. */
  whoWeSee?: string;
  /**
   * Portrait file under campaign media/avatars/ (basename), or absolute/http URL.
   * Served by campaign-ui at /api/avatar/:slug when store-backed.
   */
  avatar?: string;
  /** Player account mapped to this character (display on sheet). */
  player?: PlayerBinding;
  /**
   * Platform user who started create/claim on the bot.
   * Confirm uses this for @mention; Approve binds player from it.
   */
  initiator?: PlayerBinding & { accountId: string };
  /** Budgets + lock; absent on legacy seed sheets means locked living record. */
  creation?: CreationState;
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
  /** Primary / last-focused character id (soft default). */
  characterId?: string;
  /** When multiple alive PCs are bound, which one acts by default. */
  focusedCharacterId?: string;
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
