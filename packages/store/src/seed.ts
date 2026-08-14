import { randomUUID } from 'node:crypto';
import type { CharacterRecord, CommunityRecord } from './types.js';
import type { CommunityStorePort } from './port.js';
import { emptyCommunity } from './sqlite.js';
import { refreshCharacterDerived } from './derived.js';

/** Demo identity: Guidebook seed “The Vardmark at Kelarn’s Bend”. */
export const DEMO_SEED_ID = 'vardmark-kelarns-bend';
export const DEMO_SLUG = 'vardmark';
export const DEMO_NAME = 'The Vardmark at Kelarn’s Bend';

/** Tomas — Dice Mechanics carpenter example, placed in the Vardmark. */
export function demoTomas(): CharacterRecord {
  const ch: CharacterRecord = {
    id: randomUUID(),
    slug: 'tomas',
    name: 'Tomas',
    kind: 'pc',
    status: 'active',
    communityTie:
      'Vardmark freeholder at Kelarn’s Bend; keeps the shared grain store the kin still use.',
    whoWeSee: 'A quiet man who measures twice and keeps his word when timber is scarce.',
    player: {
      platform: 'local',
      displayName: 'Player (Tomas)',
      accountId: 'local-tomas',
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
      {
        name: 'Carpentry & Masonry',
        rating: 2,
        practice: 12,
        threshold: 48,
        foundation: 'Strength',
      },
      { name: 'Negotiation', rating: 1, practice: 6, threshold: 24, foundation: 'Authority' },
      { name: 'Handcrafting', rating: 1, practice: 4, threshold: 24, foundation: 'Dexterity' },
    ],
    traits: [
      { name: 'Steady hands', note: 'Fine work under haste does not shake him easily.' },
    ],
    exertion: { current: 4, max: 0 },
    echoes: [
      {
        title: 'Keep the shared grain store dry through the first winter',
        weight: 2,
        note: 'The leak he patched is still the proof.',
      },
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
        { name: 'Adze', note: 'House timber; edge needs re-peening after the store roof.' },
        { name: 'Wool cloak', note: 'Dry; no spare for a second person.' },
        { name: 'Pitch pot', note: 'Half-full; enough for one more seam on the store.' },
      ],
    },
    flags: { decadence: false, overCapacity: false },
  };
  return refreshCharacterDerived(ch);
}

/** Guidebook capacity profile (Echoes teaching numbers). */
export function demoCapacityProfile(name = 'Leif'): CharacterRecord {
  const ch: CharacterRecord = {
    id: randomUUID(),
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    kind: 'pc',
    status: 'active',
    communityTie:
      'Took part in the taking of Kelarn’s Bend; holds a claim on the upper fields still black from last year’s fire.',
    whoWeSee: 'A hard bargainer who still answers when the ford is threatened.',
    player: {
      platform: 'discord',
      displayName: 'Player (Leif)',
      accountId: 'demo-discord-leif',
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
      { name: 'Command', rating: 2, practice: 0, threshold: 48, foundation: 'Authority' },
      { name: 'Tactics', rating: 1, practice: 10, threshold: 24, foundation: 'Intellect' },
      { name: 'Intimidate', rating: 1, practice: 3, threshold: 24, foundation: 'Authority' },
    ],
    traits: [{ name: 'Scarred knuckles', note: 'From the taking of the shore — not from sport.' }],
    exertion: { current: 5, max: 0 },
    echoes: [
      { title: 'Hold Kelarn’s Bend ford until the hostages return', weight: 3 },
      { title: 'Pact with the reed-marsh folk for seed grain', weight: 2 },
      { title: 'Mother’s knife under the floorboards', weight: 1 },
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

export const demoEira = demoTomas;
export const demoLeif = () => demoCapacityProfile('Leif');

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
  community.myths = [
    {
      title: 'Kelarn’s Fall',
      summary: 'The Vardmark helped pull down the river empire and mean to plant at the Bend.',
      effects: [
        {
          kind: 'practice_mod',
          label: '+Practice on Farming on claimed Bend fields',
          detail: 'When Myth is tagged on rolls working the burned fields.',
          amount: 1,
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
      summary: 'Seed grain bought from the marsh folk after the taking.',
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
  const tomas = demoTomas();
  const leif = demoCapacityProfile('Leif');
  community.placements = [
    { name: tomas.name, axis: 'Coin', tier: 'Acknowledged', characterSlug: tomas.slug },
    { name: leif.name, axis: 'Arms', tier: 'Acknowledged', characterSlug: leif.slug },
    { name: 'Halla', axis: 'Coin', tier: 'Trusted' },
    { name: 'Halla', axis: 'Blood', tier: 'Acknowledged' },
    { name: 'Old Rurik', axis: 'Faith', tier: 'Honoured' },
    { name: 'Young Sten', axis: 'Arms', tier: 'Trusted' },
  ];
  community.outsiders = [
    {
      name: 'Reed-marsh traders',
      note: 'Quiet people who measure grain twice and will not fight free for the Bend.',
    },
    {
      name: 'War-band on the next bend',
      note: 'Same campaign as the Vardmark; staking claims before the harvest.',
    },
  ];
  community.ruler = null;

  store.putCommunity(community);
  store.putCharacter(tomas);
  store.putCharacter(leif);
  store.appendEvent({
    type: 'CampaignSeeded',
    payload: { slug, seed: DEMO_SEED_ID },
  });
  return { community, character: tomas };
}
