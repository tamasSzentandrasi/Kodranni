import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import { emptyCommunity, openSqliteStore } from '../src/sqlite.js';
import { demoCharactersPresent, seedDemoCampaign } from '../src/seed.js';
import { parseCampaignToml, serializeCampaignToml } from '../src/campaign-toml.js';
import { publicSnapshotViolations } from '../src/redact.js';
import { applyPublicSnapshot, slugFromCampaignName } from '../src/snapshot.js';

const dirs: string[] = [];

afterEach(() => {
  for (const d of dirs.splice(0)) {
    try {
      rmSync(d, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
});

describe('sqlite store', () => {
  it('migrates, seeds, and redacts public snapshot without members', () => {
    const dir = mkdtempSync(join(tmpdir(), 'kodranni-store-'));
    dirs.push(dir);
    const path = join(dir, 'community.sqlite');
    const store = openSqliteStore(path);
    seedDemoCampaign(store);
    const torvaldRec = store.getCharacterBySlug('torvald')!;
    store.putCharacter({
      ...torvaldRec,
      player: {
        platform: 'discord',
        displayName: 'Torvald',
        accountId: '123456789012345678',
      },
      initiator: {
        platform: 'discord',
        displayName: 'Torvald',
        accountId: '123456789012345678',
      },
    });
    store.putMember({
      platform: 'discord',
      accountId: '123456789012345678',
      characterId: torvaldRec.id,
      role: 'player',
    });

    const snap = store.toPublicSnapshot();
    expect(snap.community.slug).toBe('vardmark');
    expect('pendingMoves' in snap.community).toBe(false);
    expect('fortuneMeta' in snap.community).toBe(false);
    expect('fortunesFoundedAt' in snap.community).toBe(false);
    expect(snap.characters.length).toBeGreaterThanOrEqual(1);
    const torvald = snap.characters.find((c) => c.slug === 'torvald')!;
    expect(torvald.name).toBe('Torvald Adzeson');
    // max(Str2,Dex2)+Int2+Auth1 = 5; Exertion max Res2+Con2+Cha2 = 6
    expect(torvald.echoCapacity).toBe(5);
    expect(torvald.exertion.max).toBe(6);
    expect(torvald.echoCapacity).not.toBe(torvald.exertion.max);
    const leifr = snap.characters.find((c) => c.slug === 'leifr')!;
    // Guidebook capacity profile: max(2,1)+2+2 = 6; Exertion max 2+2+1 = 5
    expect(leifr.echoCapacity).toBe(6);
    expect(leifr.exertion.max).toBe(5);
    expect(leifr.echoWeight).toBe(6);
    const json = JSON.stringify(snap);
    expect(json).not.toContain('123456789012345678');
    expect(json).not.toContain('demo-discord-leifr');
    expect(snap.characters.every((c) => !c.initiator && !c.player?.accountId)).toBe(true);
    expect(store.listMembers()).toHaveLength(1);
    expect(publicSnapshotViolations(snap)).toEqual([]);

    // idempotent client event
    const a = store.appendEvent({
      type: 'Test',
      clientEventId: 'same',
      payload: { n: 1 },
    });
    const b = store.appendEvent({
      type: 'Test',
      clientEventId: 'same',
      payload: { n: 2 },
    });
    expect(a.id).toBe(b.id);

    store.close();
    const again = openSqliteStore(path);
    expect(again.getCharacterBySlug('torvald')?.exertion.current).toBe(4);
    again.close();
  });

  it('keeps drafts in listCharacters but omits them from the public snapshot', () => {
    const dir = mkdtempSync(join(tmpdir(), 'kodranni-store-'));
    dirs.push(dir);
    const store = openSqliteStore(join(dir, 'community.sqlite'));
    seedDemoCampaign(store);
    const torvald = store.getCharacterBySlug('torvald')!;
    store.putCharacter({
      ...torvald,
      id: 'draft-1',
      slug: 'mara-reed',
      name: 'Mara Reed',
      status: 'draft',
    });
    expect(store.listCharacters().some((c) => c.slug === 'mara-reed')).toBe(true);
    expect(store.toPublicSnapshot().characters.some((c) => c.slug === 'mara-reed')).toBe(
      false,
    );
    store.close();
  });

  it('emptyCommunity is unfounded Steady 2', () => {
    const c = emptyCommunity('vardmark', 'The Vardmark');
    expect(c.fortunes).toEqual({
      vitality: 2,
      cohesion: 2,
      surplus: 2,
      standing: 2,
      tradition: 2,
    });
    expect(c.fortunesFoundedAt).toBeUndefined();
  });

  it('normalizes missing pendingMoves and fortuneMeta', () => {
    const dir = mkdtempSync(join(tmpdir(), 'kodranni-store-'));
    dirs.push(dir);
    const path = join(dir, 'community.sqlite');
    const store = openSqliteStore(path);
    seedDemoCampaign(store);
    store.close();

    const db = new DatabaseSync(path);
    const row = db.prepare(`SELECT data FROM community WHERE id = 'main'`).get() as {
      data: string;
    };
    const data = JSON.parse(row.data) as Record<string, unknown>;
    delete data.pendingMoves;
    delete data.fortuneMeta;
    delete data.fortunesFoundedAt;
    db.prepare(`UPDATE community SET data = ? WHERE id = 'main'`).run(JSON.stringify(data));
    db.close();

    const again = openSqliteStore(path);
    const c = again.getCommunity();
    expect(c.pendingMoves).toEqual([]);
    expect(c.fortuneMeta).toEqual({});
    expect(c.fortunesFoundedAt).toBeUndefined();
    again.close();
  });

  it('strips pendingMoves, fortuneMeta, and fortunesFoundedAt from the public snapshot', () => {
    const dir = mkdtempSync(join(tmpdir(), 'kodranni-store-'));
    dirs.push(dir);
    const store = openSqliteStore(join(dir, 'community.sqlite'));
    seedDemoCampaign(store);
    const community = store.getCommunity();
    community.fortunesFoundedAt = '2026-08-01T12:00:00.000Z';
    community.fortuneMeta = {
      vitality: { at: '2026-08-01T12:00:00.000Z', source: 'founding' },
      cohesion: { at: '2026-08-12T09:00:00.000Z', source: 'st', note: 'winter' },
    };
    community.pendingMoves = [
      {
        id: 'mv-1',
        name: 'Mara',
        axis: 'Arms',
        fromTier: 'Trusted',
        toTier: 'Honoured',
        requestedBy: 'Leifr',
      },
    ];
    store.putCommunity(community);

    const live = store.getCommunity();
    expect(live.fortunesFoundedAt).toBe('2026-08-01T12:00:00.000Z');
    expect(live.fortuneMeta?.cohesion?.source).toBe('st');
    expect(live.pendingMoves).toHaveLength(1);

    const snap = store.toPublicSnapshot();
    expect(snap.community.fortunesFoundedAt).toBeUndefined();
    expect(snap.community.fortuneMeta).toBeUndefined();
    expect(snap.community.pendingMoves).toBeUndefined();
    expect('fortunesFoundedAt' in snap.community).toBe(false);
    expect('fortuneMeta' in snap.community).toBe(false);
    expect('pendingMoves' in snap.community).toBe(false);
    const json = JSON.stringify(snap.community);
    expect(json).not.toContain('fortunesFoundedAt');
    expect(json).not.toContain('fortuneMeta');
    expect(json).not.toContain('pendingMoves');
    store.close();
  });

  it('repopulates a campaign from a public snapshot under a new campaign slug', () => {
    const dir = mkdtempSync(join(tmpdir(), 'kodranni-store-'));
    dirs.push(dir);
    const src = openSqliteStore(join(dir, 'src.sqlite'));
    seedDemoCampaign(src, 'vardmark', 'The Vardmark');
    const snap = src.toPublicSnapshot();
    src.close();

    const dest = openSqliteStore(join(dir, 'dest.sqlite'));
    dest.putCommunity(emptyCommunity('ash-hill', 'placeholder'));
    applyPublicSnapshot(dest, snap, 'ash-hill');
    const c = dest.getCommunity();
    expect(c.slug).toBe('ash-hill');
    expect(c.name).toBe('The Vardmark');
    expect(dest.getCharacterBySlug('torvald')?.name).toMatch(/Torvald/i);
    expect(dest.listCharacters().some((ch) => ch.status === 'draft')).toBe(false);
    dest.close();
  });
});

describe('slugFromCampaignName', () => {
  it('turns a campaign title into a slug', () => {
    expect(slugFromCampaignName('The Ash Hill')).toBe('the-ash-hill');
    expect(slugFromCampaignName('  Vardmark  ')).toBe('vardmark');
  });
});

describe('campaign.toml', () => {
  it('round-trips fixed keys', () => {
    const text = serializeCampaignToml({
      schema: 1,
      slug: 'vardmark',
      name: 'The Vardmark at Kelarn’s Bend',
      storePath: '/tmp/x.sqlite',
      liveBind: '127.0.0.1:8742',
      liveBaseUrl: 'http://127.0.0.1:8742',
      publishDebounceMs: 45000,
      platforms: ['discord', 'fluxer'],
    });
    const cfg = parseCampaignToml(text);
    expect(cfg.slug).toBe('vardmark');
    expect(cfg.platforms).toEqual(['discord', 'fluxer']);
    expect(cfg.storePath).toBe('/tmp/x.sqlite');
  });

  it('round-trips named tunnel keys', () => {
    const text = serializeCampaignToml({
      schema: 1,
      slug: 'vardmark',
      name: 'Test',
      storePath: '/tmp/x.sqlite',
      liveBind: '127.0.0.1:8742',
      liveBaseUrl: 'https://live.example.com',
      publishDebounceMs: 45000,
      platforms: [],
      tunnelMode: 'named',
      tunnelHostname: 'https://live.example.com',
      cloudflareTunnelToken: 'tok',
    });
    const cfg = parseCampaignToml(text);
    expect(cfg.tunnelMode).toBe('named');
    expect(cfg.tunnelHostname).toBe('https://live.example.com');
    expect(cfg.cloudflareTunnelToken).toBe('tok');
  });

  it('reports when the demo roster is already in the store', () => {
    const dir = mkdtempSync(join(tmpdir(), 'kodranni-store-'));
    dirs.push(dir);
    const store = openSqliteStore(join(dir, 'community.sqlite'));
    expect(demoCharactersPresent(store)).toBe(false);
    seedDemoCampaign(store);
    expect(demoCharactersPresent(store)).toBe(true);
    store.close();
  });

  it('close is idempotent', () => {
    const dir = mkdtempSync(join(tmpdir(), 'kodranni-store-'));
    dirs.push(dir);
    const store = openSqliteStore(join(dir, 'community.sqlite'));
    seedDemoCampaign(store);
    store.close();
    expect(() => store.close()).not.toThrow();
  });
});
