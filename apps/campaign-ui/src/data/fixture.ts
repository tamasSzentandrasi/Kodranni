/** Fixture when no live store is configured — Vardmark at Kelarn’s Bend demo. */

export interface FixtureCharacter {
  slug: string;
  name: string;
  status: 'active' | 'dead' | 'draft';
  communityTie: string;
  whoWeSee?: string;
  avatar?: string;
  player?: { platform: string; displayName: string; accountId?: string };
  foundations: Record<string, number>;
  foundationsEffective: Record<string, number>;
  skills: { name: string; rating: number; practice: number; threshold: number; foundation?: string }[];
  traits: { name: string; note?: string }[];
  exertion: { current: number; max: number };
  echoes: {
    title: string;
    weight: number;
    note?: string;
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
  placements: {
    name: string;
    axis: string;
    tier: string;
    characterSlug?: string;
    note?: string;
  }[];
  outsiders: { name: string; faction?: string; note?: string; characterSlug?: string }[];
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
      summary:
        'The Vardmark helped pull down the river empire — burning and taking — and hold Kelarn’s Bend as conquerors, not as invited guests.',
      effects: [
        {
          kind: 'advantage',
          label: 'Advantage when enforcing claim on the burned fields',
          detail: 'When Myth is tagged and the scene is about holding what was taken.',
        },
        {
          kind: 'tide_mod',
          label: 'Tide start +1 defending the Bend ford',
          detail: 'When a Tide is opened to hold the ford at Kelarn’s Bend.',
        },
      ],
    },
    {
      title: 'Reed-Marsh Compact',
      summary:
        'Grain and silence bought from the marsh folk under the shadow of the warband — trade that can turn to blood.',
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
    {
      name: 'Tomas',
      axis: 'Coin',
      tier: 'Acknowledged',
      characterSlug: 'tomas',
      note: 'A quiet man who measures twice — timber, grain, and what is owed after a taking.',
    },
    {
      name: 'Leif',
      axis: 'Arms',
      tier: 'Acknowledged',
      characterSlug: 'leif',
      note: 'A hard bargainer who still answers when the ford is threatened.',
    },
    {
      name: 'Halla',
      axis: 'Coin',
      tier: 'Trusted',
      note: 'Keeps the mill ledger after the taking; quiet power over grain counts.',
    },
    {
      name: 'Halla',
      axis: 'Blood',
      tier: 'Acknowledged',
      note: 'Widow of a Bend man who did not survive the fall.',
    },
    {
      name: 'Old Rurik',
      axis: 'Faith',
      tier: 'Honoured',
      note: 'Speaks for the dead of the Bend and the living oaths of the Vardmark.',
    },
    {
      name: 'Young Sten',
      axis: 'Arms',
      tier: 'Trusted',
      note: 'Leif’s ford watch; eager, unpaid enough to leave if the freeze bites hard.',
    },
    {
      name: 'Bera of the lower bank',
      axis: 'Blood',
      tier: 'Outcast',
      note: 'Survived the taking; kept as labour on the fields.',
    },
    {
      name: 'Gorm the tally-hand',
      axis: 'Coin',
      tier: 'Outcast',
      note: 'Counts spoils for whoever holds the store tonight.',
    },
  ],
  outsiders: [
    {
      name: 'Mara of the Reeds',
      faction: 'Reed-marsh folk',
      note: 'Speaks for grain and silence; will not bleed free for foreign occupiers at the Bend.',
    },
    {
      name: 'Jorun Reed-eye',
      faction: 'Reed-marsh folk',
      note: 'Scout of the channels; knows every path that can starve or feed the ford.',
    },
    {
      name: 'Skard of the Next Bend',
      faction: 'Rival war-band',
      note: 'Means to stake the next ford before the Vardmark hardens theirs.',
    },
    {
      name: 'Inga Ash-tongue',
      faction: 'Rival war-band',
      note: 'Herald and bargainer for the rival band.',
    },
  ],
  characters: [
    {
      slug: 'tomas',
      name: 'Tomas',
      status: 'active',
      communityTie:
        'Vardmark of Kelarn’s Bend — took the ground in the fall of Kelarn; holds the shared grain store as spoils and ration.',
      whoWeSee: 'A quiet man who measures twice — timber, grain, and what is owed after a taking.',
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
          title: 'Keep the seized grain store standing through the first winter of occupation',
          weight: 2,
          note: 'The store is the warband’s ration and proof they hold the Bend.',
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
          { name: 'Adze', note: 'Taken timber work; edge needs re-peening.' },
          { name: 'Wool cloak', note: 'Dry; no spare for a second person.' },
          { name: 'Pitch pot', note: 'Half-full; one more seam on the seized store.' },
        ],
      },
      flags: { decadence: false, overCapacity: false },
    },
    {
      slug: 'leif',
      name: 'Leif',
      status: 'active',
      communityTie:
        'Took part in the burning and the taking of Kelarn’s Bend; claims the upper fields still black from last year’s fire.',
      whoWeSee:
        'A hard bargainer who still answers when the ford is threatened — conqueror’s claim, not a neighbour’s.',
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
      traits: [{ name: 'Scarred knuckles', note: 'From the taking of the shore.' }],
      exertion: { current: 5, max: 5 },
      echoes: [
        {
          title: 'Hold Kelarn’s Bend ford until the hostages return',
          weight: 3,
          note: 'The ford is the claim; lose it and the Bend is only ash and talk.',
        },
        {
          title: 'Keep Young Sten and the ford watch paid and fed through the freeze',
          weight: 2,
          note: 'If they desert, the ford is open and his name is ash with them.',
        },
        {
          title: 'Bring his sister’s children through the first winter on seized ground',
          weight: 1,
          note: 'Personal stake: the occupation must feed more than the warband’s pride.',
        },
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
