import { describe, expect, it } from 'vitest';
import {
  ALL_SKILLS,
  ARCHETYPES,
  FOUNDATION_NAMES,
  filterSkillSuggestions,
  skillByName,
} from '../src/skills-catalog.js';

describe('skills catalog', () => {
  it('has six archetypes and 72 skills', () => {
    expect(ARCHETYPES).toHaveLength(6);
    expect(ALL_SKILLS).toHaveLength(72);
  });

  it('resolves Carpentry & Masonry under Artisan / Strength', () => {
    const s = skillByName('Carpentry & Masonry');
    expect(s?.archetype).toBe('artisan');
    expect(s?.foundation).toBe('Strength');
  });

  it('filters skill suggestions for Discord autocomplete', () => {
    const hits = filterSkillSuggestions('neg');
    expect(hits.some((h) => h.name === 'Negotiation')).toBe(true);
    expect(hits.length).toBeLessThanOrEqual(25);
    expect(FOUNDATION_NAMES).toHaveLength(9);
  });
});
