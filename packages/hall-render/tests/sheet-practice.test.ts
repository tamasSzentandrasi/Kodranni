import { describe, expect, it } from 'vitest';
import type { CharacterRecord } from '@kodranni/store/types';
import { sheetInner, skillPracticeFill } from '../src/sheet.js';

function person(skills: CharacterRecord['skills']): CharacterRecord {
  return {
    id: '1',
    slug: 'temur',
    name: 'Temur',
    kind: 'pc',
    status: 'active',
    communityTie: '',
    foundations: {},
    foundationsEffective: {},
    skills,
    traits: [],
    exertion: { current: 1, max: 6 },
    echoes: [],
    echoCapacity: 6,
    echoWeight: 0,
    harm: {},
    dying: false,
    hierarchy: [],
    armour: { kind: 'none', donned: false },
    inventory: { foodDays: 0, waterDays: 0, items: [] },
    flags: { decadence: false, overCapacity: false },
  };
}

function skillLi(html: string, name: string): string {
  const at = html.indexOf(name);
  expect(at).toBeGreaterThan(-1);
  return html.slice(html.lastIndexOf('<li class="skill"', at), at);
}

describe('skill roundel', () => {
  it('fills a rating of 0 from Practice and keeps the centre empty', () => {
    expect(skillPracticeFill(0, 2, 24)).toBe(2 / 24);
    expect(skillPracticeFill(1, 12, 48)).toBe(0.25);
    expect(skillPracticeFill(3, 0, 72)).toBe(1);
    expect(skillPracticeFill(0, 0, 24)).toBe(0);

    const html = sheetInner(
      person([
        {
          name: 'Bowyer & Fletcher',
          rating: 0,
          practice: 2,
          threshold: 24,
          foundation: 'Constitution',
        },
        { name: 'Command', rating: 1, practice: 12, threshold: 48, foundation: 'Authority' },
        { name: 'Slash', rating: 3, practice: 10, threshold: 72, foundation: 'Strength' },
      ]),
      'Aspalath',
    );

    const untrained = skillLi(html, 'Bowyer &amp; Fletcher');
    expect(untrained).toContain('data-rating="0"');
    expect(untrained).toContain('data-rated="false"');
    expect(untrained).toContain(`style="--p: ${2 / 24}"`);
    expect(untrained).toContain('>∅<');
    expect(untrained).toContain('Untrained · Practice 2/24 (8% to next) · Constitution');

    const trained = skillLi(html, 'Command');
    expect(trained).toContain('data-rated="true"');
    expect(trained).toContain('style="--p: 0.25"');

    const capped = skillLi(html, 'Slash');
    expect(capped).toContain('style="--p: 1"');
    expect(capped).toContain('Rating 3 (max) · Strength');
  });
});
