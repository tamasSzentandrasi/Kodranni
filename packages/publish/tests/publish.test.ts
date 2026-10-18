import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { openSqliteStore, seedDemoCampaign, type PublicSnapshot } from '@kodranni/store';
import { edgeOriginWouldLoop, portraitFilesFromSnapshot, writeArchiveFiles } from '../src/index.js';

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe('publish archive', () => {
  it('writes snapshot.json and archive index without drafts', () => {
    const dir = mkdtempSync(join(tmpdir(), 'kod-pub-'));
    dirs.push(dir);
    const store = openSqliteStore(join(dir, 'c.sqlite'));
    seedDemoCampaign(store);
    const snap = store.toPublicSnapshot();
    store.close();
    const out = join(dir, 'archive');
    const r = writeArchiveFiles(out, snap, { publicHost: 'https://kodranni.example.com' });
    expect(r.characterCount).toBeGreaterThan(0);
    const html = readFileSync(r.indexPath, 'utf8');
    expect(html).toContain('Archive');
    expect(html).toContain('/community/');
    expect(html).toContain('/characters/');
    expect(html).toContain('kodranni.example.com');
    const community = readFileSync(join(out, 'community', 'index.html'), 'utf8');
    expect(community).toContain('Fortunes');
    const roster = readFileSync(join(out, 'characters', 'index.html'), 'utf8');
    expect(roster).toContain('Roster');
    const json = JSON.parse(readFileSync(r.snapshotPath, 'utf8'));
    expect(json.characters.every((c: { status: string }) => c.status !== 'draft')).toBe(true);
    expect(json.characters.every((c: { initiator?: unknown }) => !c.initiator)).toBe(true);
  });

  it('reads portrait files named on the snapshot and skips urls and missing files', () => {
    const dir = mkdtempSync(join(tmpdir(), 'kod-portraits-'));
    dirs.push(dir);
    writeFileSync(join(dir, 'jakov.jpg'), Buffer.from([0xff, 0xd8, 0xff]));
    writeFileSync(join(dir, 'mara.png'), Buffer.from([0x89, 0x50]));
    const snap = {
      characters: [
        { slug: 'jakov', avatar: 'jakov.jpg' },
        { slug: 'mara', avatar: 'mara.png' },
        { slug: 'tomaso', avatar: 'https://example.test/tomaso.jpg' },
        { slug: 'orsa', avatar: '../orsa.jpg' },
        { slug: 'vito', avatar: 'missing.jpg' },
      ],
    } as PublicSnapshot;
    const files = portraitFilesFromSnapshot(dir, snap);
    expect(files.map((file) => file.slug)).toEqual(['jakov', 'mara']);
    expect(files.map((file) => file.type)).toEqual(['image/jpeg', 'image/png']);
  });

  it('detects an origin that would loop the public hostname', () => {
    expect(
      edgeOriginWouldLoop(
        'https://play.kodranni.com',
        'https://play.kodranni.com/',
      ),
    ).toBe(true);
    expect(
      edgeOriginWouldLoop(
        'https://play.kodranni.com',
        'https://random.trycloudflare.com',
      ),
    ).toBe(false);
    expect(
      edgeOriginWouldLoop('https://demo.kodranni.com', 'https://kodranni.com/'),
    ).toBe(true);
    expect(
      edgeOriginWouldLoop(
        'https://kodranni-edge.kodranni.workers.dev',
        'https://demo.kodranni.com',
      ),
    ).toBe(true);
    expect(
      edgeOriginWouldLoop(
        'https://demo.kodranni.com',
        'https://origin-vardmark.kodranni.com',
      ),
    ).toBe(false);
    expect(
      edgeOriginWouldLoop(
        'https://kodranni-edge.kodranni.workers.dev',
        'https://aspalath.kodranni.com',
      ),
    ).toBe(true);
  });
});
