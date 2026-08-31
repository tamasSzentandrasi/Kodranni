import { describe, expect, it } from 'vitest';
import type { PublicSnapshot } from '@kodranni/store';
import { archiveRoute, renderArchivePage } from '../src/pages.js';

const snap: PublicSnapshot = {
  generatedAt: '2026-08-27T00:00:00.000Z',
  schemaVersion: 2,
  community: {
    slug: 'vardmark',
    name: 'The Vardmark at Kelarn’s Bend',
    fortunes: { vitality: 1, cohesion: 2, surplus: 1, standing: 1, tradition: 2 },
    myths: [
      {
        title: 'The Taking of Kelarn',
        summary: 'They came as guests and stayed as owners.',
        effects: [{ kind: 'advantage', label: 'On their own ground' }],
      },
    ],
    hierarchyAxes: ['Arms', 'Faith', 'Coin', 'Blood'],
    ruler: 'Halla the Red',
    rulerCharacterSlug: 'halla',
    placements: [
      { name: 'Torvald Adzeson', axis: 'Coin', tier: 'Trusted', characterSlug: 'torvald' },
    ],
    outsiders: [{ name: 'Ash-fen envoy', faction: 'Ash-fen', note: 'Watches the ford.' }],
    factions: [{ name: 'Ash-fen', hue: 140 }],
  },
  characters: [
    {
      id: '1',
      slug: 'torvald',
      name: 'Torvald Adzeson',
      kind: 'pc',
      status: 'active',
      communityTie: 'Holds the grain store.',
      whoWeSee: 'A quiet man who measures twice.',
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
      skills: [{ name: 'Craft', rating: 2, practice: 0, threshold: 4, foundation: 'Dexterity' }],
      traits: [{ name: 'Measured', note: 'Does not rush timber or grain.' }],
      exertion: { current: 0, max: 6 },
      echoes: [],
      echoCapacity: 4,
      echoWeight: 0,
      harm: {},
      dying: false,
      hierarchy: [{ axis: 'Coin', tier: 'Trusted' }],
      armour: { kind: 'none', donned: false },
      inventory: { foodDays: 2, waterDays: 2, items: [{ name: 'Adze' }] },
      flags: { decadence: false, overCapacity: false },
    },
  ],
};

describe('archiveRoute', () => {
  it('maps hall, roster, and sheet paths', () => {
    expect(archiveRoute('/community/', new URLSearchParams()).kind).toBe('community');
    expect(archiveRoute('/characters/', new URLSearchParams()).kind).toBe('roster');
    expect(archiveRoute('/characters/torvald/', new URLSearchParams())).toEqual({
      kind: 'sheet',
      slug: 'torvald',
      tab: 'core',
    });
    expect(archiveRoute('/characters/torvald/echoes/', new URLSearchParams())).toMatchObject({
      tab: 'echoes',
    });
  });
});

describe('renderArchivePage', () => {
  it('renders the hall from a snapshot with Fortunes, Find, and names', () => {
    const page = renderArchivePage(JSON.stringify(snap), '/community/', new URLSearchParams());
    expect(page?.status).toBe(200);
    const html = page!.html;
    expect(html).toContain('Fortunes');
    expect(html).toContain('data-hall-search');
    expect(html).toContain('Find');
    expect(html).toContain('The Vardmark at Kelarn’s Bend');
    expect(html).toContain('Torvald Adzeson');
    expect(html).toContain('Hierarchy');
    expect(html).toContain('Arms');
    expect(html).toContain('class="src">archive');
    expect(html).toContain('/design/campaign.css');
    expect(html).toContain('/hall-client.js');
    expect(html).not.toContain('No archive yet');
  });

  it('renders the roster and a read-only sheet', () => {
    const roster = renderArchivePage(JSON.stringify(snap), '/characters/', new URLSearchParams());
    expect(roster?.html).toContain('Torvald Adzeson');
    const sheet = renderArchivePage(
      JSON.stringify(snap),
      '/characters/torvald/',
      new URLSearchParams(),
    );
    expect(sheet?.html).toContain('A quiet man who measures twice.');
    expect(sheet?.html).toContain('Craft');
    expect(sheet?.html).not.toContain('data-wanting');
  });

  it('404s unknown characters', () => {
    const page = renderArchivePage(
      JSON.stringify(snap),
      '/characters/nope/',
      new URLSearchParams(),
    );
    expect(page?.status).toBe(404);
  });

  it('returns null for chrome assets so the Worker can serve files', () => {
    expect(renderArchivePage(JSON.stringify(snap), '/design/campaign.css', new URLSearchParams())).toBeNull();
    expect(renderArchivePage(JSON.stringify(snap), '/hall-client.js', new URLSearchParams())).toBeNull();
    expect(renderArchivePage(JSON.stringify(snap), '/brand/falcon-logo.png', new URLSearchParams())).toBeNull();
  });
});
