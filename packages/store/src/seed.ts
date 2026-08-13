import { randomUUID } from 'node:crypto';
import type { CharacterRecord, CommunityRecord } from './types.js';
import type { SqliteCommunityStore } from './sqlite.js';
import { emptyCommunity } from './sqlite.js';
import { refreshCharacterDerived } from './derived.js';

/**
 * Demo community: Guidebook campaign seed “Settlers on a broken shore”
 * (Campaign Setup — fully invented). Characters follow current worked examples
 * (Tomas the carpenter; capacity profile from Echoes/Foundations teaching case).
 */

/** Tomas — Dice Mechanics unopposed roll (Strength + Carpentry & Masonry). */
export function demoTomas(): CharacterRecord {
  const ch: CharacterRecord = {
    id: randomUUID(),
    slug: 'tomas',
    name: 'Tomas',
    kind: 'pc',
    status: 'active',
    communityTie:
      'Freeholder among the settlers on the burned river fields; owes labour on the grain store the kin still share.',
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
      { name: 'Negotiation', rating: 1, practice: 6, threshold: 24, foundation: 'Charisma' },
    ],
    traits: ['Steady hands'],
    exertion: { current: 4, max: 0 },
    echoes: [
      {
        title: 'Keep the shared grain store dry through the first winter',
        weight: 2,
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
    inventory: { foodDays: 2, waterDays: 3, named: ['Adze', 'Wool cloak', 'Pitch pot'] },
    flags: { decadence: false, overCapacity: false },
  };
  return refreshCharacterDerived(ch);
}

/**
 * Capacity teaching profile from Echoes (Guidebook numbers):
 * max(Strength 2, Dexterity 1) + Intellect 2 + Authority 2 = 6.
 * Exertion max = Resolve 2 + Constitution 2 + Charisma 1 = 5.
 * Placed in the settlers community (not a retired seed).
 */
export function demoCapacityProfile(name = 'Leif'): CharacterRecord {
  const ch: CharacterRecord = {
    id: randomUUID(),
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    kind: 'pc',
    status: 'active',
    communityTie:
      'Took part in the taking of this shore; holds a claim on the upper fields still black from last year’s fire.',
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
    skills: [{ name: 'Command', rating: 2, practice: 0, threshold: 48, foundation: 'Authority' }],
    traits: [],
    exertion: { current: 5, max: 0 },
    echoes: [
      { title: 'Hold the river ford until the hostages return', weight: 3 },
      { title: 'Pact with the marsh folk for seed grain', weight: 2 },
      { title: 'Mother’s knife under the floorboards', weight: 1 },
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
    hierarchy: [{ axis: 'Arms', tier: 'Acknowledged' }],
    armour: { kind: 'light', donned: true },
    inventory: { foodDays: 1, waterDays: 2, named: ['Spear', 'Shield'] },
    flags: { decadence: false, overCapacity: false },
  };
  return refreshCharacterDerived(ch);
}

/** @deprecated use demoTomas — kept as alias during rename */
export const demoEira = demoTomas;
/** @deprecated use demoCapacityProfile — kept as alias during rename */
export const demoLeif = () => demoCapacityProfile('Leif');

export function seedDemoCampaign(
  store: SqliteCommunityStore,
  slug = 'broken-shore',
  name = 'Settlers on the broken shore',
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
      title: 'The Shore Was Taken',
      summary:
        'The migratory kin helped pull down the river empire and mean to plant here — the first harvest will decide if this is a home.',
    },
  ];
  const tomas = demoTomas();
  const leif = demoCapacityProfile('Leif');
  community.placements = [
    { name: tomas.name, axis: 'Coin', tier: 'Acknowledged' },
    { name: tomas.name, axis: 'Arms', tier: 'Outcast' },
    { name: leif.name, axis: 'Arms', tier: 'Acknowledged' },
  ];
  store.putCommunity(community);
  store.putCharacter(tomas);
  store.putCharacter(leif);
  store.appendEvent({
    type: 'CampaignSeeded',
    payload: { slug, characterIds: [tomas.id, leif.id], seed: 'settlers-on-a-broken-shore' },
  });
  return { community, character: tomas };
}
