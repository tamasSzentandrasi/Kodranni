import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { completeMemberPlacements, openSqliteStore, seedDemoCampaign } from '@kodranni/store';
import { addHallNpc } from '../src/creation.js';
import { addCommunityFaction, addHallOutsider } from '../src/events.js';

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

function demoStore() {
  const dir = mkdtempSync(join(tmpdir(), 'kod-hall-fig-'));
  dirs.push(dir);
  const store = openSqliteStore(join(dir, 'c.sqlite'));
  seedDemoCampaign(store);
  return store;
}

describe('addHallNpc', () => {
  it('creates a locked active NPC that automation places Outcast on every axis', () => {
    const store = demoStore();
    const ch = addHallNpc(store, { name: 'Hilda Gate' });
    expect(ch.kind).toBe('npc');
    expect(ch.status).toBe('active');
    expect(ch.creation?.locked).toBe(true);
    expect(ch.creation?.placeholder).toBe(true);
    const community = store.getCommunity();
    const placed = completeMemberPlacements(community, store.listCharacters()).filter(
      (p) => p.characterSlug === ch.slug,
    );
    expect(placed).toHaveLength(community.hierarchyAxes.length);
    expect(placed.every((p) => p.tier === 'Outcast')).toBe(true);
    store.close();
  });
});

describe('addHallOutsider', () => {
  it('puts a named outsider on the porch with an optional faction', () => {
    const store = demoStore();
    const community = addHallOutsider(store, { name: 'Ash-horn', faction: 'Reed-marsh folk' });
    const row = community.outsiders.find((o) => o.name === 'Ash-horn');
    expect(row).toEqual({ name: 'Ash-horn', faction: 'Reed-marsh folk' });
    const placed = completeMemberPlacements(community, store.listCharacters()).filter(
      (p) => p.name === 'Ash-horn',
    );
    expect(placed).toHaveLength(0);
    store.close();
  });

  it('rejects a duplicate porch name', () => {
    const store = demoStore();
    addHallOutsider(store, { name: 'Ash-horn' });
    expect(() => addHallOutsider(store, { name: 'Ash-horn' })).toThrow(/already on the porch/i);
    store.close();
  });
});

describe('addCommunityFaction', () => {
  it('stores a named hue and rejects duplicates', () => {
    const store = demoStore();
    const community = addCommunityFaction(store, { name: 'Reed-marsh folk', hue: 142 });
    expect(community.factions).toEqual([{ name: 'Reed-marsh folk', hue: 142 }]);
    expect(() => addCommunityFaction(store, { name: 'reed-marsh folk', hue: 10 })).toThrow(
      /already listed/i,
    );
    store.close();
  });
});
