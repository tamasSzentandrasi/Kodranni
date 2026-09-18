import { randomUUID } from 'node:crypto';
import type { CharacterRecord, CommunityRecord, SkillProgress } from './types.js';
import type { CommunityStorePort } from './port.js';
import { emptyCommunity } from './sqlite.js';
import { refreshCharacterDerived } from './derived.js';
import { makeEcho } from './echo-effects.js';
import { upsertFactionLabel, upsertTagLabel } from './labels.js';

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
    communityTie:
      'Lazzaro Orvanti pulled him off a Pelesan rower-bench twelve years ago and set him to machines. Orsa Solari paid his mother’s burial when Lazzaro was in the field.',
    concept:
      'Twelve years ago Lazzaro Orvanti took Tomaso off a Pelesan galley the night the Free Company held the hill gate, and put him in the old mill behind that gate. The last order Lazzaro spoke to him was to finish a counterweight engine there — screws, timber, a mill-heart — so Aspalath could unload without waiting on Pelesan-rigged harbour practice. Lazzaro is dead. Household arms have boards stacked against the mill because Vito’s roll names it as a meeting place of Lazzaro’s men. Orsa paid Tomaso’s mother’s burial; she can call that in. He still sleeps in the mill.',
    whoWeSee:
      'Lime and oil in the seams of his hands. People looking for Lazzaro’s millwright still find him in the mill behind the hill gate, even with boards stacked outside.',
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
      { name: 'Galley scar', note: 'Ankle iron; he still walks as if the bench were behind him.' },
      { name: 'Reads a plan', note: 'A week in the cathedral school; Lovro still knows his hand.' },
    ],
    echoes: [
      makeEcho({
        title: 'Finish the counterweight engine in the mill behind the hill gate',
        weight: 2,
        invokeWhen:
          'When the roll is about the mill, the engine, boarding that mill, or whether Lazzaro’s last order still binds anyone.',
        note: 'Screws, timber, a mill-heart. Not steam. Household arms have boards stacked against the door.',
        groupLabel: 'Lazzaro’s mill',
        group: [
          { name: 'Tomaso Fero', characterSlug: 'tomaso' },
          { name: 'Orsa Solari', note: 'Wants the mill as Isotta’s due, not as Orvanti salvage.' },
          { name: 'Captain Vito', note: 'The night roll names the mill as Lazzaro’s meeting place.' },
        ],
      }),
      makeEcho({
        title: 'The harbour-side seam of the mill held last winter',
        weight: 1,
        invokeWhen: 'When the work is timber, masonry, or weather against that mill.',
        resolved: {
          narrative:
            'The harbour-side seam held through the first hard rain after Lazzaro ordered the work. People still say Tomaso’s name when they talk about the mill.',
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
        { name: 'Adze', note: 'Edge needs re-peening after the mill-lip.' },
        { name: 'Wool cloak', note: 'Dry; no spare for a second person.' },
        { name: 'Screw-jack', note: 'Lazzaro paid for it. Half the engine’s lift.' },
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
    communityTie:
      'Sleeps in the old Orsani warehouse under Lazzaro’s Charter. Lazzaro stood godfather to his daughter Mira, who sleeps there too.',
    concept:
      'Jakov came with the Company the year they held the hill gate. Lazzaro stood godfather to Mira; she is seven and knows no other roof. The Company is a season behind in pay. Jakov’s brother was on the hill gate the night the knife missed Marino and has not been seen since. Vito’s men have asked Jakov who took the knife. Luca Bandi has coin for their winter if they leave the harbour open to Pelesa. Matteo Rinaldi has coin if they hold the hill gate for Osvaldo Calvaro. Jakov has touched neither purse: taking either would sell the warehouse Mira sleeps in.',
    whoWeSee:
      'Company coat, unpaid. A girl of seven in the warehouse doorway behind him. He will not hang for a purse he did not take, and he will not sell the roof Lazzaro named for her.',
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
      { name: 'Godfather’s ring', note: 'Lazzaro’s, too big; Mira knows it on his hand.' },
      { name: 'Hill-gate watch', note: 'He still sleeps as if the gate were his.' },
    ],
    echoes: [
      makeEcho({
        title: 'Keep Mira under the warehouse roof Lazzaro named',
        weight: 2,
        invokeWhen:
          'When the roll is about the Charter house, Mira’s safety, Company pay, or whether that warehouse still belongs to the men who sleep in it.',
        groupLabel: 'Charter house',
        group: [
          { name: 'Jakov Bracco', characterSlug: 'jakov' },
          { name: 'Mira Bracco', note: 'Seven. Knows no other roof.' },
          { name: 'Luca Bandi', note: 'Winter pay if the harbour stays open to Pelesa.' },
          { name: 'Matteo Rinaldi', note: 'Charter pay if they hold the hill gate for Calvaro.' },
        ],
      }),
      makeEcho({
        title: 'Find his brother, who was on the hill gate the night of the knife',
        weight: 1,
        invokeWhen:
          'When the roll is about the missing Company man, the hill gate that night, or Vito asking who held the knife.',
        note: 'Vito has already blamed the warehouse. The brother has not been seen.',
      }),
      makeEcho({
        title: 'Hold the Company through a season without pay',
        weight: 2,
        invokeWhen:
          'When the roll is about Company loyalty, desertion, Luca’s winter, Matteo’s charter, or Vito naming the warehouse on the night roll.',
      }),
    ],
    hierarchy: [{ axis: 'Arms', tier: 'Acknowledged' }],
    armour: { kind: 'light', donned: true },
    exertionCurrent: 5,
    inventory: {
      foodDays: 1,
      waterDays: 2,
      items: [
        { name: 'Sword', note: 'Company issue; edge notched from the hill gate, twelve years back.' },
        { name: 'Shield', note: 'Rim split on one quarter; still holds a line.' },
        { name: 'Mira’s cloak', note: 'Cut down from Lazzaro’s old riding-cloak.' },
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
    communityTie:
      'Dressed Duchess Isotta Solari for twelve years. Two children, Niko and Lea, sleep on Mara Vela’s street. That street is on Vito’s night roll.',
    concept:
      'Caterina walked every inner stair of the palace as a servant and still does, because grief has not replaced the work. She hid Orsa’s cousin the morning after the knife, before the cousin left the city. She has heard Matteo’s charter in Piero’s warehouse, Luca’s winter offer in the Company house, Orsa’s price for the names from the inner stair, and Agnese’s burgher roll. Niko is nine and Lea is four. Paolo Cresti has already copied their street. Orsa named her before the cathedral chapter: bring the names of everyone who had a key to the inner stair that night, and Orsa would stand when Vito read the street. Caterina brought three names. Orsa stood. She has not yet chosen which of the other hearings to spend.',
    whoWeSee:
      'A palace servant’s dress, lower-town dust on the hem. People who want a door opened still ask her, and so do people who want a name.',
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
      { name: 'Inner-stair keys', note: 'She still has the set Isotta gave her. Vito does not know.' },
      { name: 'Two children', note: 'Niko nine, Lea four; they eat on Mara Vela’s street.' },
    ],
    echoes: [
      makeEcho({
        title: 'Keep Niko and Lea off the night roll’s taking',
        weight: 2,
        invokeWhen:
          'When the roll is about Mara Vela’s street, the night roll, her children, or whether a name on that list disappears from the pans.',
        groupLabel: 'Mara Vela’s street',
        group: [
          { name: 'Caterina Vela', characterSlug: 'caterina' },
          { name: 'Mara Vela', characterSlug: 'mara', note: 'The children sleep in her house.' },
          { name: 'Paolo Cresti', note: 'Already copied the street.' },
        ],
      }),
      makeEcho({
        title: 'Bring Orsa the names from the inner stair',
        weight: 1,
        invokeWhen: 'When the work is the inner stair, palace keys, or Orsa’s standing before Vito.',
        resolved: {
          narrative:
            'Caterina brought three names to the cathedral chapter. Orsa stood in front of Vito when Mara Vela’s street was read. The Storyteller approved Caterina’s climb on Blood. Faith and Arms did not move.',
          at: '2026-08-20',
        },
      }),
      makeEcho({
        title: 'Decide which hearing to spend',
        weight: 1,
        invokeWhen:
          'When the roll is about Matteo’s charter, Luca’s winter, Agnese’s burgher roll, or Orsa’s next asking — and Caterina has not yet given any of them the rest of what she heard.',
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
        { name: 'Isotta’s keys', note: 'Inner stair. Worn smooth.' },
        { name: 'Sleeve-knife', note: 'Not a soldier’s. For a door that should not open.' },
        { name: 'Lea’s ribbon', note: 'Solari blue; Isotta gave it.' },
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
    communityTie:
      'House Calvo. The warehouses that feed the lower town between presses. His name was written in the Pelesan register Isotta burned.',
    concept:
      'Niccolo was a boy when Isotta burned the Pelesan register in the cathedral yard. His name was in it: a Calvo cousin listed for rower-service, which House Calvo had also used to claim Pelesan convoy-protection on oil. He stood in the yard. He still believes Aspalath can refuse both Vito’s night roll and a client-king. Uncle Piero has a Pelesan buyer for a cargo still in Niccolo’s warehouse, and has listened to Matteo’s charter. Piero stood for Niccolo when the Company came for the warehouse keys after Lazzaro died. Niccolo has the coin to buy a landing. He has not spent it, and he has not signed Piero’s sale.',
    whoWeSee:
      'Calvo cloth, warehouse chalk on the cuffs. The lower town still eats from his stores. Piero is already talking to a Pelesan buyer behind his back.',
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
      { name: 'Name in the ash', note: 'He was in Isotta’s Book. He stood in the yard when it burned.' },
      { name: 'Warehouse keys', note: 'Piero stood for him when the Company came for them.' },
    ],
    echoes: [
      makeEcho({
        title: 'Keep the quarter eating from Calvo stores',
        weight: 2,
        invokeWhen:
          'When the roll is about the warehouses, the Pelesan buyer, a palace seizure, or who eats in the lower town if those stores move.',
        groupLabel: 'Calvo stores',
        group: [
          { name: 'Niccolo Calvo', characterSlug: 'niccolo' },
          { name: 'Piero Calvo', characterSlug: 'piero', note: 'Has a Pelesan buyer. Has listened to Matteo.' },
          { name: 'Mara Vela', note: 'The street eats from these stores between presses.' },
        ],
      }),
      makeEcho({
        title: 'His name was in Isotta’s Book',
        weight: 1,
        invokeWhen:
          'When the roll is about a list, a foreign claim on a Calvo name, Pelesan convoy-protection, or whether he will sell to Pelesa.',
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
        { name: 'Warehouse keys', note: 'Three locks. Piero has the fourth.' },
        { name: 'Landing-coin', note: 'Enough for a hull. Unspent.' },
        { name: 'Copy of the burned names', note: 'His own hand, from memory. Not the Pelesan instrument.' },
      ],
    },
  });
}

export function demoMarino(): CharacterRecord {
  return living({
    slug: 'marino',
    name: 'Marino Orvanti',
    kind: 'npc',
    communityTie: 'Duke of Aspalath. Husband of dead Isotta Solari. Brother of dead Lazzaro.',
    concept:
      'The knife was meant for him. It killed his wife and his brother. He lives. He cannot ride, and he cannot stand long. Orders that used to come from his mouth come from Captain Vito’s. He still sits the seat. He does not know who paid for the knife, and he has not named a successor. Orsa will not let him close Isotta’s death as a household accident. He is not Honoured on Blood; Orsa is.',
    whoWeSee:
      'A duke who sits. The wound in his side is dressed twice a day. People who used to wait on his word now wait on Vito’s, and he knows it.',
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
    traits: [
      { name: 'Opened side', note: 'The knife missed the heart and opened the ribs. He cannot ride.' },
    ],
    echoes: [
      makeEcho({
        title: 'Keep sitting the seat while Vito takes names in his hand',
        weight: 2,
        invokeWhen:
          'When the roll is about Marino’s word, Vito speaking in his name, or whether the city still has a duke who can be obeyed.',
      }),
      makeEcho({
        title: 'Learn who held the knife that was meant for him',
        weight: 2,
        invokeWhen:
          'When the roll is about the night, the inner stair, a missing Company man, a Solari cousin who left before dawn, or Luca’s unopened landing-book — not a scripted reveal.',
      }),
    ],
    hierarchy: [{ axis: 'Blood', tier: 'Acknowledged' }],
    harm: { Bleeding: 2, Shock: 1 },
    exertionCurrent: 3,
    inventory: {
      foodDays: 5,
      waterDays: 5,
      items: [
        { name: 'Ducal ring', note: 'Still on the hand that cannot hold a rein.' },
        { name: 'Lazzaro’s sword', note: 'Unworn. He cannot lift it long.' },
      ],
    },
  });
}

export function demoOrsa(): CharacterRecord {
  return living({
    slug: 'orsa',
    name: 'Orsa Solari',
    kind: 'npc',
    communityTie: 'Isotta Solari’s sister. Living Solari voice in Aspalath.',
    concept:
      'Orsa watched her sister marry Marino to bind Solari to the ducal seat, and watched that sister die on a night the knife was not even meant for her. She will not let Father Lovro bury Isotta as an Orvanti household accident. She wants Isotta in the ground as Solari, with Solari rites, and she wants to know whether Marino’s household let the knife through — or whether Marino was meant to be the one who lived. She paid Tomaso’s mother’s burial. She named Caterina before the chapter. A cousin of hers left the city before dawn; Caterina hid him first.',
    whoWeSee:
      'Solari black. She sleeps in the cathedral square with her men until Lovro names a rite she will accept. People who want Isotta buried as a duchess come to her, not to Marino.',
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
    traits: [{ name: 'Sister’s ring', note: 'Isotta’s marriage-band. She will not give it to Marino’s household.' }],
    echoes: [
      makeEcho({
        title: 'Bury Isotta as Solari, not as an Orvanti accident',
        weight: 2,
        invokeWhen:
          'When the roll is about the burial, the cathedral square, Lovro’s rite, or whether Isotta’s death is Solari grief or a household matter Marino can close.',
      }),
    ],
    hierarchy: [{ axis: 'Blood', tier: 'Honoured' }],
    exertionCurrent: 6,
    inventory: {
      foodDays: 3,
      waterDays: 3,
      items: [
        { name: 'Isotta’s marriage-band', note: 'Taken from the body before the household could.' },
        { name: 'Solari men in the square', note: 'They sleep there. They eat from her purse.' },
      ],
    },
  });
}

export function demoLovro(): CharacterRecord {
  return living({
    slug: 'lovro',
    name: 'Father Lovro',
    kind: 'npc',
    communityTie: 'Cathedral of Our Lady of the Harbour. Holds Isotta’s body and the door.',
    concept:
      'Lovro serves in Latin. Boat families bury in their own tongue; he has learned to stand at those burials without taking them. His predecessor argued against burning Isotta’s Book — a written claim, he said, should be kept in the vestry. Lovro did not. He will not bury Isotta until Orsa agrees the rite is Solari and the household agrees the death is not an accident they can close. Until then the body is behind the rood screen and Solari men sleep in the square.',
    whoWeSee:
      'Cathedral cloth, oil on the cuffs from the lamps by the rood screen. People who want a burial come to him. People who want the square cleared come to him too.',
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
    traits: [{ name: 'Rood-screen watch', note: 'He sleeps in the vestry while the body is unburied.' }],
    echoes: [
      makeEcho({
        title: 'Hold Isotta unburied until the rite can be named',
        weight: 2,
        invokeWhen:
          'When the roll is about the burial, the cathedral door, Orsa’s rite, or the household trying to close the death as an accident.',
      }),
    ],
    hierarchy: [{ axis: 'Faith', tier: 'Honoured' }],
    exertionCurrent: 5,
    inventory: {
      foodDays: 3,
      waterDays: 4,
      items: [
        { name: 'Vestry key', note: 'The body is behind the rood screen. He holds this.' },
        { name: 'Latin book of the dead', note: 'Isotta’s name is not in it yet.' },
      ],
    },
  });
}

export function demoPiero(): CharacterRecord {
  return living({
    slug: 'piero',
    name: 'Piero Calvo',
    kind: 'npc',
    communityTie: 'House Calvo. Niccolo’s uncle. Stores that feed the lower town.',
    concept:
      'Piero wanted Isotta’s Book kept in a chest: the names in it were also a claim to Pelesan convoy-protection on Calvo oil. The book is ash. He has a Pelesan buyer for a cargo still in Niccolo’s warehouse, and he has sat with Matteo Rinaldi over Osvaldo Calvaro’s drafted charter. He stood for Niccolo when the Company came for the warehouse keys after Lazzaro died. He will name Niccolo heir if Niccolo sells; he will not if Niccolo holds the stores for the quarter. He has not yet forced the sale.',
    whoWeSee:
      'Warehouse chalk and a Pelesan ring he has not taken off. The quarter still eats from his stores. He is already talking to the buyer.',
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
    traits: [{ name: 'Pelesan ring', note: 'Convoy-protection, from before the Book burned. He still wears it.' }],
    echoes: [
      makeEcho({
        title: 'Sell the cargo or keep the heir',
        weight: 2,
        invokeWhen:
          'When the roll is about the Pelesan buyer, Matteo’s charter, Niccolo’s warehouse keys, or whether Piero forces a sale.',
      }),
    ],
    hierarchy: [{ axis: 'Coin', tier: 'Honoured' }],
    exertionCurrent: 5,
    inventory: {
      foodDays: 6,
      waterDays: 6,
      items: [
        { name: 'Fourth warehouse key', note: 'Niccolo has three. This one opens the Pelesan buyer’s cargo.' },
        { name: 'Draft of Matteo’s charter', note: 'Copied in his hand. Not signed.' },
      ],
    },
  });
}

export function demoMara(): CharacterRecord {
  return living({
    slug: 'mara',
    name: 'Mara Vela',
    kind: 'npc',
    communityTie: 'Lower town. Caterina’s father’s sister. The children sleep in her house.',
    concept:
      'Mara keeps a house on a street the pans can smell. Niko and Lea sleep there because Caterina walks the palace at night. Paolo Cresti has copied the street onto Vito’s night roll. Three neighbours whose names had been on that list a week have not been seen at the pans. Mara still feeds whoever comes to the door from Calvo stores, which she buys on credit Niccolo has not called in. She will hide a child. She will not hide a man Vito has already named, not twice.',
    whoWeSee:
      'Press-oil on her sleeves. Two children in the doorway who are not hers. The street already knows it is on the roll.',
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
    traits: [{ name: 'Open door', note: 'The street eats here. She knows who has not come back.' }],
    echoes: [
      makeEcho({
        title: 'Keep the street’s children eating and unseen by the taking',
        weight: 2,
        invokeWhen:
          'When the roll is about Mara Vela’s street, the night roll, the children, or the three empty places at the pans.',
      }),
    ],
    hierarchy: [{ axis: 'Blood', tier: 'Acknowledged' }],
    exertionCurrent: 6,
    inventory: {
      foodDays: 3,
      waterDays: 3,
      items: [
        { name: 'Calvo credit-stick', note: 'Niccolo has not called it in.' },
        { name: 'Street latch', note: 'She knows which neighbours still answer it.' },
      ],
    },
  });
}

export function demoVito(): CharacterRecord {
  return living({
    slug: 'vito',
    name: 'Vito Cresti',
    kind: 'npc',
    communityTie: 'Captain of Duke Marino’s household arms. Paolo Cresti is his brother and copies the night roll.',
    concept:
      'Marino named the household to Vito because Marino cannot ride. Vito takes names at night. He believes the knife came from the Company warehouse or from Solari grief, and he has already written both onto the roll. He has asked Jakov who took the knife. He has boards stacked at Tomaso’s mill because Lazzaro’s men drank there. He is not a second duke. People in the lower town already obey the night roll who would not have obeyed Marino last month, and Vito knows that is how a household becomes the city.',
    whoWeSee:
      'Household coat, a roll-case at the belt. People step aside in the lanes after dark. Paolo is often a step behind him with the copy.',
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
    traits: [{ name: 'Night-roll case', note: 'Streets, not ranks. Paolo copies; Vito names.' }],
    echoes: [
      makeEcho({
        title: 'Keep the night roll as the household’s way of naming enemies',
        weight: 2,
        invokeWhen:
          'When the roll is about the night roll, a named street, boarding the mill, blaming the Company, or speaking in Marino’s name.',
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
        { name: 'Night-roll case', note: 'Mara Vela’s street is already in it.' },
        { name: 'Household sword', note: 'Marino’s arms, not the Company’s.' },
      ],
    },
  });
}

export function demoPaolo(): CharacterRecord {
  return living({
    slug: 'paolo',
    name: 'Paolo Cresti',
    kind: 'npc',
    communityTie: 'Vito’s brother. Copies streets onto the night roll. Eats from Vito’s table.',
    concept:
      'Paolo learned his letters at the cathedral door, the same week Tomaso did. Lovro still knows both hands. Vito gave him the work of copying because Vito cannot be in every lane. Paolo has already copied Mara Vela’s street. He knows the three names that have not been seen at the pans, and he has not told Caterina, and he has not told Mara. He eats well. He sleeps badly. He will copy the next street Vito names.',
    whoWeSee:
      'Ink on the first two fingers. A copy-case. People on a street that has been copied do not meet his eye.',
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
    traits: [{ name: 'Copy-hand', note: 'Cathedral-school letters. Lovro knows it. So does Tomaso.' }],
    echoes: [
      makeEcho({
        title: 'Copy the next street Vito names',
        weight: 2,
        invokeWhen:
          'When the roll is about the night-roll copy, Mara Vela’s street, the three missing pans-hands, or whether Paolo tells someone what he has written.',
      }),
    ],
    hierarchy: [{ axis: 'Arms', tier: 'Acknowledged' }],
    exertionCurrent: 4,
    inventory: {
      foodDays: 4,
      waterDays: 4,
      items: [
        { name: 'Night-roll copy', note: 'Mara Vela’s street is on it. Three names marked gone.' },
        { name: 'Ink horn', note: 'Cathedral door, same week as Tomaso’s.' },
      ],
    },
  });
}

export function demoAgnese(): CharacterRecord {
  return living({
    slug: 'agnese',
    name: 'Agnese Orsani',
    kind: 'npc',
    communityTie: 'Old Orsani house. Holds the burgher roll from when Aspalath named a count.',
    concept:
      'Agnese stood in the cathedral yard when Isotta burned the Pelesan register. She still holds the burgher roll: the families who once named a count, including Orsani, Solari cousins, and Calvo names that were also in the burned book. The Company’s warehouse was Orsani before Lazzaro signed it away. She will read the roll in the square if the household keeps naming streets instead of finding who put the knife in. That reading would put the old houses back into the naming of ships, and take it out of Vito’s hand.',
    whoWeSee:
      'An old-house dress and a roll under her arm that is not Vito’s. People who remember electing a count still come to her door.',
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
    traits: [{ name: 'Burgher roll', note: 'From when this city named a count. Not Vito’s night roll.' }],
    echoes: [
      makeEcho({
        title: 'Read the burgher roll in the square if the household names streets instead of a knife',
        weight: 2,
        invokeWhen:
          'When the roll is about the old naming of a count, the burgher roll, the Company’s warehouse as stolen Orsani ground, or a public reading in the square.',
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
        { name: 'Burgher roll', note: 'Families who once named a count. Calvo names are in it.' },
        { name: 'Orsani warehouse deed', note: 'Voided by Lazzaro’s Charter. She still has the older copy.' },
      ],
    },
  });
}

export function demoLuca(): CharacterRecord {
  return living({
    slug: 'luca',
    name: 'Luca Bandi',
    kind: 'npc',
    communityTie: 'Consul for Pelesa. Rents a house inside the walls. Not of Aspalath.',
    concept:
      'Pelesa did not send a peace-envoy after Isotta burned the register. Luca is not a peace-envoy. He is here to buy the Company’s winter so Aspalath cannot close the harbour against Pelesan hulls, and to keep Calvo oil moving under the convoy-protection the burned book used to prove. He has a landing-book he has not opened in front of anyone. He and Matteo Rinaldi want opposite things. He knows Mira sleeps in the warehouse he is trying to buy.',
    whoWeSee:
      'Pelesan cloth in a rented house. Coin enough for a Company’s winter. Hulls at first light across the bay are his argument.',
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
    traits: [{ name: 'Unopened landing-book', note: 'He has not shown it. Three people have asked.' }],
    echoes: [
      makeEcho({
        title: 'Buy the Company’s winter so the harbour stays open to Pelesa',
        weight: 2,
        invokeWhen:
          'When the roll is about Company pay, the harbour, Pelesan hulls, the landing-book, or whether Jakov takes the purse.',
      }),
    ],
    hierarchy: [],
    exertionCurrent: 5,
    inventory: {
      foodDays: 5,
      waterDays: 5,
      items: [
        { name: 'Winter-pay chest', note: 'Enough for the Company. Unopened in the rented house.' },
        { name: 'Landing-book', note: 'Unopened in front of anyone in Aspalath.' },
      ],
    },
  });
}

export function demoMatteo(): CharacterRecord {
  return living({
    slug: 'matteo',
    name: 'Matteo Rinaldi',
    kind: 'npc',
    communityTie: 'Osvaldo Calvaro’s man in Aspalath. Rents a house. Not of Aspalath.',
    concept:
      'Osvaldo Calvaro holds a hinterland realm by fear and by showing up. He wants Aspalath as a client harbour to choke Pelesa. Matteo has a charter already drafted in Osvaldo’s name, patience, and gold. He sat with Piero. He put a purse in a Solari groom’s hand before dawn — Caterina saw it, or someone she hears did. He will pay the Company to hold the hill gate. He does not need Marino dead; he needs Marino client. He and Luca want opposite things.',
    whoWeSee:
      'Hinterland cloth, Calvaro seal-wax. He does not hurry. People who have already listened to him do not say so in the square.',
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
    traits: [{ name: 'Drafted charter', note: 'Osvaldo Calvaro’s name. Piero has a copy. Unsigned.' }],
    echoes: [
      makeEcho({
        title: 'Make Aspalath a client harbour in Osvaldo Calvaro’s name',
        weight: 2,
        invokeWhen:
          'When the roll is about the charter, Piero listening, Company pay for the hill gate, or a purse in a Solari groom’s hand.',
      }),
    ],
    hierarchy: [],
    exertionCurrent: 5,
    inventory: {
      foodDays: 5,
      waterDays: 5,
      items: [
        { name: 'Calvaro charter', note: 'Drafted. Seal-wax. Unsigned.' },
        { name: 'Gold for the hill gate', note: 'Company pay, if Jakov will take it.' },
      ],
    },
  });
}

export function demoDuje(): CharacterRecord {
  return living({
    slug: 'duje',
    name: 'Duje',
    kind: 'npc',
    communityTie: 'Night cargo between Aspalath and the harbour across the bay. Not of the burgher roll.',
    concept:
      'Duje buys oil after dark for the harbour across the bay, where Pelesan hulls can load without Vito’s roll and without Calvo keys. He owes Matteo the life of his brother, taken off a Pelesan bench — not coin. He will move a cargo Piero cannot sell in daylight. He will not move children. Caterina has used his boat once. He has not told Vito.',
    whoWeSee:
      'Boat-tar, no house-mark. People who need a hull after dark know which stair he uses. Paolo has not copied that stair yet.',
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
    traits: [{ name: 'Brother’s debt', note: 'Matteo took the brother off a Pelesan bench. Duje has not paid in coin.' }],
    echoes: [
      makeEcho({
        title: 'Move oil after dark without telling Vito',
        weight: 1,
        invokeWhen:
          'When the roll is about night cargo, the harbour across the bay, Piero’s unsellable cargo, or Matteo calling in a brother’s life.',
      }),
    ],
    hierarchy: [],
    exertionCurrent: 4,
    inventory: {
      foodDays: 2,
      waterDays: 4,
      items: [
        { name: 'Night boat', note: 'No house-mark. Stair below the pans.' },
        { name: 'Oil-jars', note: 'Calvo press, not Calvo keys.' },
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

  const orvanti = upsertFactionLabel(community, 'House Orvanti', 38);
  const solari = upsertFactionLabel(community, 'House Solari', 12);
  const calvo = upsertFactionLabel(community, 'House Calvo', 48);
  const household = upsertFactionLabel(community, 'Household arms', 0);
  const company = upsertFactionLabel(community, 'Free Company', 200);
  const burghers = upsertFactionLabel(community, 'Burgher roll', 142);
  const pelesa = upsertFactionLabel(community, 'Pelesa', 220);
  const calvaro = upsertFactionLabel(community, 'Calvaro', 28);
  const cathedral = upsertFactionLabel(community, 'Cathedral', 50);

  const tagMillOrder = upsertTagLabel(
    community,
    'Lazzaro’s last order: finish the mill behind the hill gate',
  );
  const tagBurial = upsertTagLabel(community, 'Orsa paid his mother’s burial');
  const tagMillRoll = upsertTagLabel(community, 'Mill on Vito’s night roll as Lazzaro’s meeting place');
  const tagGodfather = upsertTagLabel(community, 'Lazzaro stood godfather to his daughter Mira');
  const tagBrother = upsertTagLabel(community, 'Brother missing from the hill gate the night of the knife');
  const tagUntaken = upsertTagLabel(community, 'Has not taken Luca’s winter or Matteo’s charter');
  const tagChildren = upsertTagLabel(community, 'Two children on Mara Vela’s street');
  const tagNightRoll = upsertTagLabel(community, 'Vito has her children’s names on the night roll');
  const tagHidCousin = upsertTagLabel(community, 'Hid Orsa’s cousin the morning after the knife');
  const tagBookName = upsertTagLabel(community, 'His name was in Isotta’s Book');
  const tagPieroStood = upsertTagLabel(
    community,
    'Piero stood for him when the Company came for the warehouse keys',
  );
  const tagWounded = upsertTagLabel(community, 'Wounded the night the knife missed');
  const tagBody = upsertTagLabel(community, 'Holds Isotta’s body behind the rood screen');
  const tagCopy = upsertTagLabel(community, 'Copies Mara Vela’s street onto the night roll');
  const tagBurgher = upsertTagLabel(community, 'Holds the burgher roll from when the city named a count');
  const tagYard = upsertTagLabel(community, 'Stood in the yard when Isotta burned the book');
  const tagLanding = upsertTagLabel(community, 'Landing-book not opened in front of anyone');
  const tagCharter = upsertTagLabel(community, 'Charter already drafted in Osvaldo Calvaro’s name');
  const tagPurse = upsertTagLabel(community, 'Put a purse in a Solari groom’s hand before dawn');
  const tagNightOil = upsertTagLabel(community, 'Buys oil after dark for the harbour across the bay');
  const tagBrotherLife = upsertTagLabel(community, 'Owes Matteo the life of his brother, taken off a Pelesan bench');

  tomaso.labelIds = [tagMillOrder.id, tagBurial.id, tagMillRoll.id];
  jakov.labelIds = [company.id, tagGodfather.id, tagBrother.id, tagUntaken.id];
  caterina.labelIds = [solari.id, tagChildren.id, tagNightRoll.id, tagHidCousin.id];
  niccolo.labelIds = [calvo.id, tagBookName.id, tagPieroStood.id];
  marino.labelIds = [orvanti.id, household.id, tagWounded.id];
  orsa.labelIds = [solari.id];
  lovro.labelIds = [cathedral.id, tagBody.id];
  piero.labelIds = [calvo.id, tagCharter.id];
  mara.labelIds = [tagChildren.id, tagNightRoll.id];
  vito.labelIds = [household.id, orvanti.id];
  paolo.labelIds = [household.id, tagCopy.id];
  agnese.labelIds = [burghers.id, tagBurgher.id, tagYard.id];
  luca.labelIds = [pelesa.id, tagLanding.id];
  matteo.labelIds = [calvaro.id, tagCharter.id, tagPurse.id];
  duje.labelIds = [tagNightOil.id, tagBrotherLife.id];

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
