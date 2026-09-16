/** Fixture when no live store is configured — Aspalath after the count was stabbed. */

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
  labelIds?: string[];
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
    labelIds: opts.labelIds,
  };
}

export const fixtureCommunity: FixtureCommunity = {
  slug: 'aspalath',
  name: 'Aspalath',
  generatedAt: new Date().toISOString(),
  fortunes: {
    vitality: 1,
    cohesion: 1,
    surplus: 2,
    standing: 2,
    tradition: 2,
  },
  myths: [
    {
      title: 'The Count on the Steps',
      summary:
        'Rade Velatri was stabbed on the cathedral steps at vintage. The election is this moon.',
      effects: [
        {
          kind: 'advantage',
          label: 'Advantage when proving who may name a count',
        },
        {
          kind: 'tide_mod',
          label: 'Tide start +1 holding the marketplace during the naming',
        },
      ],
    },
    {
      title: 'Moro’s Warehouse',
      summary: 'The commune’s loading crane is how the Council takes its due. House Moro unloads without it.',
      effects: [
        {
          kind: 'disadvantage',
          label: 'Disadvantage if the crane is forced in the scene',
        },
        {
          kind: 'omen_faces',
          label: 'Omen 4 = Vessaran hulls',
          faces: [4],
        },
      ],
    },
  ],
  hierarchyAxes: ['Arms', 'Faith', 'Coin', 'Blood'],
  ruler: null,
  placements: [
    {
      name: 'Nerio Calva',
      axis: 'Coin',
      tier: 'Acknowledged',
      characterSlug: 'nerio',
      note: 'Mason. Lime on his sleeves. Eats at Velatri tables when they remember him.',
    },
    {
      name: 'Stana Krstova',
      axis: 'Arms',
      tier: 'Acknowledged',
      characterSlug: 'stana',
      note: 'Commands the night watch on the harbour chain. She will not send rowers to Vessara.',
    },
    {
      name: 'Agnese Orsani',
      axis: 'Coin',
      tier: 'Trusted',
      characterSlug: 'agnese',
      note: 'Keeps the account of what the commune still owes the last galley’s widows.',
    },
    {
      name: 'Agnese Orsani',
      axis: 'Blood',
      tier: 'Acknowledged',
      characterSlug: 'agnese',
      note: 'House Orsani by marriage. The widows come to her before they come to the count.',
    },
    {
      name: 'Canon Lovro',
      axis: 'Faith',
      tier: 'Honoured',
      characterSlug: 'lovro',
      note: 'Serves in the cathedral, in Latin. Boat families bury in their own tongue.',
    },
    {
      name: 'Vuk Osojanin',
      axis: 'Arms',
      tier: 'Trusted',
      characterSlug: 'vuk',
      note: 'Shepherd from Osoje. Kin to Stana. Not a burgher.',
    },
    {
      name: 'Orsa Velatri',
      axis: 'Blood',
      tier: 'Trusted',
      characterSlug: 'orsa',
      note: 'Sister of the dead count. She wants the Council to elect his son, who is twelve.',
    },
    {
      name: 'Piero Moro',
      axis: 'Coin',
      tier: 'Acknowledged',
      characterSlug: 'piero',
      note: 'Holds the salt and a warehouse that unloads without the commune’s crane.',
    },
  ],
  labelGroups: [
    { id: 'g-faction', name: 'Factions', kind: 'faction' },
    { id: 'g-tag', name: 'Tags', kind: 'tag' },
  ],
  labels: [
    { id: 'fac-house-velatri', groupId: 'g-faction', name: 'House Velatri', hue: 38 },
    { id: 'fac-house-moro', groupId: 'g-faction', name: 'House Moro', hue: 48 },
    { id: 'fac-osoje', groupId: 'g-faction', name: 'Osoje', hue: 142 },
    { id: 'tag-loading-crane', groupId: 'g-tag', name: 'Loading crane' },
    { id: 'tag-harbour-chain', groupId: 'g-tag', name: 'Harbour chain' },
    { id: 'tag-albaran-letter', groupId: 'g-tag', name: 'Albaran letter' },
  ],
  factions: [
    { name: 'House Velatri', hue: 38 },
    { name: 'House Moro', hue: 48 },
    { name: 'Osoje', hue: 142 },
  ],
  outsiders: [
    {
      name: 'Matteo Rinaldi',
      note: 'From Albaran. Carries the seal and the letter.',
      labelIds: ['fac-house-velatri', 'tag-albaran-letter'],
    },
    {
      name: 'Luca Bandi',
      note: 'Consul for Vessara. Rents a house. Coin for rowers.',
      labelIds: ['fac-house-moro', 'tag-harbour-chain'],
    },
    {
      name: 'Anselm',
      note: 'Legate of Loryn. Older privilege to name the bishop.',
      labelIds: ['fac-house-velatri'],
    },
    {
      name: 'Duje Ravnjanin',
      note: 'Buys oil after dark for Ravna, across the bay.',
      labelIds: ['fac-house-moro'],
    },
  ],
  characters: [
    {
      slug: 'nerio',
      name: 'Nerio Calva',
      status: 'active',
      communityTie: 'Client of House Velatri. Keeps the cisterns and the loading crane in repair.',
      whoWeSee:
        'Mason. Lime on his sleeves. Eats at Velatri tables when they remember him. People come to him when the cisterns crack or the crane sticks.',
      player: { platform: 'local', displayName: 'Nerio', accountId: 'local-nerio' },
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
          title: 'Keep the cisterns and the loading crane sound until the count is elected',
          weight: 2,
          invokeWhen:
            'When the roll is about defending, repairing, or proving Aspalath still holds water and the loading crane.',
          groupLabel: 'Cistern-wardens',
          group: [
            { name: 'Nerio Calva', characterSlug: 'nerio' },
            { name: 'Agnese Orsani' },
            { name: 'Piero Moro' },
          ],
        },
        {
          title: 'Finish the crane seam before the oil is pressed',
          weight: 1,
          invokeWhen: 'When the work is masonry or the crane against weather.',
          resolved: {
            narrative:
              'The harbour-side seam held through the first hard rain. The crane no longer drips on the weights.',
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
      labelIds: ['tag-loading-crane', 'fac-house-velatri'],
    },
    {
      slug: 'stana',
      name: 'Stana Krstova',
      status: 'active',
      communityTie: 'Boat family of Aspalath. Holds the night watch on the harbour chain.',
      whoWeSee:
        'Commands the night watch on the harbour chain. Her sister’s children eat from her catch. She will not send rowers to Vessara.',
      player: {
        platform: 'discord',
        displayName: 'Stana',
        accountId: 'demo-discord-stana',
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
          title: 'Hold the harbour chain until the Council names a count',
          weight: 3,
          invokeWhen:
            'When the roll is about holding, contesting, or opening the harbour chain at Aspalath.',
        },
        {
          title: 'Keep the harbour watch paid and fed through vintage',
          weight: 2,
          invokeWhen:
            'When the roll is about the harbour watch’s loyalty, pay, food, or desertion.',
          groupLabel: 'Harbour watch',
          group: [
            { name: 'Stana Krstova', characterSlug: 'stana' },
            { name: 'Vuk Osojanin' },
            { name: 'Jakov' },
            { name: 'Brane' },
          ],
        },
        {
          title: 'Feed her sister’s children through the thin olive year',
          weight: 1,
          invokeWhen:
            'When the roll is about shelter, food, or safety for her sister’s children in the harbour lanes.',
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
      labelIds: ['tag-harbour-chain'],
    },
    fixtureNpc({
      slug: 'agnese',
      name: 'Agnese Orsani',
      whoWeSee: 'Orsani widow. Keeps the account of what the commune still owes the last galley’s widows.',
      communityTie: 'House Orsani by marriage. The widows come to her before they come to the count.',
      hierarchy: [
        { axis: 'Coin', tier: 'Trusted' },
        { axis: 'Blood', tier: 'Acknowledged' },
      ],
    }),
    fixtureNpc({
      slug: 'lovro',
      name: 'Canon Lovro',
      whoWeSee: 'Serves in the cathedral, in Latin. Boat families bury in their own tongue.',
      hierarchy: [{ axis: 'Faith', tier: 'Honoured' }],
    }),
    fixtureNpc({
      slug: 'vuk',
      name: 'Vuk Osojanin',
      whoWeSee: 'Shepherd from Osoje. Kin to Stana. Not a burgher.',
      hierarchy: [{ axis: 'Arms', tier: 'Trusted' }],
      labelIds: ['tag-harbour-chain', 'fac-osoje'],
    }),
    fixtureNpc({
      slug: 'orsa',
      name: 'Orsa Velatri',
      whoWeSee: 'Sister of the dead count. She wants the Council to elect his son, who is twelve.',
      hierarchy: [{ axis: 'Blood', tier: 'Trusted' }],
      labelIds: ['fac-house-velatri'],
    }),
    fixtureNpc({
      slug: 'piero',
      name: 'Piero Moro',
      whoWeSee: 'Holds the salt and a warehouse that unloads without the commune’s crane.',
      hierarchy: [{ axis: 'Coin', tier: 'Acknowledged' }],
      labelIds: ['fac-house-moro'],
    }),
  ],
};
