import { describe, expect, it } from 'vitest';
import {
  completeMemberPlacements,
  inductOutsiderIntoCommunity,
} from '../src/hierarchy.js';
import { demoTomas, demoCapacityProfile } from '../src/seed.js';
import { emptyCommunity } from '../src/sqlite.js';

describe('completeMemberPlacements', () => {
  it('places every community character on every axis (default Outcast)', () => {
    const community = emptyCommunity('broken-shore', 'Test');
    community.hierarchyAxes = ['Arms', 'Faith', 'Coin', 'Blood'];
    community.placements = [
      { name: 'Tomas', axis: 'Coin', tier: 'Acknowledged', characterSlug: 'tomas' },
    ];
    community.outsiders = [{ name: 'Marsh traders' }];
    const chars = [demoTomas(), demoCapacityProfile('Leif')];
    const placements = completeMemberPlacements(community, chars);
    for (const ch of chars) {
      for (const axis of community.hierarchyAxes) {
        const row = placements.find(
          (p) => p.axis === axis && (p.characterSlug === ch.slug || p.name === ch.name),
        );
        expect(row, `${ch.name} on ${axis}`).toBeTruthy();
      }
    }
    const tomasCoin = placements.find((p) => p.characterSlug === 'tomas' && p.axis === 'Coin');
    expect(tomasCoin?.tier).toBe('Acknowledged');
    const tomasArms = placements.find((p) => p.characterSlug === 'tomas' && p.axis === 'Arms');
    expect(tomasArms?.tier).toBe('Outcast');
  });
});

describe('inductOutsiderIntoCommunity', () => {
  it('removes outsider and places Outcast on all axes', () => {
    const community = emptyCommunity('x', 'X');
    community.outsiders = [{ name: 'Marsh traders', note: 'seed' }];
    const next = inductOutsiderIntoCommunity(community, community.outsiders[0]!);
    expect(next.outsiders).toHaveLength(0);
    expect(next.placements.filter((p) => p.name === 'Marsh traders')).toHaveLength(4);
    expect(next.placements.every((p) => p.tier === 'Outcast' || p.name !== 'Marsh traders')).toBe(
      true,
    );
  });
});
