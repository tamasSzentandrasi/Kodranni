import { randomUUID } from 'node:crypto';
import type { CharacterRecord, CommunityRecord } from './types.js';
import type { CommunityStorePort } from './port.js';
import { emptyCommunity } from './sqlite.js';
import { refreshCharacterDerived } from './derived.js';
import { makeEcho } from './echo-effects.js';
import { upsertFactionLabel, upsertTagLabel } from './labels.js';

/** Demo identity: Guidebook seed “Aspalath, after the count was stabbed”. */
export const DEMO_SEED_ID = 'aspalath-after-the-count';
export const DEMO_SLUG = 'aspalath';
export const DEMO_NAME = 'Aspalath';

export function demoCharactersPresent(store: CommunityStorePort): boolean {
  return Boolean(store.getCharacterBySlug('nerio') && store.getCharacterBySlug('stana'));
}

/** Nerio Calva — mason, Velatri client; cisterns and the commune’s loading crane. */
export function demoNerio(): CharacterRecord {
  const ch: CharacterRecord = {
    id: randomUUID(),
    slug: 'nerio',
    name: 'Nerio Calva',
    kind: 'pc',
    status: 'active',
    communityTie:
      'Client of House Velatri. Keeps the cisterns and the loading crane in repair.',
    whoWeSee:
      'Mason. Lime on his sleeves. Eats at Velatri tables when they remember him. People come to him when the cisterns crack or the crane sticks.',
    player: {
      platform: 'local',
      displayName: 'Nerio',
      accountId: 'local-nerio',
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
        title: 'Keep the cisterns and the loading crane sound until the count is elected',
        weight: 2,
        invokeWhen:
          'When the roll is about defending, repairing, or proving Aspalath still holds water and the loading crane.',
        note: 'Patched after last winter’s crack. The Council drinks from these cisterns. House Moro unloads without the crane.',
        groupLabel: 'Cistern-wardens',
        group: [
          { name: 'Nerio Calva', characterSlug: 'nerio' },
          { name: 'Agnese Orsani', note: 'Keeps the account of what the commune owes the last galley’s widows.' },
          { name: 'Piero Moro', note: 'Salt and warehouse; unloads without the commune’s crane.' },
        ],
      }),
      makeEcho({
        title: 'Finish the crane seam before the oil is pressed',
        weight: 1,
        invokeWhen:
          'When the work is masonry, timber, or finishing a seam against weather — and the table agrees the election is the pressure.',
        note: 'The harbour-side seam still weeps.',
        resolved: {
          narrative:
            'The harbour-side seam held through the first hard rain. The crane no longer drips on the weights. People say Nerio’s name when they talk about the crane.',
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
        { name: 'Adze', note: 'Stone and timber work; edge needs re-peening after the cistern lip.' },
        { name: 'Wool cloak', note: 'Dry; no spare for a second person.' },
        { name: 'Pitch pot', note: 'Half-full; enough for one more seam on the crane.' },
      ],
    },
    flags: { decadence: false, overCapacity: false },
  };
  return refreshCharacterDerived(ch);
}

/** Stana Krstova — boat family; night watch on the harbour chain. */
export function demoStana(): CharacterRecord {
  const ch: CharacterRecord = {
    id: randomUUID(),
    slug: 'stana',
    name: 'Stana Krstova',
    kind: 'pc',
    status: 'active',
    communityTie:
      'Boat family of Aspalath. Holds the night watch on the harbour chain. Her sister’s children eat from her catch.',
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
      // Wayfarer edge for harbour work
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
    traits: [{ name: 'Scarred knuckles', note: 'From the last galley, not from sport.' }],
    exertion: { current: 5, max: 0 },
    echoes: [
      makeEcho({
        title: 'Hold the harbour chain until the Council names a count',
        weight: 3,
        invokeWhen:
          'When the roll is about holding, contesting, or opening the harbour chain at Aspalath — defence, rowers, Vessara, or Ravna taking the cargo.',
        note: 'Lose the chain and ships land where they please.',
      }),
      makeEcho({
        title: 'Keep the harbour watch paid and fed through vintage',
        weight: 2,
        invokeWhen:
          'When the roll is about the harbour watch’s loyalty, pay, food, desertion, or keeping Vuk’s line from walking back to Osoje.',
        groupLabel: 'Harbour watch',
        group: [
          { name: 'Stana Krstova', characterSlug: 'stana' },
          { name: 'Vuk Osojanin', note: 'Kin from Osoje; unpaid enough to take his flocks elsewhere.' },
          { name: 'Jakov', note: 'Young spear on the night shift; watches for Vessaran hulls.' },
          { name: 'Brane', note: 'Last-galley veteran; drinks the pay first.' },
        ],
      }),
      makeEcho({
        title: 'Feed her sister’s children through the thin olive year',
        weight: 1,
        invokeWhen:
          'When the roll is about shelter, food, or safety for her sister’s children in the harbour lanes — not abstract survival for the Council alone.',
        note: 'The catch has to feed more than a closed Council.',
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

/** @deprecated use demoNerio */
export const demoTorvald = demoNerio;
/** @deprecated use demoStana */
export const demoLeifr = demoStana;
/** @deprecated use demoNerio */
export const demoTomas = demoNerio;
/** @deprecated use demoNerio */
export const demoEira = demoNerio;
/** @deprecated use demoStana */
export const demoLeif = demoStana;
export const demoCapacityProfile = (name = 'Stana Krstova') => {
  const ch = demoStana();
  if (name !== 'Stana Krstova' && name !== 'Leva of the Chain' && name !== 'Leifr Ketilsson' && name !== 'Leif') {
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
    cohesion: 1,
    surplus: 2,
    standing: 2,
    tradition: 2,
  };
  community.fortunesFoundedAt = '2026-08-01T12:00:00.000Z';
  community.myths = [
    {
      title: 'The Count on the Steps',
      summary:
        'Rade Velatri was stabbed on the cathedral steps at vintage. The election is this moon. The stone still holds the blood.',
      effects: [
        {
          kind: 'advantage',
          label: 'Advantage when proving who may name a count',
          detail: 'When Myth is tagged and the scene is about the election, the letter, or the steps.',
        },
        {
          kind: 'tide_mod',
          label: 'Tide start +1 holding the marketplace during the naming',
          detail: 'When a Tide is opened to hold the marketplace, the Council, or the cathedral steps.',
        },
      ],
    },
    {
      title: 'Moro’s Warehouse',
      summary:
        'The commune’s loading crane is how the Council takes its due on cargo. House Moro unloads from its own warehouse without it. Both feed Aspalath. Albaran and Vessara have a hand in both.',
      effects: [
        {
          kind: 'disadvantage',
          label: 'Disadvantage if the crane is forced in the scene',
          detail: 'When Myth is tagged and the table rules the crane or Moro’s warehouse is at stake.',
        },
        {
          kind: 'omen_faces',
          label: 'Omen 4 = Vessaran hulls',
          faces: [4],
        },
      ],
    },
  ];
  const nerio = demoNerio();
  const stana = demoStana();
  const agnese = demoHallNpc({
    slug: 'agnese',
    name: 'Agnese Orsani',
    whoWeSee:
      'Orsani widow. Keeps the account of what the commune still owes the widows of the last galley.',
    communityTie: 'House Orsani by marriage. The widows come to her before they come to the count.',
    hierarchy: [
      { axis: 'Coin', tier: 'Trusted' },
      { axis: 'Blood', tier: 'Acknowledged' },
    ],
  });
  const lovro = demoHallNpc({
    slug: 'lovro',
    name: 'Canon Lovro',
    whoWeSee:
      'Serves in the cathedral, in Latin. Boat families bury in their own tongue. He will refuse a burial if the chapter is crossed.',
    hierarchy: [{ axis: 'Faith', tier: 'Honoured' }],
  });
  const vuk = demoHallNpc({
    slug: 'vuk',
    name: 'Vuk Osojanin',
    whoWeSee:
      'Shepherd from Osoje above the town. Brings cheese. Not a burgher. Kin to Stana. Will take his flocks elsewhere if the Velatri elect the boy and forget the hills.',
    hierarchy: [{ axis: 'Arms', tier: 'Trusted' }],
  });
  const orsa = demoHallNpc({
    slug: 'orsa',
    name: 'Orsa Velatri',
    whoWeSee:
      'Sister of the dead count. She wants the Council to elect his son, who is twelve, so the house keeps the countship.',
    hierarchy: [{ axis: 'Blood', tier: 'Trusted' }],
  });
  const piero = demoHallNpc({
    slug: 'piero',
    name: 'Piero Moro',
    whoWeSee:
      'Holds the salt pans and a warehouse that unloads without the commune’s crane. Will put men in the marketplace if the Council will not let his house vote.',
    hierarchy: [{ axis: 'Coin', tier: 'Acknowledged' }],
  });
  const npcs = [agnese, lovro, vuk, orsa, piero];
  community.placements = [
    {
      name: nerio.name,
      axis: 'Coin',
      tier: 'Acknowledged',
      characterSlug: nerio.slug,
      note: nerio.whoWeSee,
    },
    {
      name: stana.name,
      axis: 'Arms',
      tier: 'Acknowledged',
      characterSlug: stana.slug,
      note: stana.whoWeSee,
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
  const velatri = upsertFactionLabel(community, 'House Velatri', 38);
  const moro = upsertFactionLabel(community, 'House Moro', 48);
  const osoje = upsertFactionLabel(community, 'Osoje', 142);
  const crane = upsertTagLabel(community, 'Loading crane');
  const chain = upsertTagLabel(community, 'Harbour chain');
  const letter = upsertTagLabel(community, 'Albaran letter');
  community.outsiders = [
    {
      name: 'Matteo Rinaldi',
      note: 'From Albaran. Carries the seal and the letter. The inland crown wants a say in who is count.',
      labelIds: [velatri.id, letter.id],
    },
    {
      name: 'Luca Bandi',
      note: 'Consul for Vessara. Rents a house. Coin for rowers. Ships a night’s sail off.',
      labelIds: [moro.id, chain.id],
    },
    {
      name: 'Anselm',
      note: 'Legate of Loryn. Older privilege to name the bishop.',
      labelIds: [velatri.id],
    },
    {
      name: 'Duje Ravnjanin',
      note: 'Buys oil after dark for Ravna, the harbour across the bay.',
      labelIds: [moro.id],
    },
  ];
  nerio.labelIds = [crane.id, velatri.id];
  stana.labelIds = [chain.id];
  vuk.labelIds = [chain.id, osoje.id];
  orsa.labelIds = [velatri.id];
  piero.labelIds = [moro.id];
  community.ruler = null;

  store.putCommunity(community);
  store.putCharacter(nerio);
  store.putCharacter(stana);
  for (const npc of npcs) store.putCharacter(npc);
  store.appendEvent({
    type: 'CampaignSeeded',
    payload: { slug, seed: DEMO_SEED_ID },
  });
  return { community, character: nerio };
}
