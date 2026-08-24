/** Fixture when no live store is configured — Vardmark at Kelarn’s Bend demo. */

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

const EMPTY_HARM: Record<string, number> = {
  Crushed: 0,
  Bleeding: 0,
  Fever: 0,
  Fog: 0,
  Disoriented: 0,
  Shock: 0,
  Tarnished: 0,
  Exposed: 0,
  Disgrace: 0,
};

const BASE_FOUND: Record<string, number> = {
  Strength: 1,
  Dexterity: 1,
  Constitution: 1,
  Intellect: 1,
  Perception: 1,
  Resolve: 1,
  Charisma: 1,
  Guile: 1,
  Authority: 1,
};

function fixtureNpc(opts: {
  slug: string;
  name: string;
  whoWeSee: string;
  communityTie?: string;
  hierarchy: { axis: string; tier: string }[];
}): FixtureCharacter {
  return {
    slug: opts.slug,
    name: opts.name,
    kind: 'npc',
    status: 'active',
    communityTie: opts.communityTie ?? '',
    whoWeSee: opts.whoWeSee,
    creation: {
      foundationPoints: 0,
      skillPoints: 0,
      words: 0,
      birthOmenGranted: true,
      guidingHandGranted: true,
      locked: true,
      placeholder: false,
    },
    foundations: { ...BASE_FOUND },
    foundationsEffective: { ...BASE_FOUND },
    skills: [],
    traits: [],
    exertion: { current: 0, max: 3 },
    echoes: [],
    echoCapacity: 3,
    echoWeight: 0,
    harm: { ...EMPTY_HARM },
    dying: false,
    hierarchy: opts.hierarchy,
    armour: { kind: 'none', donned: false },
    inventory: { foodDays: 0, waterDays: 0, items: [] },
    flags: { decadence: true, overCapacity: false },
  };
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
      name: 'Halla Ketilsdottir',
      axis: 'Coin',
      tier: 'Trusted',
      characterSlug: 'halla',
      note: 'Keeps the mill ledger after the taking; quiet power over grain counts.',
    },
    {
      name: 'Halla Ketilsdottir',
      axis: 'Blood',
      tier: 'Acknowledged',
      characterSlug: 'halla',
      note: 'Widow of a Bend man who did not survive the fall.',
    },
    {
      name: 'Rurik Hrafnsson',
      axis: 'Faith',
      tier: 'Honoured',
      characterSlug: 'rurik',
      note: 'Speaks for the dead of the Bend and the living oaths of the Vardmark.',
    },
    {
      name: 'Sten Vebjornsson',
      axis: 'Arms',
      tier: 'Trusted',
      characterSlug: 'sten',
      note: 'Leifr’s ford watch; eager, unpaid enough to leave if the freeze bites hard.',
    },
    {
      name: 'Bera Unfree',
      axis: 'Blood',
      tier: 'Outcast',
      characterSlug: 'bera',
      note: 'Survived the taking; kept as labour on the fields.',
    },
    {
      name: 'Gorm Audunsson',
      axis: 'Coin',
      tier: 'Outcast',
      characterSlug: 'gorm',
      note: 'Counts spoils for whoever holds the store tonight.',
    },
  ],
  factions: [
    { name: 'Reed-marsh folk', hue: 142 },
    { name: 'Rival war-band', hue: 12 },
  ],
  outsiders: [
    {
      name: 'Mara of the Reeds',
      faction: 'Reed-marsh folk',
      note: 'Speaks for grain and silence; will not bleed free for foreign occupiers.',
    },
    {
      name: 'Jorun of the Channels',
      faction: 'Reed-marsh folk',
      note: 'Scout of the channels.',
    },
    {
      name: 'Skard Ketilsson',
      faction: 'Rival war-band',
      note: 'Means to stake the next ford before the Vardmark hardens theirs.',
    },
    {
      name: 'Inga Skardsdottir',
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
      player: { platform: 'local', displayName: 'Torvald', accountId: 'local-torvald' },
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
            { name: 'Halla Ketilsdottir' },
            { name: 'Gorm Audunsson' },
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
        displayName: 'Leifr',
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
            { name: 'Sten Vebjornsson' },
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
    fixtureNpc({
      slug: 'halla',
      name: 'Halla Ketilsdottir',
      whoWeSee: 'Keeps the mill ledger after the taking; quiet power over grain counts.',
      communityTie: 'Widow of a Bend man — still claims kin-right in the hall.',
      hierarchy: [
        { axis: 'Coin', tier: 'Trusted' },
        { axis: 'Blood', tier: 'Acknowledged' },
      ],
    }),
    fixtureNpc({
      slug: 'rurik',
      name: 'Rurik Hrafnsson',
      whoWeSee: 'Speaks for the dead of the Bend and the living oaths of the Vardmark.',
      hierarchy: [{ axis: 'Faith', tier: 'Honoured' }],
    }),
    fixtureNpc({
      slug: 'sten',
      name: 'Sten Vebjornsson',
      whoWeSee: 'Leifr’s ford watch; eager, unpaid enough to leave if the freeze bites hard.',
      hierarchy: [{ axis: 'Arms', tier: 'Trusted' }],
    }),
    fixtureNpc({
      slug: 'bera',
      name: 'Bera Unfree',
      whoWeSee: 'Survived the taking; kept as labour on the fields.',
      hierarchy: [{ axis: 'Blood', tier: 'Outcast' }],
    }),
    fixtureNpc({
      slug: 'gorm',
      name: 'Gorm Audunsson',
      whoWeSee: 'Counts spoils for whoever holds the store tonight.',
      hierarchy: [{ axis: 'Coin', tier: 'Outcast' }],
    }),
  ],
};
