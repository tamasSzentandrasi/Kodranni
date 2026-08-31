import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { emptyCommunity, openSqliteStore } from '../src/sqlite.js';
import { seedDemoCampaign } from '../src/seed.js';
import {
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
});

describe('demo seed labels', () => {
  it('puts factions on outsiders and tags on kin; Skard has both groups', () => {
    const dir = mkdtempSync(join(tmpdir(), 'kod-lab-'));
    dirs.push(dir);
    const store = openSqliteStore(join(dir, 'c.sqlite'));
    seedDemoCampaign(store);
    const c = store.getCommunity();
    const reed = c.labels?.find((l) => l.name === 'Reed-marsh folk');
    const rival = c.labels?.find((l) => l.name === 'Rival war-band');
    const ford = c.labels?.find((l) => l.name === 'Ford watch');
    expect(reed && rival && ford).toBeTruthy();
    const mara = c.outsiders.find((o) => o.name === 'Mara of the Reeds');
    expect(mara?.labelIds).toEqual([reed!.id]);
    const skard = c.outsiders.find((o) => o.name === 'Skard Ketilsson');
    expect(skard?.labelIds).toEqual([rival!.id, ford!.id]);
    const torvald = store.getCharacterBySlug('torvald');
    const grain = c.labels?.find((l) => l.name === 'Grain store');
    expect(torvald?.labelIds).toEqual([grain!.id]);
    store.close();
  });
});
