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
    communityTie: 'Lazzaro Orvanti took me off a galley and set me to the mill behind the hill gate.',
    concept:
      'I keep the mill Lazzaro gave me. The engine in it is unfinished. Household men have stacked boards at the door. I still sleep there. I owe Orsa Solari for my mother’s burial.',
    whoWeSee:
      'A millwright. Lime in the seams of his hands. He still works the mill behind the hill gate, even with boards stacked at the door.',
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
      { name: 'Galley scar', note: 'Ankle. Walks stiff on that side.' },
      { name: 'Reads a plan', note: 'Can follow a drawn machine. Speaks enough Latin for a workshop.' },
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
        { name: 'Adze', note: 'Edge dull from the mill-lip.' },
        { name: 'Wool cloak', note: 'One. Dry.' },
        { name: 'Screw-jack', note: 'For the unfinished lift.' },
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
    communityTie: 'My daughter Mira sleeps in the Charter house. Lazzaro stood her godfather.',
    concept:
      'I came with the Company the year we held the hill gate. We are a season behind in pay. Mira is seven and knows this warehouse as home. My brother was on the hill gate the night of the knife and has not come back. I have not taken Luca’s coin or Matteo’s.',
    whoWeSee:
      'A Company man, unpaid. A girl of seven in the warehouse doorway behind him. He will not take a foreign purse for that roof.',
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
      { name: 'Godfather’s ring', note: 'Lazzaro’s. Too big. Mira knows it.' },
      { name: 'Hill-gate watch', note: 'Slept that gate twelve years.' },
    ],
    echoes: [
      makeEcho({
        title: 'Keep Mira in the warehouse',
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
      }),
    ],
    hierarchy: [{ axis: 'Arms', tier: 'Acknowledged' }],
    armour: { kind: 'light', donned: true },
    exertionCurrent: 5,
    inventory: {
      foodDays: 1,
      waterDays: 2,
      items: [
        { name: 'Sword', note: 'Company issue. Edge notched.' },
        { name: 'Shield', note: 'Rim split on one quarter.' },
        { name: 'Child’s cloak', note: 'Cut down. Mira’s.' },
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
    communityTie: 'I dressed Duchess Isotta for twelve years. My children live on Mara Vela’s street.',
    concept:
      'I still walk the palace as a servant. Niko is nine and Lea is four; they sleep at my aunt Mara’s. That street is on the night roll. Orsa asked me for the names from the inner stair; I gave her three. I have not said what else I heard.',
    whoWeSee:
      'A palace servant, lower-town dust on the hem. People still ask her to open a door.',
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
        invokeWhen: 'When the roll is Mara Vela’s street, the night roll, or the children.',
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
        title: 'What I have not said',
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
        { name: 'Keys', note: 'Inner stair. Worn.' },
        { name: 'Sleeve-knife', note: 'Small. Hidden.' },
        { name: 'Ribbon', note: 'Solari blue. Lea’s.' },
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
    communityTie: 'House Calvo. I keep the warehouses the lower town buys from.',
    concept:
      'I stood in the cathedral yard when Isotta burned the Pelesan register; my name was in it. Uncle Piero wants to sell a cargo to Pelesa and has listened to Calvaro’s man. I have not signed. I have coin for a landing and have not spent it.',
    whoWeSee:
      'Calvo cloth, chalk on the cuffs. The lower town still buys from his warehouses.',
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
      { name: 'Name in the ash', note: 'Listed in Isotta’s Book. Stood in the yard.' },
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
        title: 'My name was in the Book',
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
        { name: 'Warehouse keys', note: 'Three of four.' },
        { name: 'Coin', note: 'Enough for a hull. Unspent.' },
        { name: 'Name-list', note: 'Copied from memory after the burning.' },
      ],
    },
  });
}

export function demoMarino(): CharacterRecord {
  return living({
    slug: 'marino',
    name: 'Marino Orvanti',
    kind: 'npc',
    communityTie: 'Duke of Aspalath. Husband of Isotta Solari. Brother of Lazzaro.',
    concept:
      'The knife was meant for me. It killed my wife and my brother. I live. I cannot ride. Vito speaks in my name. I have not named who held the knife, and I have not named a successor.',
    whoWeSee:
      'A duke who sits. The wound in his side is dressed twice a day. People who used to wait on his word now wait on Vito’s.',
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
    traits: [{ name: 'Opened side', note: 'Cannot ride. Dressed twice a day.' }],
    echoes: [
      makeEcho({
        title: 'Keep the seat',
        weight: 2,
        invokeWhen: 'When the roll is Marino’s word or Vito speaking in his name.',
      }),
      makeEcho({
        title: 'Who held the knife',
        weight: 2,
        invokeWhen: 'When the roll is the night of the knife or a name for it.',
      }),
    ],
    hierarchy: [{ axis: 'Blood', tier: 'Acknowledged' }],
    harm: { Bleeding: 2, Shock: 1 },
    exertionCurrent: 3,
    inventory: {
      foodDays: 5,
      waterDays: 5,
      items: [
        { name: 'Ducal ring', note: 'On the hand that cannot hold a rein.' },
        { name: 'Brother’s sword', note: 'Unworn.' },
      ],
    },
  });
}

export function demoOrsa(): CharacterRecord {
  return living({
    slug: 'orsa',
    name: 'Orsa Solari',
    kind: 'npc',
    communityTie: 'Isotta Solari’s sister.',
    concept:
      'My sister married Marino and died on a night the knife was not meant for her. I will not let the cathedral bury her as an Orvanti accident. I want a Solari funeral, and I want to know if the household let the knife through.',
    whoWeSee:
      'Solari black. She sleeps in the cathedral square with her men. People who want Isotta buried come to her, not to the duke.',
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
      }),
    ],
    hierarchy: [{ axis: 'Blood', tier: 'Honoured' }],
    exertionCurrent: 6,
    inventory: {
      foodDays: 3,
      waterDays: 3,
      items: [
        { name: 'Marriage-band', note: 'Isotta’s.' },
        { name: 'Purse', note: 'Pays the men in the square.' },
      ],
    },
  });
}

export function demoLovro(): CharacterRecord {
  return living({
    slug: 'lovro',
    name: 'Father Lovro',
    kind: 'npc',
    communityTie: 'Priest of Our Lady of the Harbour. Holds the cathedral door.',
    concept:
      'I serve in Latin. I will not bury Isotta until Orsa and the household agree what the death is. Until then the body stays behind the rood screen.',
    whoWeSee:
      'Cathedral cloth. People who want a burial come to him. So do people who want the square cleared.',
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
      }),
    ],
    hierarchy: [{ axis: 'Faith', tier: 'Honoured' }],
    exertionCurrent: 5,
    inventory: {
      foodDays: 3,
      waterDays: 4,
      items: [
        { name: 'Vestry key', note: 'One.' },
        { name: 'Book of the dead', note: 'Isotta’s name is not in it yet.' },
      ],
    },
  });
}

export function demoPiero(): CharacterRecord {
  return living({
    slug: 'piero',
    name: 'Piero Calvo',
    kind: 'npc',
    communityTie: 'House Calvo. Niccolo’s uncle.',
    concept:
      'I wanted Isotta’s Book kept. I have a Pelesan buyer for a cargo still in Niccolo’s warehouse. I have sat with Calvaro’s man. I have not forced the sale.',
    whoWeSee:
      'Warehouse chalk. A Pelesan ring he has not taken off. The quarter still buys from his stores.',
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
      }),
    ],
    hierarchy: [{ axis: 'Coin', tier: 'Honoured' }],
    exertionCurrent: 5,
    inventory: {
      foodDays: 6,
      waterDays: 6,
      items: [
        { name: 'Warehouse key', note: 'The fourth. Niccolo has three.' },
        { name: 'Charter copy', note: 'Unsigned.' },
      ],
    },
  });
}

export function demoMara(): CharacterRecord {
  return living({
    slug: 'mara',
    name: 'Mara Vela',
    kind: 'npc',
    communityTie: 'Lower town. Caterina’s aunt. The children sleep in my house.',
    concept:
      'Niko and Lea sleep here. Our street is on the night roll. Three neighbours on that list have not been seen at the pans. I will hide a child. I will not hide a man Vito has already named.',
    whoWeSee:
      'Press-oil on her sleeves. Two children in the doorway who are not hers.',
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
        invokeWhen: 'When the roll is this street, the night roll, or the children.',
      }),
    ],
    hierarchy: [{ axis: 'Blood', tier: 'Acknowledged' }],
    exertionCurrent: 6,
    inventory: {
      foodDays: 3,
      waterDays: 3,
      items: [
        { name: 'Credit-stick', note: 'Calvo. Not called in.' },
        { name: 'Latch-key', note: 'The house.' },
      ],
    },
  });
}

export function demoVito(): CharacterRecord {
  return living({
    slug: 'vito',
    name: 'Vito Cresti',
    kind: 'npc',
    communityTie: 'Captain of the duke’s household arms. Paolo copies the night roll for me.',
    concept:
      'Marino cannot ride, so I speak in his name. I take names at night. I have asked Jakov who held the knife. I have boards at Tomaso’s mill. I think the knife came from the Company or from Solari.',
    whoWeSee:
      'Household coat, a roll-case at the belt. People step aside in the lanes after dark.',
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
    traits: [{ name: 'Night-roll case', note: 'Streets. He names; Paolo copies.' }],
    echoes: [
      makeEcho({
        title: 'The night roll',
        weight: 2,
        invokeWhen: 'When the roll is the night list, a named street, or speaking in Marino’s name.',
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
        { name: 'Night-roll case', note: 'Mara Vela’s street is in it.' },
        { name: 'Household sword', note: 'Duke’s arms.' },
      ],
    },
  });
}

export function demoPaolo(): CharacterRecord {
  return living({
    slug: 'paolo',
    name: 'Paolo Cresti',
    kind: 'npc',
    communityTie: 'Vito’s brother. I copy the night roll.',
    concept:
      'I copy streets Vito names. Mara Vela’s street is already on it. I know three names that have not been seen at the pans. I have not told the house.',
    whoWeSee:
      'Ink on the first two fingers. A copy-case.',
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
        title: 'Copy the next street',
        weight: 2,
        invokeWhen: 'When the roll is the night-roll copy or a named street.',
      }),
    ],
    hierarchy: [{ axis: 'Arms', tier: 'Acknowledged' }],
    exertionCurrent: 4,
    inventory: {
      foodDays: 4,
      waterDays: 4,
      items: [
        { name: 'Night-roll copy', note: 'Mara Vela’s street. Three names marked gone.' },
        { name: 'Ink horn', note: 'Full.' },
      ],
    },
  });
}

export function demoAgnese(): CharacterRecord {
  return living({
    slug: 'agnese',
    name: 'Agnese Orsani',
    kind: 'npc',
    communityTie: 'House Orsani. I keep the burgher list from when this city named a count.',
    concept:
      'I stood in the yard when Isotta burned the Pelesan register. I still have the list of families that once named a count. I will read it in the square if the household keeps writing streets instead of finding who held the knife.',
    whoWeSee:
      'An old-house dress and a roll under her arm that is not Vito’s.',
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
    traits: [{ name: 'Burgher list', note: 'Families that once named a count.' }],
    echoes: [
      makeEcho({
        title: 'Read the burgher list',
        weight: 2,
        invokeWhen: 'When the roll is the old naming of a count or a public reading.',
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
        { name: 'Burgher list', note: 'The old families.' },
        { name: 'Warehouse deed', note: 'Older copy. Voided by the Charter.' },
      ],
    },
  });
}

export function demoLuca(): CharacterRecord {
  return living({
    slug: 'luca',
    name: 'Luca Bandi',
    kind: 'npc',
    communityTie: 'Consul for Pelesa. I rent a house inside the walls.',
    concept:
      'I am here to buy the Company’s winter so this harbour stays open to us. I have a landing-book I have not opened in front of anyone. Calvaro’s man wants the opposite.',
    whoWeSee:
      'Pelesan cloth in a rented house. Coin enough for a Company’s winter.',
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
        title: 'Buy the Company’s winter',
        weight: 2,
        invokeWhen: 'When the roll is Company pay, the harbour, or the landing-book.',
      }),
    ],
    hierarchy: [],
    exertionCurrent: 5,
    inventory: {
      foodDays: 5,
      waterDays: 5,
      items: [
        { name: 'Pay-chest', note: 'Company winter. Unopened.' },
        { name: 'Landing-book', note: 'Unopened.' },
      ],
    },
  });
}

export function demoMatteo(): CharacterRecord {
  return living({
    slug: 'matteo',
    name: 'Matteo Rinaldi',
    kind: 'npc',
    communityTie: 'Osvaldo Calvaro’s man. I rent a house.',
    concept:
      'My king wants this harbour as a client, to shut Pelesa out. I have a charter drafted in his name. I have sat with Piero Calvo. I will pay the Company to hold the hill gate. I do not need Marino dead. I need him signed.',
    whoWeSee:
      'Hinterland cloth, Calvaro seal-wax. He does not hurry.',
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
        title: 'Get the charter signed',
        weight: 2,
        invokeWhen: 'When the roll is the charter, Piero, or Company pay for the hill gate.',
      }),
    ],
    hierarchy: [],
    exertionCurrent: 5,
    inventory: {
      foodDays: 5,
      waterDays: 5,
      items: [
        { name: 'Charter', note: 'Drafted. Unsigned.' },
        { name: 'Gold', note: 'Company pay for the hill gate.' },
      ],
    },
  });
}

export function demoDuje(): CharacterRecord {
  return living({
    slug: 'duje',
    name: 'Duje',
    kind: 'npc',
    communityTie: 'I run a boat after dark. I am not on the burgher list.',
    concept:
      'I move oil at night to the harbour across the bay. I owe Matteo my brother’s life, taken off a galley. I will not move children. I have not told Vito.',
    whoWeSee:
      'Boat-tar, no house-mark. People who need a hull after dark know which stair he uses.',
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
        { name: 'Boat', note: 'No house-mark.' },
        { name: 'Oil-jars', note: 'Two.' },
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

  const HOUSES = 'g-faction';
  const FOREIGN = 'g-foreign';
  const ESTATE = 'g-estate';
  upsertLabelGroup(community, { id: HOUSES, name: 'Noble Houses of Aspalath', kind: 'faction' });
  upsertLabelGroup(community, { id: FOREIGN, name: 'Foreign Influence', kind: 'faction' });
  upsertLabelGroup(community, { id: ESTATE, name: 'Estate loyalty', kind: 'faction' });
  upsertLabelGroup(community, { id: TAG_GROUP_ID, name: 'Tags', kind: 'tag' });

  const orvanti = upsertFactionLabel(community, 'House Orvanti', 38, HOUSES);
  const solari = upsertFactionLabel(community, 'House Solari', 12, HOUSES);
  const calvo = upsertFactionLabel(community, 'House Calvo', 48, HOUSES);
  const pelesa = upsertFactionLabel(community, 'Pelesa', 220, FOREIGN);
  const calvaro = upsertFactionLabel(community, 'Calvaro', 28, FOREIGN);
  const household = upsertFactionLabel(community, 'Ducal household', 0, ESTATE);
  const company = upsertFactionLabel(community, 'Free Company', 200, ESTATE);
  const cathedral = upsertFactionLabel(community, 'Cathedral', 50, ESTATE);
  const burghers = upsertFactionLabel(community, 'Burghers', 142, ESTATE);

  const tagNightRoll = upsertTagLabel(community, 'Night roll');
  const tagMill = upsertTagLabel(community, 'Mill boarded');
  const tagUnpaid = upsertTagLabel(community, 'Unpaid');
  const tagCharterHouse = upsertTagLabel(community, 'Charter house');
  const tagInnerStair = upsertTagLabel(community, 'Inner-stair keys');
  const tagBook = upsertTagLabel(community, 'Isotta’s Book');
  const tagUnburied = upsertTagLabel(community, 'Unburied');
  const tagBurgherList = upsertTagLabel(community, 'Burgher list');
  const tagLanding = upsertTagLabel(community, 'Landing-book');
  const tagCharter = upsertTagLabel(community, 'Calvaro charter');
  const tagMissing = upsertTagLabel(community, 'Missing brother');
  const tagDebt = upsertTagLabel(community, 'Brother’s life');

  tomaso.labelIds = [tagMill.id];
  jakov.labelIds = [company.id, tagCharterHouse.id, tagUnpaid.id, tagMissing.id];
  caterina.labelIds = [solari.id, tagNightRoll.id, tagInnerStair.id];
  niccolo.labelIds = [calvo.id, tagBook.id];
  marino.labelIds = [orvanti.id, household.id];
  orsa.labelIds = [solari.id, tagUnburied.id];
  lovro.labelIds = [cathedral.id, tagUnburied.id];
  piero.labelIds = [calvo.id, tagCharter.id];
  mara.labelIds = [burghers.id, tagNightRoll.id];
  vito.labelIds = [orvanti.id, household.id, tagNightRoll.id];
  paolo.labelIds = [household.id, tagNightRoll.id];
  agnese.labelIds = [burghers.id, tagBurgherList.id, tagBook.id];
  luca.labelIds = [pelesa.id, tagLanding.id];
  matteo.labelIds = [calvaro.id, tagCharter.id];
  duje.labelIds = [tagDebt.id];

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
