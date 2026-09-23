import { randomUUID } from 'node:crypto';
import type { CharacterRecord, CommunityRecord, SkillProgress } from './types.js';
import type { CommunityStorePort } from './port.js';
import { emptyCommunity } from './sqlite.js';
import { refreshCharacterDerived } from './derived.js';
import { makeEcho } from './echo-effects.js';
import { TAG_GROUP_ID, upsertFactionLabel, upsertLabelGroup, upsertTagLabel } from './labels.js';

/** Demo identity: Guidebook seed “Aspalath, after the night the knife missed”. */
export const DEMO_SEED_ID = 'aspalath-after-the-night';
export const DEMO_SLUG = 'aspalath';
export const DEMO_NAME = 'Aspalath';

export function demoCharactersPresent(store: CommunityStorePort): boolean {
  return Boolean(
    store.getCharacterBySlug('tomaso') &&
      store.getCharacterBySlug('jakov') &&
      store.getCharacterBySlug('caterina') &&
      store.getCharacterBySlug('niccolo'),
  );
}

function foundations(p: Partial<Record<string, number>>): Record<string, number> {
  return {
    Strength: 1,
    Dexterity: 1,
    Constitution: 1,
    Intellect: 1,
    Perception: 1,
    Resolve: 1,
    Charisma: 1,
    Guile: 1,
    Authority: 1,
    ...p,
  };
}

function it(name: string, note: string, icon: string): { name: string; note: string; icon: string } {
  return { name, note, icon: `/demo-items/${icon}.png` };
}

function sk(name: string, rating: number, foundation: string, practice = 8): SkillProgress {
  return {
    name,
    rating,
    practice,
    threshold: rating >= 3 ? 72 : rating === 2 ? 48 : 24,
    foundation,
  };
}

const HARM0: Record<string, number> = {
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

interface LivingOpts {
  slug: string;
  name: string;
  kind: 'pc' | 'npc';
  communityTie: string;
  concept: string;
  whoWeSee: string;
  player?: CharacterRecord['player'];
  foundations: Record<string, number>;
  skills: SkillProgress[];
  traits: { name: string; note?: string }[];
  echoes: CharacterRecord['echoes'];
  hierarchy: { axis: string; tier: string }[];
  armour?: CharacterRecord['armour'];
  inventory: CharacterRecord['inventory'];
  harm?: Partial<Record<string, number>>;
  exertionCurrent?: number;
}

function living(opts: LivingOpts): CharacterRecord {
  const ch: CharacterRecord = {
    id: randomUUID(),
    slug: opts.slug,
    name: opts.name,
    kind: opts.kind,
    status: 'active',
    communityTie: opts.communityTie,
    concept: opts.concept,
    whoWeSee: opts.whoWeSee,
    player: opts.player,
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
    foundations: opts.foundations,
    foundationsEffective: {},
    skills: opts.skills,
    traits: opts.traits,
    exertion: { current: opts.exertionCurrent ?? 0, max: 0 },
    echoes: opts.echoes,
    echoCapacity: 0,
    echoWeight: 0,
    harm: { ...HARM0, ...opts.harm },
    dying: false,
    hierarchy: opts.hierarchy,
    armour: opts.armour ?? { kind: 'none', donned: false },
    inventory: opts.inventory,
    flags: { decadence: false, overCapacity: false },
  };
  return refreshCharacterDerived(ch);
}

/** Tomaso Fero — millwright. Lazzaro pulled him off a Pelesan bench. */
export function demoTomaso(): CharacterRecord {
  return living({
    slug: 'tomaso',
    name: 'Tomaso Fero',
    kind: 'pc',
    communityTie: 'Lazzaro took me off a galley and put me in the mill.',
    concept:
      'I want the mill finished before they shut it. I owe Orsa for my mother’s burial. I am afraid Vito’s men will take me at night like the others.',
    whoWeSee:
      'I’m Tomaso. I keep the mill Lazzaro put me in after he took me off a galley. He’s dead. They want the mill shut. I still sleep there.',
    player: { platform: 'local', displayName: 'Tomaso', accountId: 'local-tomaso' },
    foundations: foundations({
      Strength: 2,
      Dexterity: 2,
      Constitution: 2,
      Intellect: 3,
      Perception: 2,
      Resolve: 2,
      Charisma: 1,
      Guile: 2,
      Authority: 1,
    }),
    skills: [
      sk('Engineering & Design', 2, 'Intellect', 22),
      sk('Carpentry & Masonry', 2, 'Strength', 18),
      sk('Tinkering & Repair', 2, 'Constitution', 16),
      sk('Smithing & Forging', 1, 'Strength', 11),
      sk('Handcrafting', 1, 'Dexterity', 9),
      sk('Appraisal', 1, 'Perception', 7),
      sk('Oversight', 1, 'Authority', 6),
      sk('Illustration', 1, 'Intellect', 10),
      sk('Arithmetic & Accounting', 1, 'Intellect', 8),
      sk('Negotiation', 1, 'Authority', 5),
      sk('Streetwise', 1, 'Guile', 12),
      sk('Climbing', 1, 'Strength', 4),
      sk('Sailing & Navigation', 1, 'Perception', 3),
      sk('Insight', 1, 'Perception', 6),
    ],
    traits: [
      { name: 'Galley-stiff ankle', note: 'Cannot run far.' },
      { name: 'Reads a plan', note: 'Can follow a drawn machine.' },
    ],
    echoes: [
      makeEcho({
        title: 'Finish the mill',
        weight: 2,
        invokeWhen: 'When the roll is the mill, the engine, or men boarding that door.',
        groupLabel: 'The mill',
        group: [
          { name: 'Tomaso Fero', characterSlug: 'tomaso' },
          { name: 'Orsa Solari', characterSlug: 'orsa' },
          { name: 'Vito Cresti', characterSlug: 'vito' },
        ],
      }),
      makeEcho({
        title: 'The mill seam held last winter',
        weight: 1,
        invokeWhen: 'When the work is timber or weather on that mill.',
        resolved: {
          narrative: 'The harbour-side seam held through the first hard rain.',
          at: '2025-11-02',
        },
      }),
    ],
    hierarchy: [
      { axis: 'Coin', tier: 'Acknowledged' },
      { axis: 'Arms', tier: 'Outcast' },
    ],
    exertionCurrent: 4,
    inventory: {
      foodDays: 2,
      waterDays: 3,
      items: [
        it('Adze', 'Edge dull.', 'adze'),
        it('Screw-jack', 'For the mill lift.', 'screw-jack'),
      ],
    },
  });
}

/** Jakov Bracco — Free Company. Lazzaro stood godfather to his daughter. */
export function demoJakov(): CharacterRecord {
  return living({
    slug: 'jakov',
    name: 'Jakov Bracco',
    kind: 'pc',
    communityTie: 'My daughter sleeps in the company’s house. Lazzaro stood her godfather.',
    concept:
      'We have not been paid. Some captains will sell to Pelesa or Calvaro. My brother was on the gate the night of the knife and has not come back. I have not sold.',
    whoWeSee:
      'I’m Jakov. I sleep in the company’s house with my daughter. Lazzaro stood her godfather. We have not been paid. Some of us will sell. I have not.',
    player: { platform: 'discord', displayName: 'Jakov', accountId: 'demo-discord-jakov' },
    foundations: foundations({
      Strength: 3,
      Dexterity: 2,
      Constitution: 2,
      Intellect: 2,
      Perception: 2,
      Resolve: 2,
      Charisma: 1,
      Guile: 2,
      Authority: 2,
    }),
    skills: [
      sk('Slash', 2, 'Strength', 20),
      sk('Pierce', 1, 'Dexterity', 9),
      sk('Intimidate', 2, 'Authority', 14),
      sk('Command', 1, 'Authority', 11),
      sk('Tactics', 1, 'Intellect', 10),
      sk('Combat Awareness', 1, 'Perception', 8),
      sk('Footwork', 1, 'Dexterity', 7),
      sk('Deflection', 1, 'Resolve', 6),
      sk('Riding', 1, 'Authority', 5),
      sk('Ambush & Camouflage', 1, 'Guile', 8),
      sk('Streetwise', 1, 'Guile', 12),
      sk('Sneak', 1, 'Dexterity', 4),
      sk('Negotiation', 1, 'Authority', 7),
      sk('Healing', 1, 'Resolve', 5),
      sk('Tradecraft', 1, 'Charisma', 3),
      sk('Sailing & Navigation', 1, 'Perception', 2),
    ],
    traits: [
      { name: 'Godfather’s ring', note: 'Lazzaro’s. Mira knows it.' },
    ],
    echoes: [
      makeEcho({
        title: 'Keep Mira housed',
        weight: 2,
        invokeWhen: 'When the roll is the Charter house, Mira, or Company pay.',
        groupLabel: 'Charter house',
        group: [
          { name: 'Jakov Bracco', characterSlug: 'jakov' },
          { name: 'Mira Bracco', note: 'Seven.' },
        ],
      }),
      makeEcho({
        title: 'Find my brother',
        weight: 1,
        invokeWhen: 'When the roll is the missing Company man or the hill gate that night.',
      }),
      makeEcho({
        title: 'Hold the Company unpaid',
        weight: 2,
        invokeWhen: 'When the roll is Company loyalty, Luca’s pay, or Matteo’s pay.',
        groupLabel: 'Unpaid company',
        group: [
          { name: 'Jakov Bracco', characterSlug: 'jakov' },
          { name: 'Lazzaro', note: 'Godfather. Unpaid captain.' },
        ],
      }),
    ],
    hierarchy: [{ axis: 'Arms', tier: 'Acknowledged' }],
    armour: { kind: 'light', donned: true },
    exertionCurrent: 5,
    inventory: {
      foodDays: 1,
      waterDays: 2,
      items: [
        it('Sword', 'Company issue. Edge notched.', 'sword'),
        it('Shield', 'Rim split.', 'shield'),
      ],
    },
  });
}

/** Caterina Vela — Isotta’s maid; mother; hears every house. */
export function demoCaterina(): CharacterRecord {
  return living({
    slug: 'caterina',
    name: 'Caterina Vela',
    kind: 'pc',
    communityTie: 'I dressed Duchess Isotta for twelve years. My children sleep at my aunt’s.',
    concept:
      'Vito’s men have our street on a list. I gave Orsa three names from the inner stair. I have heard more than I have said. I am afraid they will take my children next.',
    whoWeSee:
      'I’m Caterina. I dressed the duchess for twelve years. My children sleep at my aunt’s. Vito’s men have that street on a list. I still walk the palace.',
    player: { platform: 'local', displayName: 'Caterina', accountId: 'local-caterina' },
    foundations: foundations({
      Strength: 1,
      Dexterity: 2,
      Constitution: 2,
      Intellect: 2,
      Perception: 3,
      Resolve: 2,
      Charisma: 2,
      Guile: 3,
      Authority: 1,
    }),
    skills: [
      sk('Etiquette', 2, 'Resolve', 18),
      sk('Empathy', 2, 'Charisma', 16),
      sk('Childcare', 1, 'Resolve', 12),
      sk('Cooking & Preserving', 1, 'Resolve', 8),
      sk('Influence', 1, 'Authority', 10),
      sk('Insight', 2, 'Perception', 20),
      sk('Investigation', 1, 'Perception', 11),
      sk('Streetwise', 2, 'Guile', 17),
      sk('Sneak', 1, 'Dexterity', 9),
      sk('Deception', 1, 'Guile', 14),
      sk('Slander & Ridicule', 1, 'Charisma', 5),
      sk('Herbalism', 1, 'Intellect', 6),
      sk('Healing', 1, 'Resolve', 4),
      sk('Folklore & Heraldry', 1, 'Intellect', 7),
      sk('Ritual', 1, 'Authority', 3),
      sk('Off-hand & Improvised Combat', 1, 'Dexterity', 2),
    ],
    traits: [
      { name: 'Inner-stair keys', note: 'Isotta’s set. Vito does not have a copy.' },
      { name: 'Two children', note: 'Niko nine, Lea four.' },
    ],
    echoes: [
      makeEcho({
        title: 'Keep Niko and Lea safe',
        weight: 2,
        invokeWhen: 'When the roll is Mara’s street, the night list, or the children.',
        groupLabel: 'Mara Vela’s street',
        group: [
          { name: 'Caterina Vela', characterSlug: 'caterina' },
          { name: 'Mara Vela', characterSlug: 'mara' },
        ],
      }),
      makeEcho({
        title: 'Names from the inner stair',
        weight: 1,
        invokeWhen: 'When the work is the inner stair or palace keys.',
        resolved: {
          narrative: 'Three names given. Orsa stood when the street was read.',
          at: '2026-08-20',
        },
      }),
      makeEcho({
        title: 'What I have not told',
        weight: 1,
        invokeWhen: 'When the roll is a confidence I have not spent.',
      }),
    ],
    hierarchy: [
      { axis: 'Blood', tier: 'Acknowledged' },
      { axis: 'Faith', tier: 'Acknowledged' },
    ],
    exertionCurrent: 5,
    inventory: {
      foodDays: 2,
      waterDays: 2,
      items: [
        it('Inner-stair keys', 'Isotta’s set.', 'keys'),
        it('Sleeve-knife', 'Hidden.', 'knife'),
      ],
    },
  });
}

/** Niccolo Calvo — stores that feed the quarter. His name was in Isotta’s Book. */
export function demoNiccolo(): CharacterRecord {
  return living({
    slug: 'niccolo',
    name: 'Niccolo Calvo',
    kind: 'pc',
    communityTie: 'House Calvo. The poor streets buy from my warehouses.',
    concept:
      'My uncle wants to sell to Pelesa and has sat with Calvaro’s man. I have not signed. I am afraid if the household seizes the warehouses the streets starve, and if I sell we belong to Pelesa.',
    whoWeSee:
      'I’m Niccolo Calvo. The poor streets buy from my warehouses. My uncle wants to sell to Pelesa. I have not signed.',
    player: { platform: 'local', displayName: 'Niccolo', accountId: 'local-niccolo' },
    foundations: foundations({
      Strength: 1,
      Dexterity: 1,
      Constitution: 2,
      Intellect: 3,
      Perception: 2,
      Resolve: 2,
      Charisma: 3,
      Guile: 2,
      Authority: 2,
    }),
    skills: [
      sk('Arithmetic & Accounting', 2, 'Intellect', 24),
      sk('Negotiation', 2, 'Authority', 18),
      sk('Debate & Rhetoric', 1, 'Charisma', 12),
      sk('Tradecraft', 2, 'Charisma', 16),
      sk('Appraisal', 1, 'Perception', 10),
      sk('Insight', 1, 'Perception', 9),
      sk('Strategy', 1, 'Intellect', 8),
      sk('Folklore & Heraldry', 1, 'Intellect', 7),
      sk('Influence', 1, 'Authority', 11),
      sk('Sailing & Navigation', 1, 'Perception', 5),
      sk('Oversight', 1, 'Authority', 6),
      sk('Deception', 1, 'Guile', 8),
      sk('Streetwise', 1, 'Guile', 7),
      sk('Etiquette', 1, 'Resolve', 4),
    ],
    traits: [
      { name: 'Warehouse keys', note: 'Three of four. Piero has the last.' },
    ],
    echoes: [
      makeEcho({
        title: 'Hold the warehouses',
        weight: 2,
        invokeWhen: 'When the roll is the warehouses, a buyer, or a seizure.',
        groupLabel: 'Calvo stores',
        group: [
          { name: 'Niccolo Calvo', characterSlug: 'niccolo' },
          { name: 'Piero Calvo', characterSlug: 'piero' },
        ],
      }),
      makeEcho({
        title: 'Do not sell the warehouses',
        weight: 1,
        invokeWhen: 'When the roll is a list, a foreign claim on a Calvo name, or a sale to Pelesa.',
      }),
    ],
    hierarchy: [
      { axis: 'Coin', tier: 'Acknowledged' },
      { axis: 'Blood', tier: 'Acknowledged' },
    ],
    exertionCurrent: 6,
    inventory: {
      foodDays: 4,
      waterDays: 4,
      items: [
        it('Warehouse keys', 'Three of four.', 'keys'),
        it('Coin', 'Unspent.', 'coin'),
      ],
    },
  });
}

export function demoMarino(): CharacterRecord {
  return living({
    slug: 'marino',
    name: 'Marino Orvanti',
    kind: 'npc',
    communityTie: 'I am duke. Isotta was my wife. Lazzaro was my brother.',
    concept:
      'The knife was meant for me. I cannot ride. Vito speaks in my name. I have not named who paid, and I have not named a successor. I am afraid the company will sell the city.',
    whoWeSee:
      'I’m Marino. A knife meant for me killed my wife and my brother. I live. I cannot ride. Vito speaks in my name now.',
    foundations: foundations({
      Strength: 2,
      Dexterity: 1,
      Constitution: 2,
      Intellect: 2,
      Perception: 2,
      Resolve: 2,
      Charisma: 2,
      Guile: 1,
      Authority: 3,
    }),
    skills: [
      sk('Command', 2, 'Authority', 20),
      sk('Strategy', 2, 'Intellect', 14),
      sk('Influence', 2, 'Authority', 16),
      sk('Folklore & Heraldry', 1, 'Intellect', 10),
      sk('Debate & Rhetoric', 1, 'Charisma', 8),
      sk('Riding', 1, 'Authority', 12),
      sk('Negotiation', 1, 'Authority', 9),
      sk('Intimidate', 1, 'Authority', 7),
    ],
    traits: [{ name: 'Cannot ride', note: 'Wound in the side. Dressed twice a day.' }],
    echoes: [
      makeEcho({
        title: 'Keep the seat',
        weight: 2,
        invokeWhen: 'When the roll is Marino’s word or Vito speaking in his name.',
        groupLabel: 'The household',
        group: [
          { name: 'Marino Orvanti', characterSlug: 'marino' },
          { name: 'Vito Cresti', characterSlug: 'vito' },
        ],
      }),
      makeEcho({
        title: 'Who held the knife',
        weight: 2,
        invokeWhen: 'When the roll is the night of the knife or a name for it.',
        groupLabel: 'The names',
        group: [
          { name: 'Marino Orvanti', characterSlug: 'marino' },
          { name: 'Vito Cresti', characterSlug: 'vito' },
          { name: 'Agnese Orsani', characterSlug: 'agnese' },
        ],
      }),
    ],
    hierarchy: [{ axis: 'Blood', tier: 'Acknowledged' }],
    harm: { Bleeding: 2, Shock: 1 },
    exertionCurrent: 3,
    inventory: {
      foodDays: 5,
      waterDays: 5,
      items: [
        it('Ducal ring', 'On the hand that cannot hold a rein.', 'ring'),
        it('Brother’s sword', 'Unworn.', 'sword'),
      ],
    },
  });
}

export function demoOrsa(): CharacterRecord {
  return living({
    slug: 'orsa',
    name: 'Orsa Solari',
    kind: 'npc',
    communityTie: 'Isotta was my sister.',
    concept:
      'I will not let them bury her as an accident. I want the death named as murder. I want the night-takings stopped. I want the names of who paid.',
    whoWeSee:
      'I’m Orsa. Isotta was my sister. I will not let them bury her as an accident. My men sleep in the square until the death is named as murder.',
    foundations: foundations({
      Strength: 1,
      Dexterity: 1,
      Constitution: 2,
      Intellect: 2,
      Perception: 2,
      Resolve: 3,
      Charisma: 2,
      Guile: 2,
      Authority: 3,
    }),
    skills: [
      sk('Influence', 2, 'Authority', 18),
      sk('Folklore & Heraldry', 2, 'Intellect', 14),
      sk('Debate & Rhetoric', 1, 'Charisma', 12),
      sk('Etiquette', 1, 'Resolve', 10),
      sk('Insight', 2, 'Perception', 16),
      sk('Investigation', 1, 'Perception', 8),
      sk('Command', 1, 'Authority', 7),
      sk('Ritual', 1, 'Authority', 9),
    ],
    traits: [{ name: 'Sister’s ring', note: 'Isotta’s marriage-band.' }],
    echoes: [
      makeEcho({
        title: 'Bury Isotta as Solari',
        weight: 2,
        invokeWhen: 'When the roll is the burial, the square, or the rite.',
        groupLabel: 'The burial',
        group: [
          { name: 'Orsa Solari', characterSlug: 'orsa' },
          { name: 'Father Lovro', characterSlug: 'lovro' },
        ],
      }),
      makeEcho({
        title: 'Finish the mill',
        weight: 2,
        invokeWhen: 'When the roll is the mill, the engine, or men boarding that door.',
        groupLabel: 'The mill',
        group: [
          { name: 'Tomaso Fero', characterSlug: 'tomaso' },
          { name: 'Orsa Solari', characterSlug: 'orsa' },
          { name: 'Vito Cresti', characterSlug: 'vito' },
        ],
      }),
    ],
    hierarchy: [{ axis: 'Blood', tier: 'Honoured' }],
    exertionCurrent: 6,
    inventory: {
      foodDays: 3,
      waterDays: 3,
      items: [
        it('Marriage-band', 'Isotta’s.', 'ring'),
        it('Purse', 'Pays the men in the square.', 'purse'),
      ],
    },
  });
}

export function demoLovro(): CharacterRecord {
  return living({
    slug: 'lovro',
    name: 'Father Lovro',
    kind: 'npc',
    communityTie: 'I hold the cathedral door.',
    concept:
      'I will not bury Isotta until Orsa and the household agree the death is murder. Until then the body stays. I am afraid the square will become a fight.',
    whoWeSee:
      'I’m Lovro. I hold the cathedral door. I will not bury the duchess until they agree the death is murder.',
    foundations: foundations({
      Strength: 1,
      Dexterity: 1,
      Constitution: 2,
      Intellect: 3,
      Perception: 2,
      Resolve: 3,
      Charisma: 2,
      Guile: 1,
      Authority: 2,
    }),
    skills: [
      sk('Ritual', 2, 'Authority', 22),
      sk('Preaching', 2, 'Charisma', 14),
      sk('Folklore & Heraldry', 1, 'Intellect', 12),
      sk('Healing', 1, 'Resolve', 8),
      sk('Mentoring', 1, 'Charisma', 6),
      sk('Insight', 1, 'Perception', 10),
      sk('Debate & Rhetoric', 1, 'Charisma', 7),
      sk('Herbalism', 1, 'Intellect', 4),
    ],
    traits: [{ name: 'Latin', note: 'Reads and serves in it.' }],
    echoes: [
      makeEcho({
        title: 'Hold the body',
        weight: 2,
        invokeWhen: 'When the roll is the burial or the cathedral door.',
        groupLabel: 'The burial',
        group: [
          { name: 'Orsa Solari', characterSlug: 'orsa' },
          { name: 'Father Lovro', characterSlug: 'lovro' },
        ],
      }),
    ],
    hierarchy: [{ axis: 'Faith', tier: 'Honoured' }],
    exertionCurrent: 5,
    inventory: {
      foodDays: 3,
      waterDays: 4,
      items: [
        it('Vestry key', 'One.', 'keys'),
        it('Book of the dead', 'Isotta’s name is not in it yet.', 'book'),
      ],
    },
  });
}

export function demoPiero(): CharacterRecord {
  return living({
    slug: 'piero',
    name: 'Piero Calvo',
    kind: 'npc',
    communityTie: 'House Calvo. Niccolo is my brother’s son.',
    concept:
      'I have sat with Pelesa and with Calvaro. I will force a sale if Niccolo will not. I am afraid the household will seize the warehouses first.',
    whoWeSee:
      'I’m Piero Calvo. The streets buy from our warehouses. I have sat with both foreigners. I have not signed yet.',
    foundations: foundations({
      Strength: 1,
      Dexterity: 1,
      Constitution: 2,
      Intellect: 3,
      Perception: 2,
      Resolve: 2,
      Charisma: 2,
      Guile: 3,
      Authority: 2,
    }),
    skills: [
      sk('Arithmetic & Accounting', 2, 'Intellect', 20),
      sk('Negotiation', 2, 'Authority', 18),
      sk('Tradecraft', 2, 'Charisma', 16),
      sk('Oversight', 1, 'Authority', 10),
      sk('Appraisal', 1, 'Perception', 12),
      sk('Strategy', 1, 'Intellect', 8),
      sk('Influence', 1, 'Authority', 9),
      sk('Deception', 1, 'Guile', 11),
    ],
    traits: [{ name: 'Pelesan ring', note: 'Convoy-protection. Still worn.' }],
    echoes: [
      makeEcho({
        title: 'Sell the cargo',
        weight: 2,
        invokeWhen: 'When the roll is the Pelesan buyer, the charter, or the warehouse keys.',
        groupLabel: 'Calvo stores',
        group: [
          { name: 'Piero Calvo', characterSlug: 'piero' },
          { name: 'Niccolo Calvo', characterSlug: 'niccolo' },
        ],
      }),
    ],
    hierarchy: [{ axis: 'Coin', tier: 'Honoured' }],
    exertionCurrent: 5,
    inventory: {
      foodDays: 6,
      waterDays: 6,
      items: [
        it('Warehouse key', 'The fourth. Niccolo has three.', 'keys'),
        it('Charter copy', 'Unsigned.', 'charter'),
      ],
    },
  });
}

export function demoMara(): CharacterRecord {
  return living({
    slug: 'mara',
    name: 'Mara Vela',
    kind: 'npc',
    communityTie: 'Caterina’s aunt. The children sleep in my house.',
    concept:
      'Vito’s men have our street. Three neighbours have not come back. I will hide a child. I will not hide a man they have already named.',
    whoWeSee:
      'I’m Mara. Caterina’s children sleep in my house. Vito’s men have our street. Three neighbours have not come back.',
    foundations: foundations({
      Strength: 2,
      Dexterity: 1,
      Constitution: 3,
      Intellect: 1,
      Perception: 2,
      Resolve: 3,
      Charisma: 2,
      Guile: 2,
      Authority: 1,
    }),
    skills: [
      sk('Cooking & Preserving', 2, 'Resolve', 16),
      sk('Childcare', 2, 'Resolve', 14),
      sk('Streetwise', 1, 'Guile', 12),
      sk('Empathy', 1, 'Charisma', 10),
      sk('Foraging & Fishing', 1, 'Constitution', 8),
      sk('Herbalism', 1, 'Intellect', 5),
      sk('Influence', 1, 'Authority', 4),
      sk('Healing', 1, 'Resolve', 6),
    ],
    traits: [{ name: 'Open door', note: 'The street eats here.' }],
    echoes: [
      makeEcho({
        title: 'Keep the street’s children',
        weight: 2,
        invokeWhen: 'When the roll is this street, the night list, or the children.',
        groupLabel: 'Mara Vela’s street',
        group: [
          { name: 'Caterina Vela', characterSlug: 'caterina' },
          { name: 'Mara Vela', characterSlug: 'mara' },
        ],
      }),
    ],
    hierarchy: [{ axis: 'Blood', tier: 'Acknowledged' }],
    exertionCurrent: 6,
    inventory: {
      foodDays: 3,
      waterDays: 3,
      items: [
        it('Credit-stick', 'Calvo. Not called in.', 'tally'),
        it('Latch-key', 'The house.', 'keys'),
      ],
    },
  });
}

export function demoVito(): CharacterRecord {
  return living({
    slug: 'vito',
    name: 'Vito Cresti',
    kind: 'npc',
    communityTie: 'I command the duke’s household arms. Paolo copies names for me.',
    concept:
      'Marino cannot ride, so I speak in his name. I take people at night until someone names who paid for the knife. I think it was the company or Solari.',
    whoWeSee:
      'I’m Vito. The duke cannot ride, so I speak in his name. I take people at night. Some come back. Some do not.',
    foundations: foundations({
      Strength: 2,
      Dexterity: 2,
      Constitution: 2,
      Intellect: 2,
      Perception: 2,
      Resolve: 2,
      Charisma: 1,
      Guile: 2,
      Authority: 3,
    }),
    skills: [
      sk('Command', 2, 'Authority', 18),
      sk('Intimidate', 2, 'Authority', 16),
      sk('Investigation', 1, 'Perception', 12),
      sk('Streetwise', 1, 'Guile', 10),
      sk('Slash', 1, 'Strength', 8),
      sk('Tactics', 1, 'Intellect', 7),
      sk('Combat Awareness', 1, 'Perception', 9),
      sk('Insight', 1, 'Perception', 6),
    ],
    traits: [{ name: 'Night list', note: 'He names. Paolo copies.' }],
    echoes: [
      makeEcho({
        title: 'Get a confession',
        weight: 2,
        invokeWhen: 'When the roll is the night list, a named street, or speaking in Marino’s name.',
        groupLabel: 'The night list',
        group: [
          { name: 'Vito Cresti', characterSlug: 'vito' },
          { name: 'Paolo Cresti', characterSlug: 'paolo' },
        ],
      }),
      makeEcho({
        title: 'Finish the mill',
        weight: 2,
        invokeWhen: 'When the roll is the mill, the engine, or men boarding that door.',
        groupLabel: 'The mill',
        group: [
          { name: 'Tomaso Fero', characterSlug: 'tomaso' },
          { name: 'Orsa Solari', characterSlug: 'orsa' },
          { name: 'Vito Cresti', characterSlug: 'vito' },
        ],
      }),
    ],
    hierarchy: [
      { axis: 'Arms', tier: 'Trusted' },
      { axis: 'Blood', tier: 'Acknowledged' },
    ],
    armour: { kind: 'light', donned: true },
    exertionCurrent: 5,
    inventory: {
      foodDays: 4,
      waterDays: 4,
      items: [
        it('Name-list', 'Mara’s street is on it.', 'name-list'),
        it('Household sword', 'Duke’s arms.', 'sword'),
      ],
    },
  });
}

export function demoPaolo(): CharacterRecord {
  return living({
    slug: 'paolo',
    name: 'Paolo Cresti',
    kind: 'npc',
    communityTie: 'Vito is my brother. I copy the names he takes.',
    concept:
      'I know three names that have not come back. I have not told their houses. I am afraid of what I write next.',
    whoWeSee:
      'I’m Paolo. I copy the names Vito takes at night. I know three who have not come back.',
    foundations: foundations({
      Strength: 1,
      Dexterity: 2,
      Constitution: 1,
      Intellect: 3,
      Perception: 2,
      Resolve: 2,
      Charisma: 1,
      Guile: 2,
      Authority: 1,
    }),
    skills: [
      sk('Arithmetic & Accounting', 2, 'Intellect', 16),
      sk('Illustration', 1, 'Intellect', 10),
      sk('Folklore & Heraldry', 1, 'Intellect', 8),
      sk('Investigation', 1, 'Perception', 7),
      sk('Insight', 1, 'Perception', 9),
      sk('Streetwise', 1, 'Guile', 11),
      sk('Sneak', 1, 'Dexterity', 6),
      sk('Forgery', 1, 'Guile', 4),
    ],
    traits: [{ name: 'Copy-hand', note: 'Clear letters. Fast.' }],
    echoes: [
      makeEcho({
        title: 'Copy the next name',
        weight: 2,
        invokeWhen: 'When the roll is the night-roll copy or a named street.',
        groupLabel: 'The night list',
        group: [
          { name: 'Vito Cresti', characterSlug: 'vito' },
          { name: 'Paolo Cresti', characterSlug: 'paolo' },
        ],
      }),
    ],
    hierarchy: [{ axis: 'Arms', tier: 'Acknowledged' }],
    exertionCurrent: 4,
    inventory: {
      foodDays: 4,
      waterDays: 4,
      items: [
        it('Name-list copy', 'Three names marked gone.', 'name-list'),
        it('Ink', 'For the list.', 'ink'),
      ],
    },
  });
}

export function demoAgnese(): CharacterRecord {
  return living({
    slug: 'agnese',
    name: 'Agnese Orsani',
    kind: 'npc',
    communityTie: 'House Orsani. I write the names of who was taken and who might have paid.',
    concept:
      'I have the names of the taken and of the likely payers: a Solari cousin who fled, a Company man missing from the gate, Luca’s unopened book, Matteo’s purse. I will post the list if another person disappears.',
    whoWeSee:
      'I’m Agnese Orsani. I keep the names of who Vito has taken and who might have paid for the knife. I will post them if another person disappears.',
    foundations: foundations({
      Strength: 1,
      Dexterity: 1,
      Constitution: 2,
      Intellect: 3,
      Perception: 2,
      Resolve: 2,
      Charisma: 2,
      Guile: 1,
      Authority: 2,
    }),
    skills: [
      sk('Arithmetic & Accounting', 2, 'Intellect', 18),
      sk('Folklore & Heraldry', 2, 'Intellect', 16),
      sk('Debate & Rhetoric', 1, 'Charisma', 12),
      sk('Insight', 1, 'Perception', 10),
      sk('Negotiation', 1, 'Authority', 8),
      sk('Influence', 1, 'Authority', 9),
      sk('Ritual', 1, 'Authority', 6),
      sk('Etiquette', 1, 'Resolve', 7),
    ],
    traits: [{ name: 'Keeps the names', note: 'Who was taken. Who might have paid.' }],
    echoes: [
      makeEcho({
        title: 'Post the names',
        weight: 2,
        invokeWhen: 'When the roll is posting the names of the taken or the suspects.',
        groupLabel: 'The names',
        group: [
          { name: 'Agnese Orsani', characterSlug: 'agnese' },
          { name: 'Vito Cresti', characterSlug: 'vito' },
          { name: 'Marino Orvanti', characterSlug: 'marino' },
        ],
      }),
    ],
    hierarchy: [
      { axis: 'Blood', tier: 'Trusted' },
      { axis: 'Coin', tier: 'Acknowledged' },
    ],
    exertionCurrent: 4,
    inventory: {
      foodDays: 3,
      waterDays: 3,
      items: [
        it('Name-list', 'Taken. Suspects.', 'name-list'),
      ],
    },
  });
}

export function demoLuca(): CharacterRecord {
  return living({
    slug: 'luca',
    name: 'Luca Bandi',
    kind: 'npc',
    communityTie: 'I am Pelesa’s consul. I rent a house here.',
    concept:
      'I can pay the company, land men, or find a friend on the seat. I want this harbour open to Pelesa. Calvaro wants it shut.',
    whoWeSee:
      'I’m Luca Bandi. I speak for Pelesa. I can pay the company, land men, or find a friend on the seat. I want this harbour open to us.',
    foundations: foundations({
      Strength: 1,
      Dexterity: 1,
      Constitution: 2,
      Intellect: 2,
      Perception: 2,
      Resolve: 2,
      Charisma: 2,
      Guile: 3,
      Authority: 2,
    }),
    skills: [
      sk('Negotiation', 2, 'Authority', 16),
      sk('Deception', 2, 'Guile', 14),
      sk('Tradecraft', 1, 'Charisma', 12),
      sk('Sailing & Navigation', 1, 'Perception', 10),
      sk('Insight', 1, 'Perception', 8),
      sk('Arithmetic & Accounting', 1, 'Intellect', 9),
      sk('Streetwise', 1, 'Guile', 7),
      sk('Debate & Rhetoric', 1, 'Charisma', 6),
    ],
    traits: [{ name: 'Landing-book', note: 'Unopened here.' }],
    echoes: [
      makeEcho({
        title: 'Open this harbour to Pelesa',
        weight: 2,
        invokeWhen: 'When the roll is Company pay, the harbour, or the landing-book.',
        groupLabel: 'The landing',
        group: [
          { name: 'Luca Bandi', characterSlug: 'luca' },
          { name: 'Jakov Bracco', characterSlug: 'jakov' },
        ],
      }),
    ],
    hierarchy: [],
    exertionCurrent: 5,
    inventory: {
      foodDays: 5,
      waterDays: 5,
      items: [
        it('Pay-chest', 'Company winter. Unopened.', 'chest'),
        it('Landing-book', 'Unopened.', 'charter'),
      ],
    },
  });
}

export function demoMatteo(): CharacterRecord {
  return living({
    slug: 'matteo',
    name: 'Matteo Rinaldi',
    kind: 'npc',
    communityTie: 'I speak for Osvaldo Calvaro. I rent a house here.',
    concept:
      'I can make the duke sign, buy the company, or take the harbour through it. I want Pelesa shut out. I do not need Marino dead. I need him ours.',
    whoWeSee:
      'I’m Matteo Rinaldi. I speak for Osvaldo Calvaro. I can make the duke sign, buy the company, or take the city through it.',
    foundations: foundations({
      Strength: 1,
      Dexterity: 1,
      Constitution: 2,
      Intellect: 3,
      Perception: 2,
      Resolve: 2,
      Charisma: 2,
      Guile: 2,
      Authority: 3,
    }),
    skills: [
      sk('Negotiation', 2, 'Authority', 18),
      sk('Debate & Rhetoric', 1, 'Charisma', 12),
      sk('Arithmetic & Accounting', 1, 'Intellect', 10),
      sk('Insight', 2, 'Perception', 14),
      sk('Deception', 1, 'Guile', 11),
      sk('Influence', 2, 'Authority', 16),
      sk('Strategy', 1, 'Intellect', 9),
      sk('Folklore & Heraldry', 1, 'Intellect', 7),
    ],
    traits: [{ name: 'Drafted charter', note: 'Osvaldo Calvaro’s name. Unsigned.' }],
    echoes: [
      makeEcho({
        title: 'Make this harbour Calvaro’s',
        weight: 2,
        invokeWhen: 'When the roll is the charter, Piero, or Company pay for the hill gate.',
        groupLabel: 'Calvaro’s landing',
        group: [
          { name: 'Matteo Rinaldi', characterSlug: 'matteo' },
          { name: 'Piero Calvo', characterSlug: 'piero' },
          { name: 'Duje', characterSlug: 'duje' },
        ],
      }),
    ],
    hierarchy: [],
    exertionCurrent: 5,
    inventory: {
      foodDays: 5,
      waterDays: 5,
      items: [
        it('Charter', 'Drafted. Unsigned.', 'charter'),
        it('Gold', 'Company pay for the hill gate.', 'coin'),
      ],
    },
  });
}

export function demoDuje(): CharacterRecord {
  return living({
    slug: 'duje',
    name: 'Duje',
    kind: 'npc',
    communityTie: 'I run a boat after dark.',
    concept:
      'I move people and oil at night. I owe Matteo my brother’s life. I will not move children. I have not told Vito.',
    whoWeSee:
      'I’m Duje. I run a boat after dark. People who need to leave without Vito knowing come to me.',
    foundations: foundations({
      Strength: 2,
      Dexterity: 2,
      Constitution: 2,
      Intellect: 1,
      Perception: 2,
      Resolve: 2,
      Charisma: 1,
      Guile: 3,
      Authority: 1,
    }),
    skills: [
      sk('Smuggling', 2, 'Guile', 18),
      sk('Sailing & Navigation', 2, 'Perception', 16),
      sk('Streetwise', 1, 'Guile', 12),
      sk('Sneak', 1, 'Dexterity', 10),
      sk('Appraisal', 1, 'Perception', 6),
      sk('Foraging & Fishing', 1, 'Constitution', 8),
      sk('Tradecraft', 1, 'Charisma', 4),
      sk('Swimming', 1, 'Constitution', 5),
    ],
    traits: [{ name: 'Brother’s life', note: 'Owed to Matteo. Not coin.' }],
    echoes: [
      makeEcho({
        title: 'Move oil after dark',
        weight: 1,
        invokeWhen: 'When the roll is night cargo or Matteo calling the debt.',
      }),
    ],
    hierarchy: [],
    exertionCurrent: 4,
    inventory: {
      foodDays: 2,
      waterDays: 4,
      items: [
        it('Boat', 'No house-mark.', 'boat'),
        it('Oil-jars', 'Two.', 'oil-jars'),
      ],
    },
  });
}

/** @deprecated use demoTomaso */
export const demoNerio = demoTomaso;
/** @deprecated use demoJakov */
export const demoStana = demoJakov;
/** @deprecated use demoTomaso */
export const demoTorvald = demoTomaso;
/** @deprecated use demoJakov */
export const demoLeifr = demoJakov;
/** @deprecated use demoTomaso */
export const demoTomas = demoTomaso;
/** @deprecated use demoTomaso */
export const demoEira = demoTomaso;
/** @deprecated use demoJakov */
export const demoLeif = demoJakov;

export const demoCapacityProfile = (name = 'Jakov Bracco') => {
  const ch = demoJakov();
  if (name !== 'Jakov Bracco' && name !== 'Stana Krstova' && name !== 'Leva of the Chain' && name !== 'Leifr Ketilsson' && name !== 'Leif') {
    ch.name = name;
    ch.slug = name.toLowerCase().replace(/\s+/g, '-');
  }
  return ch;
};

export function buildDemoHall(): { community: CommunityRecord; characters: CharacterRecord[] } {
  const community = emptyCommunity(DEMO_SLUG, DEMO_NAME);
  community.fortunes = {
    vitality: 1,
    cohesion: 0,
    surplus: 1,
    standing: 2,
    tradition: 0,
  };
  community.fortunesFoundedAt = '2026-08-01T12:00:00.000Z';
  community.myths = [
    {
      title: 'Isotta’s Book',
      summary:
        'Isotta Solari’s dowry included a Pelesan register of Aspalath boat-families listed for rower-service. The marriage-peace required the book returned. She burned it in the cathedral yard. The named families stood with her. House Calvo wanted it kept as convoy-protection. Pelesa treats the burning as theft of a public instrument and has sent no peace-envoy since. The pages are ash.',
      effects: [
        {
          kind: 'exertion_free',
          label: 'Free extra Exertion when the work is a list, register, or foreign claim on a name',
          detail: 'Pool untouched. Tag the Myth. Does not fire on free prose.',
        },
        {
          kind: 'disadvantage',
          label: 'Disadvantage enforcing a written foreign claim inside Aspalath',
          detail: 'On the other side, when they use a list or instrument as if Isotta’s Book still existed.',
        },
      ],
    },
    {
      title: 'Lazzaro’s Charter',
      summary:
        'Twelve years ago Pelesan marines tried the hill gate while their galleys held the harbour. Lazzaro, who could no longer pay the Free Company in coin, promised them the old Orsani warehouse as a barracks. Marino’s father signed rather than lose the gate. The assault ended that week; the house was handed over; Pelesa withdrew. Burghers who still hold the old roll call that house a foreign garrison. The Company still sleeps there.',
      effects: [
        {
          kind: 'advantage',
          label: 'Advantage for Company members on Arms inside the walls',
          detail: 'When the Myth is tagged and the work is whether the Company may stand in the city.',
        },
        {
          kind: 'exertion_forced',
          label: 'Forced extra Exertion to expel or disarm the Company',
          detail: 'On an Orvanti household roll that tries to put them out of the warehouse or take their arms inside the walls.',
        },
      ],
    },
  ];

  const tomaso = demoTomaso();
  const jakov = demoJakov();
  const caterina = demoCaterina();
  const niccolo = demoNiccolo();
  const marino = demoMarino();
  const orsa = demoOrsa();
  const lovro = demoLovro();
  const piero = demoPiero();
  const mara = demoMara();
  const vito = demoVito();
  const paolo = demoPaolo();
  const agnese = demoAgnese();
  const luca = demoLuca();
  const matteo = demoMatteo();
  const duje = demoDuje();

  const HOUSES = 'g-houses';
  const FOREIGN = 'g-foreign';
  const ESTATE = 'g-estate';
  upsertLabelGroup(community, { id: HOUSES, name: 'Noble Houses of Aspalath', kind: 'faction' });
  upsertLabelGroup(community, { id: FOREIGN, name: 'Foreign Influence', kind: 'faction' });
  upsertLabelGroup(community, { id: ESTATE, name: 'Estate Loyalty', kind: 'faction' });
  upsertLabelGroup(community, { id: TAG_GROUP_ID, name: 'Tags', kind: 'tag' });

  const orvanti = upsertFactionLabel(community, 'House Orvanti', 42, HOUSES);
  const solari = upsertFactionLabel(community, 'House Solari', 210, HOUSES);
  const calvo = upsertFactionLabel(community, 'House Calvo', 0, HOUSES);
  const pelesa = upsertFactionLabel(community, 'Pelesa', 265, FOREIGN);
  const calvaro = upsertFactionLabel(community, 'Calvaro', 28, FOREIGN);
  const household = upsertFactionLabel(community, 'Ducal household', 320, ESTATE);
  const company = upsertFactionLabel(community, 'Free Company', 175, ESTATE);
  const cathedral = upsertFactionLabel(community, 'Cathedral', 55, ESTATE);
  const burghers = upsertFactionLabel(community, 'Burghers', 250, ESTATE);

  const tagNight = upsertTagLabel(community, 'Night list');
  const tagKeys = upsertTagLabel(community, 'Inner-stair keys');
  const tagUnburied = upsertTagLabel(community, 'Unburied');
  const tagCharter = upsertTagLabel(community, 'Calvaro charter');
  const tagMissing = upsertTagLabel(community, 'Missing brother');

  tomaso.labelIds = [];
  jakov.labelIds = [company.id, tagMissing.id];
  caterina.labelIds = [solari.id, tagNight.id, tagKeys.id];
  niccolo.labelIds = [calvo.id];
  marino.labelIds = [orvanti.id, household.id];
  orsa.labelIds = [solari.id, tagUnburied.id];
  lovro.labelIds = [cathedral.id, tagUnburied.id];
  piero.labelIds = [calvo.id, tagCharter.id];
  mara.labelIds = [burghers.id, tagNight.id];
  vito.labelIds = [orvanti.id, household.id, tagNight.id];
  paolo.labelIds = [household.id, tagNight.id];
  agnese.labelIds = [burghers.id];
  luca.labelIds = [pelesa.id];
  matteo.labelIds = [calvaro.id, tagCharter.id];
  duje.labelIds = [];

  const onLadders = [
    tomaso,
    jakov,
    caterina,
    niccolo,
    marino,
    orsa,
    lovro,
    piero,
    mara,
    vito,
    paolo,
    agnese,
  ];
  const porch = [luca, matteo, duje];
  const characters = [...onLadders, ...porch];

  community.ruler = marino.name;
  community.rulerCharacterSlug = marino.slug;
  community.placements = onLadders.flatMap((ch) =>
    ch.hierarchy.map((h) => ({
      name: ch.name,
      axis: h.axis,
      tier: h.tier,
      characterSlug: ch.slug,
      note: ch.whoWeSee,
      labelIds: ch.labelIds,
    })),
  );
  community.outsiders = porch.map((ch) => ({
    name: ch.name,
    note: ch.whoWeSee,
    characterSlug: ch.slug,
    labelIds: ch.labelIds,
  }));

  return { community, characters };
}

export function seedDemoCampaign(
  store: CommunityStorePort,
  slug = DEMO_SLUG,
  name = DEMO_NAME,
): { community: CommunityRecord; character: CharacterRecord } {
  const { community, characters } = buildDemoHall();
  community.slug = slug;
  community.name = name;
  store.putCommunity(community);
  for (const ch of characters) store.putCharacter(ch);
  store.appendEvent({
    type: 'CampaignSeeded',
    payload: { slug, seed: DEMO_SEED_ID },
  });
  const tomaso = characters.find((c) => c.slug === 'tomaso')!;
  return { community, character: tomaso };
}
