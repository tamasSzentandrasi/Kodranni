/** Fixture when no live store is configured — Vardmark at Kelarn’s Bend demo. */

export interface FixtureCreation {
  foundationPoints: number;
  skillPoints: number;
  words: number;
  birthOmenGranted: boolean;
  guidingHandGranted: boolean;
  locked: boolean;
  claimable?: boolean;
}

export interface FixtureCharacter {
  slug: string;
  name: string;
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
        'The Vardmark helped pull down the river empire — burning and taking — and hold Kelarn’s Bend as conquerors.',
      effects: [
        {
          kind: 'advantage',
          label: 'Advantage when enforcing claim on the burned fields',
        },
        {
          kind: 'tide_mod',
          label: 'Tide start +1 defending the Bend ford',
        },
      ],
    },
    {
      title: 'Reed-Marsh Compact',
      summary: 'Grain and silence bought from the marsh folk under the warband’s shadow.',
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
      name: 'Torvald Adzeson',
      axis: 'Coin',
      tier: 'Acknowledged',
      characterSlug: 'torvald',
      note: 'A quiet man who measures twice — timber, grain, and what is still owed after a taking.',
    },
    {
      name: 'Leifr Ketilsson',
      axis: 'Arms',
      tier: 'Acknowledged',
      characterSlug: 'leifr',
      note: 'A hard bargainer who still answers when the ford is threatened.',
    },
    {
      name: 'Halla of the Mill',
      axis: 'Coin',
      tier: 'Trusted',
      note: 'Keeps the mill ledger after the taking; quiet power over grain counts.',
    },
    {
      name: 'Halla of the Mill',
      axis: 'Blood',
      tier: 'Acknowledged',
      note: 'Widow of a Bend man who did not survive the fall.',
    },
    {
      name: 'Rurik the Oath-speaker',
      axis: 'Faith',
      tier: 'Honoured',
      note: 'Speaks for the dead of the Bend and the living oaths of the Vardmark.',
    },
    {
      name: 'Sten of the Watch',
      axis: 'Arms',
      tier: 'Trusted',
      note: 'Leifr’s ford watch; eager, unpaid enough to leave if the freeze bites hard.',
    },
    {
      name: 'Bera of the Lower Bank',
      axis: 'Blood',
      tier: 'Outcast',
      note: 'Survived the taking; kept as labour on the fields.',
    },
    {
      name: 'Gorm Tally-hand',
      axis: 'Coin',
      tier: 'Outcast',
      note: 'Counts spoils for whoever holds the store tonight.',
    },
  ],
  outsiders: [
    {
      name: 'Mara of the Reeds',
      faction: 'Reed-marsh folk',
      note: 'Speaks for grain and silence; will not bleed free for foreign occupiers.',
    },
    {
      name: 'Jorun Reed-eye',
      faction: 'Reed-marsh folk',
      note: 'Scout of the channels.',
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
      slug: 'torvald',
      name: 'Torvald Adzeson',
      status: 'active',
      communityTie: 'Holds the shared grain store as spoils and ration.',
      whoWeSee:
        'A quiet man who measures twice — timber, grain, and what is still owed after a taking.',
      player: { platform: 'local', displayName: 'Player (Torvald)', accountId: 'local-torvald' },
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
        { name: 'Carpentry & Masonry', rating: 2, practice: 28, threshold: 48 },
        { name: 'Handcrafting', rating: 1, practice: 14, threshold: 24 },
        { name: 'Tinkering & Repair', rating: 1, practice: 9, threshold: 24 },
        { name: 'Appraisal', rating: 1, practice: 4, threshold: 24 },
        { name: 'Engineering & Design', rating: 1, practice: 2, threshold: 24 },
        { name: 'Smithing & Forging', rating: 1, practice: 7, threshold: 24 },
        { name: 'Negotiation', rating: 1, practice: 16, threshold: 24 },
        { name: 'Arithmetic & Accounting', rating: 1, practice: 11, threshold: 24 },
        { name: 'Tradecraft', rating: 1, practice: 5, threshold: 24 },
      ],
      traits: [{ name: 'Steady hands', note: 'Fine work under haste does not shake him.' }],
      exertion: { current: 4, max: 6 },
      echoes: [
        {
          title: 'Keep the seized grain store standing through the first winter',
          weight: 2,
          invokeWhen:
            'When the roll is about defending, repairing, rationing, or proving the warband still holds the grain store.',
          groupLabel: 'Store-wardens',
          group: [
            { name: 'Torvald Adzeson', characterSlug: 'torvald' },
            { name: 'Halla of the Mill' },
            { name: 'Gorm Tally-hand' },
          ],
        },
        {
          title: 'Raise a sound roof over the hall before the freeze locks the ford',
          weight: 1,
          invokeWhen: 'When the work is carpentry or the hall roof against weather.',
          resolved: {
            narrative:
              'The river-side seam held through the first hard frost. The hall no longer drips on the high bench.',
          },
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
          { name: 'Adze', note: 'Edge needs re-peening.' },
          { name: 'Wool cloak' },
          { name: 'Pitch pot' },
        ],
      },
      flags: { decadence: false, overCapacity: false },
    },
    {
      slug: 'leifr',
      name: 'Leifr Ketilsson',
      status: 'active',
      communityTie: 'Claims the upper fields still black from last year’s fire.',
      whoWeSee:
        'A hard bargainer who still answers when the ford is threatened — conqueror’s claim, not a neighbour’s.',
      player: {
        platform: 'discord',
        displayName: 'Player (Leifr)',
        accountId: 'demo-discord-leifr',
      },
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
        { name: 'Command', rating: 2, practice: 18, threshold: 48 },
        { name: 'Tactics', rating: 1, practice: 19, threshold: 24 },
        { name: 'Intimidate', rating: 1, practice: 12, threshold: 24 },
        { name: 'Slash', rating: 1, practice: 8, threshold: 24 },
        { name: 'Pierce', rating: 1, practice: 6, threshold: 24 },
        { name: 'Deflection', rating: 1, practice: 15, threshold: 24 },
        { name: 'Combat Awareness', rating: 1, practice: 10, threshold: 24 },
        { name: 'Footwork', rating: 1, practice: 4, threshold: 24 },
        { name: 'Scouting', rating: 1, practice: 7, threshold: 24 },
        { name: 'Swimming', rating: 1, practice: 3, threshold: 24 },
        { name: 'Strategy', rating: 1, practice: 5, threshold: 24 },
      ],
      traits: [{ name: 'Scarred knuckles' }],
      exertion: { current: 5, max: 5 },
      echoes: [
        {
          title: 'Hold Kelarn’s Bend ford until the hostages return',
          weight: 3,
          invokeWhen:
            'When the roll is about holding, contesting, or barging the ford at Kelarn’s Bend.',
        },
        {
          title: 'Keep the ford watch paid and fed through the freeze',
          weight: 2,
          invokeWhen:
            'When the roll is about the ford watch’s loyalty, pay, food, or desertion.',
          groupLabel: 'Ford watch',
          group: [
            { name: 'Leifr Ketilsson', characterSlug: 'leifr' },
            { name: 'Sten of the Watch' },
            { name: 'Ase River-step' },
            { name: 'Bjorn One-ear' },
          ],
        },
        {
          title: 'Bring his sister’s children through the first winter on seized ground',
          weight: 1,
          invokeWhen:
            'When the roll is about shelter, food, or safety for his sister’s children on occupied ground.',
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
        items: [{ name: 'Spear' }, { name: 'Shield' }],
      },
      flags: { decadence: false, overCapacity: false },
    },
  ],
};
