import { randomUUID } from 'node:crypto';
import type { CharacterRecord, CommunityRecord } from './types.js';
import type { CommunityStorePort } from './port.js';
import { emptyCommunity } from './sqlite.js';
import { refreshCharacterDerived } from './derived.js';
import { makeEcho } from './echo-effects.js';

/** Demo identity: Guidebook seed “The Vardmark at Kelarn’s Bend”. */
export const DEMO_SEED_ID = 'vardmark-kelarns-bend';
export const DEMO_SLUG = 'vardmark';
export const DEMO_NAME = 'The Vardmark at Kelarn’s Bend';

/** Torvald Adzeson — carpenter who holds the seized grain store. */
export function demoTorvald(): CharacterRecord {
  const ch: CharacterRecord = {
    id: randomUUID(),
    slug: 'torvald',
    name: 'Torvald Adzeson',
    kind: 'pc',
    status: 'active',
    communityTie:
      'Vardmark of Kelarn’s Bend — took the ground in the fall of Kelarn; holds the shared grain store the warband still uses as spoils and ration.',
    whoWeSee:
      'A quiet man who measures twice — timber, grain, and what is still owed after a taking.',
    player: {
      platform: 'local',
      displayName: 'Torvald',
      accountId: 'local-torvald',
    },
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
    foundationsEffective: {},
    skills: [
      // Artisan core
      {
        name: 'Carpentry & Masonry',
        rating: 2,
        practice: 28,
        threshold: 48,
        foundation: 'Strength',
      },
      {
        name: 'Handcrafting',
        rating: 1,
        practice: 14,
        threshold: 24,
        foundation: 'Dexterity',
      },
      {
        name: 'Tinkering & Repair',
        rating: 1,
        practice: 9,
        threshold: 24,
        foundation: 'Constitution',
      },
      {
        name: 'Appraisal',
        rating: 1,
        practice: 4,
        threshold: 24,
        foundation: 'Perception',
      },
      {
        name: 'Engineering & Design',
        rating: 1,
        practice: 2,
        threshold: 24,
        foundation: 'Intellect',
      },
      {
        name: 'Smithing & Forging',
        rating: 1,
        practice: 7,
        threshold: 24,
        foundation: 'Strength',
      },
      // Sage / social
      {
        name: 'Negotiation',
        rating: 1,
        practice: 16,
        threshold: 24,
        foundation: 'Authority',
      },
      {
        name: 'Arithmetic & Accounting',
        rating: 1,
        practice: 11,
        threshold: 24,
        foundation: 'Intellect',
      },
      // Wayfarer scrap
      {
        name: 'Tradecraft',
        rating: 1,
        practice: 5,
        threshold: 24,
        foundation: 'Charisma',
      },
    ],
    traits: [
      { name: 'Steady hands', note: 'Fine work under haste does not shake him easily.' },
    ],
    exertion: { current: 4, max: 0 },
    echoes: [
      makeEcho({
        title: 'Keep the seized grain store standing through the first winter',
        weight: 2,
        invokeWhen:
          'When the roll is about defending, repairing, rationing, or proving the warband still holds the grain store at Kelarn’s Bend.',
        note: 'Patched after the taking — still the proof the Bend is theirs to keep or lose.',
        groupLabel: 'Store-wardens',
        group: [
          { name: 'Torvald Adzeson', characterSlug: 'torvald' },
          { name: 'Halla Ketilsdottir', note: 'Keeps the mill ledger; counts what leaves the store.' },
          { name: 'Gorm Audunsson', note: 'Spoils-counter; loyalty follows the key.' },
        ],
      }),
      makeEcho({
        title: 'Raise a sound roof over the hall before the freeze locks the ford',
        weight: 1,
        invokeWhen:
          'When the work is carpentry, timber, or finishing the hall roof against weather — and the table agrees winter is the pressure.',
        note: 'Personal craft pride; the hall still leaks on the river side.',
        resolved: {
          narrative:
            'The river-side seam held through the first hard frost. The hall no longer drips on the high bench — Torvald’s name is spoken when the roof is praised.',
          at: '2025-11-02',
        },
      }),
    ],
    echoCapacity: 0,
    echoWeight: 0,
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
    inventory: {
      foodDays: 2,
      waterDays: 3,
      items: [
        { name: 'Adze', note: 'Taken timber work; edge needs re-peening after the store roof.' },
        { name: 'Wool cloak', note: 'Dry; no spare for a second person.' },
        { name: 'Pitch pot', note: 'Half-full; enough for one more seam on the seized store.' },
      ],
    },
    flags: { decadence: false, overCapacity: false },
  };
  return refreshCharacterDerived(ch);
}

/** Leifr Ketilsson — Guidebook capacity profile at the ford. */
export function demoLeifr(): CharacterRecord {
  const ch: CharacterRecord = {
    id: randomUUID(),
    slug: 'leifr',
    name: 'Leifr Ketilsson',
    kind: 'pc',
    status: 'active',
    communityTie:
      'Took part in the burning and the taking of Kelarn’s Bend; claims the upper fields still black from last year’s fire.',
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
    foundationsEffective: {},
    skills: [
      // Warrior core
      {
        name: 'Command',
        rating: 2,
        practice: 18,
        threshold: 48,
        foundation: 'Authority',
      },
      {
        name: 'Tactics',
        rating: 1,
        practice: 19,
        threshold: 24,
        foundation: 'Intellect',
      },
      {
        name: 'Intimidate',
        rating: 1,
        practice: 12,
        threshold: 24,
        foundation: 'Authority',
      },
      {
        name: 'Slash',
        rating: 1,
        practice: 8,
        threshold: 24,
        foundation: 'Strength',
      },
      {
        name: 'Pierce',
        rating: 1,
        practice: 6,
        threshold: 24,
        foundation: 'Dexterity',
      },
      {
        name: 'Deflection',
        rating: 1,
        practice: 15,
        threshold: 24,
        foundation: 'Resolve',
      },
      {
        name: 'Combat Awareness',
        rating: 1,
        practice: 10,
        threshold: 24,
        foundation: 'Perception',
      },
      {
        name: 'Footwork',
        rating: 1,
        practice: 4,
        threshold: 24,
        foundation: 'Dexterity',
      },
      // Wayfarer edge for ford work
      {
        name: 'Scouting',
        rating: 1,
        practice: 7,
        threshold: 24,
        foundation: 'Perception',
      },
      {
        name: 'Swimming',
        rating: 1,
        practice: 3,
        threshold: 24,
        foundation: 'Constitution',
      },
      // Sage scrap
      {
        name: 'Strategy',
        rating: 1,
        practice: 5,
        threshold: 24,
        foundation: 'Intellect',
      },
    ],
    traits: [{ name: 'Scarred knuckles', note: 'From the taking of the shore — not from sport.' }],
    exertion: { current: 5, max: 0 },
    echoes: [
      makeEcho({
        title: 'Hold Kelarn’s Bend ford until the hostages return',
        weight: 3,
        invokeWhen:
          'When the roll is about holding, contesting, or barging the ford at Kelarn’s Bend — defence, crossing, hostages, or rivals who mean to take it.',
        note: 'The ford is the claim; lose it and the Bend is only ash and talk.',
      }),
      makeEcho({
        title: 'Keep the ford watch paid and fed through the freeze',
        weight: 2,
        invokeWhen:
          'When the roll is about the ford watch’s loyalty, pay, food, desertion, or keeping Sten’s line from walking off in the cold.',
        groupLabel: 'Ford watch',
        group: [
          { name: 'Leifr Ketilsson', characterSlug: 'leifr' },
          { name: 'Sten Vebjornsson', note: 'Eager; unpaid enough to leave if the freeze bites hard.' },
          { name: 'Ase River-step', note: 'Young spear on the night shift; fears the marsh channels.' },
          { name: 'Bjorn One-ear', note: 'Veteran of the taking; drinks the pay first.' },
        ],
      }),
      makeEcho({
        title: 'Bring his sister’s children through the first winter on seized ground',
        weight: 1,
        invokeWhen:
          'When the roll is about shelter, food, or safety for his sister’s children on occupied ground — not abstract “winter survival” for the warband alone.',
        note: 'Personal stake: the occupation must feed more than pride.',
      }),
    ],
    echoCapacity: 0,
    echoWeight: 0,
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
    hierarchy: [{ axis: 'Arms', tier: 'Acknowledged' }],
    armour: { kind: 'light', donned: true },
    inventory: {
      foodDays: 1,
      waterDays: 2,
      items: [
        { name: 'Spear', note: 'Ash shaft; head loose if used as a pry-bar.' },
        { name: 'Shield', note: 'Rim split on one quarter; still holds a line.' },
      ],
    },
    flags: { decadence: false, overCapacity: false },
  };
  return refreshCharacterDerived(ch);
}

const NPC_HARM: Record<string, number> = {
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

/** Living hall NPC — weighed enough to appear as a sheet, not a placeholder. */
function demoHallNpc(opts: {
  slug: string;
  name: string;
  whoWeSee: string;
  communityTie?: string;
  hierarchy: { axis: string; tier: string }[];
}): CharacterRecord {
  const ch: CharacterRecord = {
    id: randomUUID(),
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
      claimable: false,
      placeholder: false,
    },
    foundations: {
      Strength: 1,
      Dexterity: 1,
      Constitution: 1,
      Intellect: 1,
      Perception: 1,
      Resolve: 1,
      Charisma: 1,
      Guile: 1,
      Authority: 1,
    },
    foundationsEffective: {},
    skills: [],
    traits: [],
    exertion: { current: 0, max: 0 },
    echoes: [],
    echoCapacity: 0,
    echoWeight: 0,
    harm: { ...NPC_HARM },
    dying: false,
    hierarchy: opts.hierarchy,
    armour: { kind: 'none', donned: false },
    inventory: { foodDays: 0, waterDays: 0, items: [] },
    flags: { decadence: true, overCapacity: false },
  };
  return refreshCharacterDerived(ch);
}

/** @deprecated use demoTorvald */
export const demoTomas = demoTorvald;
/** @deprecated use demoLeifr */
export const demoEira = demoTorvald;
/** @deprecated use demoLeifr */
export const demoLeif = demoLeifr;
export const demoCapacityProfile = (name = 'Leifr Ketilsson') => {
  const ch = demoLeifr();
  if (name !== 'Leifr Ketilsson' && name !== 'Leif') {
    ch.name = name;
    ch.slug = name.toLowerCase().replace(/\s+/g, '-');
  }
  return ch;
};

export function seedDemoCampaign(
  store: CommunityStorePort,
  slug = DEMO_SLUG,
  name = DEMO_NAME,
): { community: CommunityRecord; character: CharacterRecord } {
  const community = emptyCommunity(slug, name);
  community.fortunes = {
    vitality: 1,
    cohesion: 2,
    surplus: 1,
    standing: 1,
    tradition: 2,
  };
  community.fortunesFoundedAt = '2026-08-01T12:00:00.000Z';
  community.myths = [
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
          detail: 'When a Tide is opened to hold the ford at Kelarn’s Bend against rivals or survivors.',
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
          detail: 'When Myth is tagged and the table rules the Compact is at stake.',
        },
        {
          kind: 'omen_faces',
          label: 'Omen 4 = marsh messenger',
          faces: [4],
        },
      ],
    },
  ];
  const torvald = demoTorvald();
  const leifr = demoLeifr();
  const halla = demoHallNpc({
    slug: 'halla',
    name: 'Halla Ketilsdottir',
    whoWeSee: 'Keeps the mill ledger after the taking; quiet power over grain counts.',
    communityTie: 'Widow of a Bend man — still claims kin-right in the hall.',
    hierarchy: [
      { axis: 'Coin', tier: 'Trusted' },
      { axis: 'Blood', tier: 'Acknowledged' },
    ],
  });
  const rurik = demoHallNpc({
    slug: 'rurik',
    name: 'Rurik Hrafnsson',
    whoWeSee: 'Speaks for the dead of the Bend and the living oaths of the Vardmark.',
    hierarchy: [{ axis: 'Faith', tier: 'Honoured' }],
  });
  const sten = demoHallNpc({
    slug: 'sten',
    name: 'Sten Vebjornsson',
    whoWeSee: 'Leifr’s ford watch; eager, unpaid enough to leave if the freeze bites hard.',
    hierarchy: [{ axis: 'Arms', tier: 'Trusted' }],
  });
  const bera = demoHallNpc({
    slug: 'bera',
    name: 'Bera Unfree',
    whoWeSee: 'Survived the taking; kept as labour on the fields. Watches the river more than the hall.',
    hierarchy: [{ axis: 'Blood', tier: 'Outcast' }],
  });
  const gorm = demoHallNpc({
    slug: 'gorm',
    name: 'Gorm Audunsson',
    whoWeSee: 'Counts spoils for whoever holds the store tonight; loyalty follows the key.',
    hierarchy: [{ axis: 'Coin', tier: 'Outcast' }],
  });
  const npcs = [halla, rurik, sten, bera, gorm];
  community.placements = [
    {
      name: torvald.name,
      axis: 'Coin',
      tier: 'Acknowledged',
      characterSlug: torvald.slug,
      note: torvald.whoWeSee,
    },
    {
      name: leifr.name,
      axis: 'Arms',
      tier: 'Acknowledged',
      characterSlug: leifr.slug,
      note: leifr.whoWeSee,
    },
    ...npcs.flatMap((ch) =>
      ch.hierarchy.map((h) => ({
        name: ch.name,
        axis: h.axis,
        tier: h.tier,
        characterSlug: ch.slug,
        note: ch.whoWeSee,
      })),
    ),
  ];
  community.outsiders = [
    {
      name: 'Mara of the Reeds',
      faction: 'Reed-marsh folk',
      note: 'Speaks for grain and silence; will not bleed free for foreign occupiers at the Bend.',
    },
    {
      name: 'Jorun of the Channels',
      faction: 'Reed-marsh folk',
      note: 'Scout of the channels; knows every path that can starve or feed the ford.',
    },
    {
      name: 'Skard Ketilsson',
      faction: 'Rival war-band',
      note: 'Same campaign of conquest; means to stake the next ford before the Vardmark hardens theirs.',
    },
    {
      name: 'Inga Skardsdottir',
      faction: 'Rival war-band',
      note: 'Herald and bargainer for the rival band — offers terms that never quite favour the Vardmark.',
    },
  ];
  community.ruler = null;

  store.putCommunity(community);
  store.putCharacter(torvald);
  store.putCharacter(leifr);
  for (const npc of npcs) store.putCharacter(npc);
  store.appendEvent({
    type: 'CampaignSeeded',
    payload: { slug, seed: DEMO_SEED_ID },
  });
  return { community, character: torvald };
}
