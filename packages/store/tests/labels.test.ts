import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { emptyCommunity, openSqliteStore } from '../src/sqlite.js';
import { seedDemoCampaign } from '../src/seed.js';
import {
  DEFAULT_LABEL_GROUPS,
  FACTION_GROUP_ID,
  TAG_GROUP_ID,
  labelId,
  migrateCommunityLabels,
} from '../src/labels.js';

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe('migrateCommunityLabels', () => {
  it('lifts factions[] and outsider.faction into labels and labelIds', () => {
    const raw = emptyCommunity('t', 'T');
    raw.factions = [
      { name: 'Reed-marsh folk', hue: 142 },
      { name: 'Rival war-band', hue: 18 },
    ];
    raw.outsiders = [{ name: 'Mara', faction: 'Reed-marsh folk' }];
    const c = migrateCommunityLabels(raw);
    expect(c.labelGroups?.map((g) => g.id).sort()).toEqual([FACTION_GROUP_ID, TAG_GROUP_ID].sort());
    const reed = c.labels?.find((l) => l.name === 'Reed-marsh folk');
    expect(reed?.id).toBe(labelId('faction', 'Reed-marsh folk'));
    expect(reed?.hue).toBe(142);
    expect(c.outsiders[0]?.faction).toBeUndefined();
    expect(c.outsiders[0]?.labelIds).toEqual([reed!.id]);
    expect(c.factions).toEqual([
      { name: 'Reed-marsh folk', hue: 142 },
      { name: 'Rival war-band', hue: 18 },
    ]);
    const again = migrateCommunityLabels(c);
    expect(again.labels).toHaveLength(2);
    expect(again.outsiders[0]?.labelIds).toEqual([reed!.id]);
  });

  it('does not move a faction already filed in another category into g-faction', () => {
    const raw = emptyCommunity('t', 'T');
    raw.labelGroups = [
      ...DEFAULT_LABEL_GROUPS,
      { id: 'g-foreign', name: 'Foreign Influence', kind: 'faction' },
    ];
    raw.labels = [{ id: 'fac-pelesa', groupId: 'g-foreign', name: 'Pelesa', hue: 220 }];
    raw.factions = [{ name: 'Pelesa', hue: 220 }];
    const c = migrateCommunityLabels(raw);
    expect(c.labels?.find((l) => l.name === 'Pelesa')?.groupId).toBe('g-foreign');
  });
});

describe('demo seed labels', () => {
  it('puts factions on outsiders and precise tags on people; consul has both groups', () => {
    const dir = mkdtempSync(join(tmpdir(), 'kod-lab-'));
    dirs.push(dir);
    const store = openSqliteStore(join(dir, 'c.sqlite'));
    seedDemoCampaign(store);
    const c = store.getCommunity();
    const orvanti = c.labels?.find((l) => l.name === 'House Orvanti');
    const company = c.labels?.find((l) => l.name === 'Free Company');
    const pelesa = c.labels?.find((l) => l.name === 'Pelesa');
    const calvaro = c.labels?.find((l) => l.name === 'Calvaro');
    expect(orvanti && company && pelesa && calvaro).toBeTruthy();
    expect(c.labels?.some((l) => l.name === 'Loading crane')).toBe(false);
    expect(c.labels?.some((l) => l.name === 'Harbour chain')).toBe(false);
    const envoy = c.outsiders.find((o) => o.name === 'Matteo Rinaldi');
    expect(envoy?.labelIds).toContain(calvaro!.id);
    const consul = c.outsiders.find((o) => o.name === 'Luca Bandi');
    expect(consul?.labelIds).toContain(pelesa!.id);
    expect(orvanti?.groupId).toBe('g-houses');
    expect(pelesa?.groupId).toBe('g-foreign');
    expect(company?.groupId).toBe('g-estate');
    expect(
      (c.labels ?? [])
        .filter((l) => l.groupId === 'g-houses')
        .map((l) => l.name)
        .sort(),
    ).toEqual(['House Calvo', 'House Orvanti', 'House Solari']);
    expect(c.labelGroups?.some((g) => g.name === 'Noble Houses of Aspalath')).toBe(true);
    expect(c.labelGroups?.some((g) => g.name === 'Foreign Influence')).toBe(true);
    expect(c.labelGroups?.some((g) => g.name === 'Estate Loyalty')).toBe(true);
    const jakov = store.getCharacterBySlug('jakov');
    expect(jakov?.labelIds).toContain(company!.id);
    const again = store.getCommunity();
    expect(again.labels?.find((l) => l.name === 'Pelesa')?.groupId).toBe('g-foreign');
    store.close();
  });
});
