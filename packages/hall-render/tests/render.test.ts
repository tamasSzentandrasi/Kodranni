import { describe, expect, it } from 'vitest';
import type { PublicSnapshot } from '@kodranni/store/types';
import { communityInner } from '../src/hall.js';
import { hallViewFromSnapshot } from '../src/format.js';
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
      inventory: {
        foodDays: 2,
        waterDays: 2,
        items: [{ name: 'Adze', note: 'Edge needs re-peening.' }],
      },
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
    expect(html).toContain('data-source="snapshot"');
    expect(html).not.toContain('data-rite-open');
    expect(html).toContain('data-hall-legend');
    expect(html).not.toContain('data-hall-aspects');
    expect(html).not.toContain('data-preview-faction');
    expect(html).toContain('data-find-toggle');
    expect(html).toContain('aria-label="Find in the hall"');
    expect(html).not.toContain('data-find-hide');
    expect(html).toContain('data-filter="label"');
    expect(html).toContain('data-value="fac-ash-fen"');
    expect(html).toContain('mark--faction');
    expect(html).toContain('mark--tag');
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
    expect(sheet?.html).toContain('core-grid');
    expect(sheet?.html).toContain('skill-wheel');
    expect(sheet?.html).toContain('/archetypes/warrior.jpg');
    expect(sheet?.html).toContain('vtrack--echo');
    expect(sheet?.html).toContain('found-groups');
    expect(sheet?.html).toContain('sheet-identity__text');
    expect(sheet?.html).not.toContain('data-wanting');
    const inv = renderArchivePage(
      JSON.stringify(snap),
      '/characters/torvald/inventory/',
      new URLSearchParams(),
    );
    expect(inv?.html).toContain('class="item__name"');
    expect(inv?.html).toContain('Adze');
    expect(inv?.html).toContain('data-tip="Edge needs re-peening."');
    expect(inv?.html).not.toContain('item__note');
    expect(inv?.html).not.toContain('Edge needs re-peening.</span>');
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

describe('communityInner', () => {
  it('sets live source and founding stamp; plus only when canEdit', () => {
    const view = hallViewFromSnapshot({
      ...snap,
      community: { ...snap.community, fortunesFoundedAt: '2026-08-01T00:00:00.000Z' },
    });
    const unsigned = communityInner(view, { live: true, canEdit: false });
    expect(unsigned).toContain('data-source="live"');
    expect(unsigned).toContain('data-founded="2026-08-01T00:00:00.000Z"');
    expect(unsigned).not.toContain('data-rite-open');

    const signed = communityInner(view, { live: true, canEdit: true });
    expect(signed).toContain('data-rite-open="figure"');
    expect(signed).toContain('data-label-ids="fac-ash-fen"');

    const archive = communityInner(view);
    expect(archive).toContain('data-source="snapshot"');
    expect(archive).toContain('data-founded=""');
    expect(archive).not.toContain('data-rite-open');
  });
});
