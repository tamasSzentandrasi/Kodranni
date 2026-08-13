export interface AuditEvent {
  id: string;
  ts: string;
  type: string;
  actor?: string;
  clientEventId?: string;
  payload: unknown;
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
  myths: { title: string; summary: string }[];
  hierarchyAxes: string[];
  ruler: string | null;
  placements: { name: string; axis: string; tier: string }[];
}

export interface CharacterRecord {
  id: string;
  slug: string;
  name: string;
  kind: 'pc' | 'npc' | 'notable';
  status: 'active' | 'dead' | 'draft';
  communityTie: string;
  foundations: Record<string, number>;
  foundationsEffective: Record<string, number>;
  skills: { name: string; rating: number; practice: number; threshold: number; foundation?: string }[];
  traits: string[];
  /** Max = Resolve + Constitution + Charisma (raw Foundations). */
  exertion: { current: number; max: number };
  echoes: { title: string; weight: number }[];
  /** max(Strength, Dexterity) + Intellect + Authority — independent of Exertion max. */
  echoCapacity: number;
  /** Sum of Echo weights. */
  echoWeight: number;
  harm: Record<string, number>;
  dying: boolean;
  hierarchy: { axis: string; tier: string }[];
  armour: { kind: 'none' | 'light' | 'heavy'; donned: boolean };
  inventory: { foodDays: number; waterDays: number; named: string[] };
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
