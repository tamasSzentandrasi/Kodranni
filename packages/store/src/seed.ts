import { randomUUID } from 'node:crypto';
import type { CharacterRecord, CommunityRecord } from './types.js';
import type { SqliteCommunityStore } from './sqlite.js';
import { emptyCommunity } from './sqlite.js';
import { refreshCharacterDerived } from './derived.js';

/** Demo character matching campaign-ui fixture (Eira). */
export function demoEira(): CharacterRecord {
  const ch: CharacterRecord = {
    id: randomUUID(),
    slug: 'eira',
    name: 'Eira',
    kind: 'pc',
    status: 'active',
    communityTie: 'Shipwright to the mill families; debt of timber still unpaid.',
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
      { name: 'Shipwright', rating: 2, practice: 12, threshold: 48, foundation: 'Strength' },
      { name: 'Negotiation', rating: 1, practice: 6, threshold: 24, foundation: 'Charisma' },
    ],
    traits: ['Steady hands'],
    exertion: { current: 4, max: 0 },
    echoes: [{ title: 'Hold the spring against the upper tribe', weight: 2 }],
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
    inventory: { foodDays: 2, waterDays: 3, named: ['Caulking iron', 'Wool cloak'] },
    flags: { decadence: false, overCapacity: false },
  };
  return refreshCharacterDerived(ch);
}

/** Leif — Guidebook Echo capacity example: max(2,1)+2+2 = 6. */
export function demoLeif(): CharacterRecord {
  const ch: CharacterRecord = {
    id: randomUUID(),
    slug: 'leif',
    name: 'Leif',
    kind: 'pc',
    status: 'active',
    communityTie: 'Owes the hall for the spring raid winter-stores.',
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
      { title: 'Hold the spring against the upper tribe', weight: 3 },
      { title: 'The yard pact with the mill brothers', weight: 2 },
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

export function seedDemoCampaign(
  store: SqliteCommunityStore,
  slug: string,
  name: string,
): { community: CommunityRecord; character: CharacterRecord } {
  const community = emptyCommunity(slug, name);
  community.fortunes = {
    vitality: 1,
    cohesion: 2,
    surplus: 1,
    standing: 2,
    tradition: 2,
  };
  community.myths = [
    {
      title: 'The Spring Held',
      summary: 'When the upper tribe pressed the only reliable spring, the hill held.',
    },
  ];
  const character = demoEira();
  const leif = demoLeif();
  community.placements = [
    { name: character.name, axis: 'Coin', tier: 'Acknowledged' },
    { name: character.name, axis: 'Arms', tier: 'Outcast' },
    { name: leif.name, axis: 'Arms', tier: 'Acknowledged' },
  ];
  store.putCommunity(community);
  store.putCharacter(character);
  store.putCharacter(leif);
  store.appendEvent({
    type: 'CampaignSeeded',
    payload: { slug, characterIds: [character.id, leif.id] },
  });
  return { community, character };
}
