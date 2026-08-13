import { describe, expect, it } from 'vitest';
import { ALL_SKILLS, ARCHETYPES, skillByName } from '../src/skills-catalog.js';

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
});
