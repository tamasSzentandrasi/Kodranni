/** Fixture SoT when no live store / export is configured.
 * Aligns with Guidebook seed “Settlers on a broken shore” and Tomas / capacity examples.
 */

export interface FixtureCharacter {
  slug: string;
  name: string;
  status: 'active' | 'dead';
  communityTie: string;
  foundations: Record<string, number>;
  foundationsEffective: Record<string, number>;
  skills: { name: string; rating: number; practice: number; threshold: number }[];
  traits: string[];
  exertion: { current: number; max: number };
  echoes: { title: string; weight: number }[];
  echoCapacity: number;
  echoWeight: number;
  harm: Record<string, number>;
  dying: boolean;
  hierarchy: { axis: string; tier: string }[];
  armour: { kind: 'none' | 'light' | 'heavy'; donned: boolean };
  inventory: { foodDays: number; waterDays: number; named: string[] };
  flags: { decadence: boolean; overCapacity: boolean };
}

export interface FixtureCommunity {
  slug: string;
  name: string;
  generatedAt: string;
  fortunes: Record<string, number>;
  myths: { title: string; summary: string }[];
  hierarchyAxes: string[];
  ruler: string | null;
  placements: { name: string; axis: string; tier: string }[];
  characters: FixtureCharacter[];
}

export const fixtureCommunity: FixtureCommunity = {
  slug: 'broken-shore',
  name: 'Settlers on the broken shore',
  generatedAt: new Date().toISOString(),
  fortunes: {
    vitality: 1,
    cohesion: 2,
    surplus: 1,
    standing: 1,
    tradition: 2,
  },
  myths: [
    {
      title: 'The Shore Was Taken',
      summary:
        'The migratory kin helped pull down the river empire and mean to plant here — the first harvest will decide if this is a home.',
    },
  ],
  hierarchyAxes: ['Arms', 'Faith', 'Coin', 'Blood'],
  ruler: null,
  placements: [
    { name: 'Tomas', axis: 'Coin', tier: 'Acknowledged' },
    { name: 'Tomas', axis: 'Arms', tier: 'Outcast' },
    { name: 'Leif', axis: 'Arms', tier: 'Acknowledged' },
  ],
  characters: [
    {
      slug: 'tomas',
      name: 'Tomas',
      status: 'active',
      communityTie:
        'Freeholder among the settlers on the burned river fields; owes labour on the grain store the kin still share.',
      foundations: {
        Strength: 2,
        Dexterity: 2,
        Constitution: 2,
        Intellect: 2,
        Perception: 1,
        Resolve: 2,
        Charisma: 2,
        Guile: 1,
        Authority: 1,
      },
      foundationsEffective: {
        Strength: 2,
        Dexterity: 2,
        Constitution: 2,
        Intellect: 2,
        Perception: 1,
        Resolve: 2,
        Charisma: 2,
        Guile: 1,
        Authority: 1,
      },
      skills: [
        { name: 'Carpentry & Masonry', rating: 2, practice: 12, threshold: 48 },
        { name: 'Negotiation', rating: 1, practice: 6, threshold: 24 },
      ],
      traits: ['Steady hands'],
      exertion: { current: 4, max: 6 },
      echoes: [
        {
          title: 'Keep the shared grain store dry through the first winter',
          weight: 2,
        },
      ],
      echoCapacity: 5,
      echoWeight: 2,
      harm: {
        Crushed: 0,
        Bleeding: 0,
        Fever: 0,
        Fog: 0,
        Disoriented: 0,
        Shock: 0,
        Tarnished: 0,
        Exposed: 0,
        Disgrace: 0,
      },
      dying: false,
      hierarchy: [
        { axis: 'Coin', tier: 'Acknowledged' },
        { axis: 'Arms', tier: 'Outcast' },
      ],
      armour: { kind: 'none', donned: false },
      inventory: { foodDays: 2, waterDays: 3, named: ['Adze', 'Wool cloak', 'Pitch pot'] },
      flags: { decadence: false, overCapacity: false },
    },
    {
      slug: 'leif',
      name: 'Leif',
      status: 'active',
      communityTie:
        'Took part in the taking of this shore; holds a claim on the upper fields still black from last year’s fire.',
      foundations: {
        Strength: 2,
        Dexterity: 1,
        Constitution: 2,
        Intellect: 2,
        Perception: 2,
        Resolve: 2,
        Charisma: 1,
        Guile: 1,
        Authority: 2,
      },
      foundationsEffective: {
        Strength: 2,
        Dexterity: 1,
        Constitution: 2,
        Intellect: 2,
        Perception: 2,
        Resolve: 2,
        Charisma: 1,
        Guile: 1,
        Authority: 2,
      },
      skills: [{ name: 'Command', rating: 2, practice: 0, threshold: 48 }],
      traits: [],
      exertion: { current: 5, max: 5 },
      echoes: [
        { title: 'Hold the river ford until the hostages return', weight: 3 },
        { title: 'Pact with the marsh folk for seed grain', weight: 2 },
        { title: 'Mother’s knife under the floorboards', weight: 1 },
      ],
      echoCapacity: 6,
      echoWeight: 6,
      harm: {
        Crushed: 0,
        Bleeding: 0,
        Fever: 0,
        Fog: 0,
        Disoriented: 0,
        Shock: 0,
        Tarnished: 0,
        Exposed: 0,
        Disgrace: 0,
      },
      dying: false,
      hierarchy: [{ axis: 'Arms', tier: 'Acknowledged' }],
      armour: { kind: 'light', donned: true },
      inventory: { foodDays: 1, waterDays: 2, named: ['Spear', 'Shield'] },
      flags: { decadence: false, overCapacity: false },
    },
  ],
};

export const FORTUNE_LABELS: Record<number, string> = {
  0: 'Crisis',
  1: 'Strained',
  2: 'Steady',
  3: 'Abundance',
};
