import { describe, expect, it } from 'vitest';
import { emptyTableState, type PublicSnapshot } from '@kodranni/store';
import { archiveRoute, renderArchivePage } from '../src/pages.js';
import { omenBoardSvg, publicDie, sessionReading, sessionSharedHtml, tideMarkerWords, tidePicturePath, tidePictureSvg } from '../src/session.js';
import { sheetInner } from '../src/sheet.js';
import type { CharacterRecord } from '@kodranni/store';

const snap: PublicSnapshot = {
  generatedAt: '2026-08-27T00:00:00.000Z',
  schemaVersion: 2,
  community: {
    slug: 'vardmark',
    name: 'Aspalath',
    fortunes: { vitality: 1, cohesion: 2, surplus: 1, standing: 1, tradition: 2 },
    myths: [],
    hierarchyAxes: ['Arms', 'Faith', 'Coin', 'Blood'],
    ruler: null,
    placements: [],
    outsiders: [],
  },
  characters: [],
};

describe('session reading', () => {
  it('names the fixed faces and a marker in the book’s words', () => {
    const state = emptyTableState();
    state.sceneFaces = [
      { face: 4, effect: 'The mill bell', tone: 'mixed', hidden: false },
      { face: 9, effect: 'The sealed bell', tone: 'negative', hidden: true },
    ];
    const reading = sessionReading(state);
    expect(reading.scene.map((row) => row.face)).toEqual([7, 13, 4]);
    expect(reading.scene[0]?.effect).toBe('Positive Consequence');
    expect(reading.scene[1]?.effect).toBe('Negative Consequence');
    expect(reading.die).toHaveLength(20);
    expect(reading.die.find((face) => face.face === 4)?.effect).toBe('The mill bell');
    expect(reading.die.find((face) => face.face === 9)?.effect).toBe('');
    expect(JSON.stringify(reading)).not.toContain('The sealed bell');
    const html = sessionSharedHtml(reading);
    expect(html).toContain('class="omen-die"');
    expect(html).toContain('data-point="up"');
    expect(html).toContain('data-point="down"');
    expect(html).toContain('<h2>Omens</h2>');
    expect(html).toContain('omen-mark');
    expect(html).toContain('session-glyph');
    expect(html).not.toContain('omen-stage__seal');
    expect(html).not.toContain('This scene');
    expect(html).toContain('The mill bell');
    expect(html).not.toContain('The sealed bell');
    expect(reading.tide).toBeNull();
    expect(tideMarkerWords({ sideA: 'Mill', sideB: 'Palace', position: 0, length: 15 })).toBe(
      'Mill has collapsed.',
    );
    expect(tideMarkerWords({ sideA: 'Mill', sideB: 'Palace', position: 15, length: 15 })).toBe(
      'Palace has collapsed.',
    );
    expect(tideMarkerWords({ sideA: 'Mill', sideB: 'Palace', position: 8, length: 15 })).toBe(
      'The marker stands at 8 of 15.',
    );
    const picture = omenBoardSvg(publicDie(state));
    expect(picture).toContain('>9<');
    expect(picture).not.toContain('The sealed bell');
    expect(picture).not.toContain('The mill bell');
    const tide = tidePictureSvg({
      sideA: 'Mill',
      sideB: 'Palace',
      position: 8,
      length: 15,
      dyeA: '#a01818',
      dyeB: '#3a5c6c',
    });
    expect(tide).toContain('#a01818');
    expect(tide).toContain('#3a5c6c');
    expect(tide).toContain('fill="#0a0909"');
    expect(tide).not.toContain('#f4efe6');
    expect(tide).toContain('The marker stands at 8 of 15.');
    expect(tidePicturePath({ position: 8, dyeA: '#A01818', dyeB: '#3a5c6c' })).toBe(
      '/session/tide.png?p=8&a=a01818&b=3a5c6c',
    );
    const whispered = omenBoardSvg([
      { face: 9, effect: 'The sealed bell', tone: 'negative', fixed: false, whisper: true },
    ]);
    expect(whispered).not.toContain('The sealed bell');
  });
});

describe('send back on the sheet', () => {
  it('says the draft is open and names the waiting Wanting', () => {
    const ch = {
      id: 'ada',
      slug: 'ada',
      name: 'Ada',
      kind: 'pc',
      status: 'draft',
      foundations: {},
      foundationsEffective: {},
      skills: [],
      traits: [],
      echoes: [],
      harm: {},
      flags: { decadence: false, overCapacity: false },
      inventory: { foodDays: 0, waterDays: 0, items: [] },
      labelIds: [],
      echoCapacity: 0,
      echoWeight: 0,
      creation: {
        foundationPoints: 0,
        skillPoints: 0,
        words: 1,
        birthOmenGranted: false,
        guidingHandGranted: false,
        locked: false,
        returned: true,
        pendingWanting: 'plus_one_foundation',
      },
    } as CharacterRecord;
    const html = sheetInner(ch, 'Aspalath');
    expect(html).toContain('This draft is open. The edits remain.');
    expect(html).toContain('+1 to one named Foundation');
  });
});

describe('archive session', () => {
  it('keeps the tab and says the table is between sessions', () => {
    expect(archiveRoute('/session/', new URLSearchParams())).toEqual({ kind: 'session' });
    const page = renderArchivePage(JSON.stringify(snap), '/session/', new URLSearchParams());
    expect(page?.status).toBe(200);
    const html = page!.html;
    expect(html).toContain('The table is between sessions.');
    expect(html).toContain('href="/session/"');
    expect(html).toContain('aria-current="page"');
    expect(html).not.toContain('Positive Consequence');
    expect(html).not.toContain('Approvals');
    expect(html).not.toContain('adapter pending');
    expect(html).not.toContain('The mill bell');
    const overview = renderArchivePage(JSON.stringify(snap), '/community/', new URLSearchParams());
    expect(overview?.html).toContain('href="/session/"');
  });
});
