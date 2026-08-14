import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { openSqliteStore } from '../src/sqlite.js';
import { seedDemoCampaign } from '../src/seed.js';
import { parseCampaignToml, serializeCampaignToml } from '../src/campaign-toml.js';

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
    store.putMember({
      platform: 'discord',
      accountId: '123456789012345678',
      characterId: store.getCharacterBySlug('torvald')!.id,
      role: 'player',
    });

    const snap = store.toPublicSnapshot();
    expect(snap.community.slug).toBe('vardmark');
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
    expect(store.listMembers()).toHaveLength(1);

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
});
