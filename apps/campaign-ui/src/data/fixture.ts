/** Fixture SoT projection for campaign-ui development (no live store wired yet). */

export interface FixtureCharacter {
  slug: string;
  name: string;
  status: 'active' | 'dead';
  communityTie: string;
  foundations: Record<string, number>;
  foundationsEffective: Record<string, number>;
  skills: { name: string; rating: number; practice: number; threshold: number }[];
  traits: string[];
  exertion: { current: number; max: number };
  echoes: { title: string; weight: number }[];
  harm: Record<string, number>;
  dying: boolean;
  hierarchy: { axis: string; tier: string }[];
  armour: { kind: 'none' | 'light' | 'heavy'; donned: boolean };
  inventory: { foodDays: number; waterDays: number; named: string[] };
  flags: { decadence: boolean; overCapacity: boolean };
}

export interface FixtureCommunity {
  slug: string;
  name: string;
  generatedAt: string;
  fortunes: Record<string, number>;
  myths: { title: string; summary: string }[];
  hierarchyAxes: string[];
  ruler: string | null;
  placements: { name: string; axis: string; tier: string }[];
  characters: FixtureCharacter[];
}

export const fixtureCommunity: FixtureCommunity = {
  slug: 'ash-hill',
  name: 'The Ash-Hill People',
  generatedAt: new Date().toISOString(),
  fortunes: {
    vitality: 1,
    cohesion: 2,
    surplus: 1,
    standing: 2,
    tradition: 2,
  },
  myths: [
    {
      title: 'The Spring Held',
      summary: 'When the upper tribe pressed the only reliable spring, the hill held.',
    },
  ],
  hierarchyAxes: ['Arms', 'Faith', 'Coin', 'Blood'],
  ruler: null,
  placements: [
    { name: 'Eira', axis: 'Coin', tier: 'Acknowledged' },
    { name: 'Eira', axis: 'Arms', tier: 'Outcast' },
  ],
  characters: [
    {
      slug: 'eira',
      name: 'Eira',
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
        { name: 'Shipwright', rating: 2, practice: 12, threshold: 48 },
        { name: 'Negotiation', rating: 1, practice: 6, threshold: 24 },
      ],
      traits: ['Steady hands'],
      exertion: { current: 4, max: 6 },
      echoes: [{ title: 'Hold the spring against the upper tribe', weight: 2 }],
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
    },
  ],
};

export function getCharacter(slug: string): FixtureCharacter | undefined {
  return fixtureCommunity.characters.find((c) => c.slug === slug);
}
