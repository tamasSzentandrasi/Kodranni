/** Full Skill list by Archetype — Guidebook authority. */

export type ArchetypeId =
  | 'warrior'
  | 'wayfarer'
  | 'artisan'
  | 'mother'
  | 'sage'
  | 'trickster';

export interface SkillDef {
  name: string;
  foundation: string;
  archetype: ArchetypeId;
}

export interface ArchetypeDef {
  id: ArchetypeId;
  name: string;
  tag: string;
  skills: SkillDef[];
}

export const ARCHETYPES: ArchetypeDef[] = [
  {
    id: 'warrior',
    name: 'Warrior',
    tag: 'Combat and armed threat',
    skills: [
      { name: 'Slash', foundation: 'Strength', archetype: 'warrior' },
      { name: 'Pierce', foundation: 'Dexterity', archetype: 'warrior' },
      { name: 'Bash', foundation: 'Strength', archetype: 'warrior' },
      { name: 'Unarmed', foundation: 'Strength', archetype: 'warrior' },
      { name: 'Intimidate', foundation: 'Authority', archetype: 'warrior' },
      { name: 'Deflection', foundation: 'Resolve', archetype: 'warrior' },
      { name: 'Counter', foundation: 'Resolve', archetype: 'warrior' },
      { name: 'Command', foundation: 'Authority', archetype: 'warrior' },
      { name: 'Tactics', foundation: 'Intellect', archetype: 'warrior' },
      { name: 'Footwork', foundation: 'Dexterity', archetype: 'warrior' },
      { name: 'Combat Awareness', foundation: 'Perception', archetype: 'warrior' },
      { name: 'Thrown', foundation: 'Constitution', archetype: 'warrior' },
    ],
  },
  {
    id: 'wayfarer',
    name: 'Wayfarer',
    tag: 'Travel and the outdoors',
    skills: [
      { name: 'Scouting', foundation: 'Perception', archetype: 'wayfarer' },
      { name: 'Trapping & Tracking', foundation: 'Perception', archetype: 'wayfarer' },
      { name: 'Foraging & Fishing', foundation: 'Constitution', archetype: 'wayfarer' },
      { name: 'Archery', foundation: 'Perception', archetype: 'wayfarer' },
      { name: 'Sailing & Navigation', foundation: 'Perception', archetype: 'wayfarer' },
      { name: 'Animal Handling', foundation: 'Resolve', archetype: 'wayfarer' },
      { name: 'Dodge', foundation: 'Dexterity', archetype: 'wayfarer' },
      { name: 'Riding', foundation: 'Authority', archetype: 'wayfarer' },
      { name: 'Ambush & Camouflage', foundation: 'Guile', archetype: 'wayfarer' },
      { name: 'Swimming', foundation: 'Constitution', archetype: 'wayfarer' },
      { name: 'Wilderness', foundation: 'Constitution', archetype: 'wayfarer' },
      { name: 'Tradecraft', foundation: 'Charisma', archetype: 'wayfarer' },
    ],
  },
  {
    id: 'artisan',
    name: 'Artisan',
    tag: 'Craft and construction',
    skills: [
      { name: 'Tailoring & Armory', foundation: 'Constitution', archetype: 'artisan' },
      { name: 'Smithing & Forging', foundation: 'Strength', archetype: 'artisan' },
      { name: 'Carpentry & Masonry', foundation: 'Strength', archetype: 'artisan' },
      { name: 'Brewing', foundation: 'Constitution', archetype: 'artisan' },
      { name: 'Fine Crafts', foundation: 'Dexterity', archetype: 'artisan' },
      { name: 'Shipwright', foundation: 'Strength', archetype: 'artisan' },
      { name: 'Engineering & Design', foundation: 'Intellect', archetype: 'artisan' },
      { name: 'Bowyer & Fletcher', foundation: 'Constitution', archetype: 'artisan' },
      { name: 'Appraisal', foundation: 'Perception', archetype: 'artisan' },
      { name: 'Handcrafting', foundation: 'Dexterity', archetype: 'artisan' },
      { name: 'Oversight', foundation: 'Authority', archetype: 'artisan' },
      { name: 'Tinkering & Repair', foundation: 'Constitution', archetype: 'artisan' },
    ],
  },
  {
    id: 'mother',
    name: 'Mother',
    tag: 'Household and care',
    skills: [
      { name: 'Cooking & Preserving', foundation: 'Resolve', archetype: 'mother' },
      { name: 'Herbalism', foundation: 'Intellect', archetype: 'mother' },
      { name: 'Childcare', foundation: 'Resolve', archetype: 'mother' },
      { name: 'Animal Husbandry', foundation: 'Resolve', archetype: 'mother' },
      { name: 'Farming', foundation: 'Strength', archetype: 'mother' },
      { name: 'Empathy', foundation: 'Charisma', archetype: 'mother' },
      { name: 'Performance', foundation: 'Charisma', archetype: 'mother' },
      { name: 'Healing', foundation: 'Resolve', archetype: 'mother' },
      { name: 'Etiquette', foundation: 'Resolve', archetype: 'mother' },
      { name: 'Seduction', foundation: 'Charisma', archetype: 'mother' },
      { name: 'Influence', foundation: 'Authority', archetype: 'mother' },
      { name: 'Muse', foundation: 'Authority', archetype: 'mother' },
    ],
  },
  {
    id: 'sage',
    name: 'Sage',
    tag: 'Learning and counsel',
    skills: [
      { name: 'Debate & Rhetoric', foundation: 'Charisma', archetype: 'sage' },
      { name: 'Arithmetic & Accounting', foundation: 'Intellect', archetype: 'sage' },
      { name: 'Investigation', foundation: 'Perception', archetype: 'sage' },
      { name: 'Folklore & Heraldry', foundation: 'Intellect', archetype: 'sage' },
      { name: 'Cartography', foundation: 'Intellect', archetype: 'sage' },
      { name: 'Mentoring', foundation: 'Charisma', archetype: 'sage' },
      { name: 'Illustration', foundation: 'Intellect', archetype: 'sage' },
      { name: 'Negotiation', foundation: 'Authority', archetype: 'sage' },
      { name: 'Insight', foundation: 'Perception', archetype: 'sage' },
      { name: 'Strategy', foundation: 'Intellect', archetype: 'sage' },
      { name: 'Ritual', foundation: 'Authority', archetype: 'sage' },
      { name: 'Preaching', foundation: 'Charisma', archetype: 'sage' },
    ],
  },
  {
    id: 'trickster',
    name: 'Trickster',
    tag: 'Secrecy and deceit',
    skills: [
      { name: 'Lockpicking', foundation: 'Guile', archetype: 'trickster' },
      { name: 'Pickpocket', foundation: 'Guile', archetype: 'trickster' },
      { name: 'Sneak', foundation: 'Dexterity', archetype: 'trickster' },
      { name: 'Forgery', foundation: 'Guile', archetype: 'trickster' },
      { name: 'Slander & Ridicule', foundation: 'Charisma', archetype: 'trickster' },
      { name: 'Smuggling', foundation: 'Guile', archetype: 'trickster' },
      { name: 'Deception', foundation: 'Guile', archetype: 'trickster' },
      { name: 'Streetwise', foundation: 'Guile', archetype: 'trickster' },
      { name: 'Acrobatics', foundation: 'Dexterity', archetype: 'trickster' },
      { name: 'Sleight of Hand', foundation: 'Guile', archetype: 'trickster' },
      { name: 'Off-hand & Improvised Combat', foundation: 'Dexterity', archetype: 'trickster' },
      { name: 'Climbing', foundation: 'Strength', archetype: 'trickster' },
    ],
  },
];

export const ALL_SKILLS: SkillDef[] = ARCHETYPES.flatMap((a) => a.skills);

export function skillByName(name: string): SkillDef | undefined {
  return ALL_SKILLS.find((s) => s.name === name);
}

export const FOUNDATION_GROUPS = {
  Physical: ['Strength', 'Dexterity', 'Constitution'] as const,
  Mental: ['Intellect', 'Perception', 'Resolve'] as const,
  Social: ['Charisma', 'Guile', 'Authority'] as const,
};

export const FOUNDATION_HARM: Record<string, string> = {
  Strength: 'Crushed',
  Dexterity: 'Bleeding',
  Constitution: 'Fever',
  Intellect: 'Fog',
  Perception: 'Disoriented',
  Resolve: 'Shock',
  Charisma: 'Tarnished',
  Guile: 'Exposed',
  Authority: 'Disgrace',
};

export const HIERARCHY_TIERS = ['Honoured', 'Trusted', 'Acknowledged', 'Outcast'] as const;
