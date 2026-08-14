/** Fixture when no live store is configured — Vardmark at Kelarn’s Bend demo. */

export interface FixtureCharacter {
  slug: string;
  name: string;
  status: 'active' | 'dead' | 'draft';
  communityTie: string;
  whoWeSee?: string;
  player?: { platform: string; displayName: string; accountId?: string };
  foundations: Record<string, number>;
  foundationsEffective: Record<string, number>;
  skills: { name: string; rating: number; practice: number; threshold: number; foundation?: string }[];
  traits: { name: string; note?: string }[];
  exertion: { current: number; max: number };
  echoes: { title: string; weight: number; note?: string }[];
  echoCapacity: number;
  echoWeight: number;
  harm: Record<string, number>;
  dying: boolean;
  hierarchy: { axis: string; tier: string }[];
  armour: { kind: 'none' | 'light' | 'heavy'; donned: boolean };
  inventory: {
    foodDays: number;
    waterDays: number;
    items: { name: string; note?: string; tags?: string[] }[];
  };
  flags: { decadence: boolean; overCapacity: boolean };
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
  placements: { name: string; axis: string; tier: string; characterSlug?: string }[];
  outsiders: { name: string; note?: string; characterSlug?: string }[];
  characters: FixtureCharacter[];
}

export const fixtureCommunity: FixtureCommunity = {
  slug: 'vardmark',
  name: 'The Vardmark at Kelarn’s Bend',
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
      title: 'Kelarn’s Fall',
      summary: 'The Vardmark helped pull down the river empire and mean to plant at the Bend.',
      effects: [
        {
          kind: 'practice_mod',
          label: '+Practice on Farming on claimed Bend fields',
          amount: 1,
        },
        {
          kind: 'tide_mod',
          label: 'Tide start +1 defending the Bend ford',
        },
      ],
    },
    {
      title: 'Reed-Marsh Compact',
      summary: 'Seed grain bought from the marsh folk after the taking.',
      effects: [
        {
          kind: 'disadvantage',
          label: 'Disadvantage if the Compact is broken in the scene',
        },
        {
          kind: 'omen_faces',
          label: 'Omen 4 = marsh messenger',
          faces: [4],
        },
      ],
    },
  ],
  hierarchyAxes: ['Arms', 'Faith', 'Coin', 'Blood'],
  ruler: null,
  placements: [
    { name: 'Tomas', axis: 'Coin', tier: 'Acknowledged', characterSlug: 'tomas' },
    { name: 'Tomas', axis: 'Arms', tier: 'Outcast', characterSlug: 'tomas' },
    { name: 'Leif', axis: 'Arms', tier: 'Acknowledged', characterSlug: 'leif' },
    { name: 'Halla the mill-widow', axis: 'Coin', tier: 'Trusted' },
    { name: 'Old Rurik', axis: 'Faith', tier: 'Honoured' },
    { name: 'Young Sten', axis: 'Arms', tier: 'Trusted' },
  ],
  outsiders: [
    {
      name: 'Reed-marsh traders',
      note: 'Quiet people who measure grain twice and will not fight free for the Bend.',
    },
    {
      name: 'War-band on the next bend',
      note: 'Same campaign as the Vardmark; staking claims before the harvest.',
    },
  ],
  characters: [
    {
      slug: 'tomas',
      name: 'Tomas',
      status: 'active',
      communityTie: 'Vardmark freeholder at Kelarn’s Bend; keeps the shared grain store.',
      whoWeSee: 'A quiet man who measures twice and keeps his word when timber is scarce.',
      player: { platform: 'local', displayName: 'Player (Tomas)', accountId: 'local-tomas' },
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
        { name: 'Handcrafting', rating: 1, practice: 4, threshold: 24 },
      ],
      traits: [{ name: 'Steady hands', note: 'Fine work under haste does not shake him.' }],
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
      hierarchy: [],
      armour: { kind: 'none', donned: false },
      inventory: {
        foodDays: 2,
        waterDays: 3,
        items: [
          { name: 'Adze', note: 'House timber; edge needs re-peening.' },
          { name: 'Wool cloak', note: 'Dry; no spare for a second person.' },
          { name: 'Pitch pot', note: 'Half-full; one more seam on the store.' },
        ],
      },
      flags: { decadence: false, overCapacity: false },
    },
    {
      slug: 'leif',
      name: 'Leif',
      status: 'active',
      communityTie: 'Claim on the upper fields at Kelarn’s Bend, still black from last year’s fire.',
      whoWeSee: 'A hard bargainer who still answers when the ford is threatened.',
      player: { platform: 'discord', displayName: 'Player (Leif)', accountId: 'demo-discord-leif' },
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
        Dexterity: 0,
        Constitution: 2,
        Intellect: 2,
        Perception: 2,
        Resolve: 2,
        Charisma: 1,
        Guile: 1,
        Authority: 2,
      },
      skills: [
        { name: 'Command', rating: 2, practice: 0, threshold: 48 },
        { name: 'Tactics', rating: 1, practice: 10, threshold: 24 },
        { name: 'Intimidate', rating: 1, practice: 3, threshold: 24 },
      ],
      traits: [{ name: 'Scarred knuckles' }],
      exertion: { current: 5, max: 5 },
      echoes: [
        { title: 'Hold Kelarn’s Bend ford until the hostages return', weight: 3 },
        { title: 'Pact with the reed-marsh folk for seed grain', weight: 2 },
        { title: 'Mother’s knife under the floorboards', weight: 1 },
      ],
      echoCapacity: 6,
      echoWeight: 6,
      harm: {
        Crushed: 0,
        Bleeding: 1,
        Fever: 0,
        Fog: 0,
        Disoriented: 0,
        Shock: 0,
        Tarnished: 0,
        Exposed: 0,
        Disgrace: 0,
      },
      dying: false,
      hierarchy: [],
      armour: { kind: 'light', donned: true },
      inventory: {
        foodDays: 1,
        waterDays: 2,
        items: [
          { name: 'Spear', note: 'Ash shaft; head loose if used as a pry-bar.' },
          { name: 'Shield', note: 'Rim split on one quarter.' },
        ],
      },
      flags: { decadence: false, overCapacity: false },
    },
  ],
};
