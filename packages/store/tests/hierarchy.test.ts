import { describe, expect, it } from 'vitest';
import {
  completeMemberPlacements,
  inductOutsiderIntoCommunity,
} from '../src/hierarchy.js';
import { demoTorvald, demoLeifr } from '../src/seed.js';
import { emptyCommunity } from '../src/sqlite.js';

describe('completeMemberPlacements', () => {
  it('places every community character on every axis (default Outcast)', () => {
    const community = emptyCommunity('vardmark', 'Test');
    community.hierarchyAxes = ['Arms', 'Faith', 'Coin', 'Blood'];
    community.placements = [
      {
        name: 'Torvald Adzeson',
        axis: 'Coin',
        tier: 'Acknowledged',
        characterSlug: 'torvald',
      },
    ];
    community.outsiders = [{ name: 'Mara of the Reeds', faction: 'Reed-marsh folk' }];
    const chars = [demoTorvald(), demoLeifr()];
    const placements = completeMemberPlacements(community, chars);
    for (const ch of chars) {
      for (const axis of community.hierarchyAxes) {
        const row = placements.find(
          (p) => p.axis === axis && (p.characterSlug === ch.slug || p.name === ch.name),
        );
        expect(row, `${ch.name} on ${axis}`).toBeTruthy();
      }
    }
    const coin = placements.find((p) => p.characterSlug === 'torvald' && p.axis === 'Coin');
    expect(coin?.tier).toBe('Acknowledged');
    const arms = placements.find((p) => p.characterSlug === 'torvald' && p.axis === 'Arms');
    expect(arms?.tier).toBe('Outcast');
  });
});

describe('inductOutsiderIntoCommunity', () => {
  it('removes outsider and places Outcast on all axes', () => {
    const community = emptyCommunity('x', 'X');
    community.outsiders = [{ name: 'Mara of the Reeds', note: 'seed' }];
    const next = inductOutsiderIntoCommunity(community, community.outsiders[0]!);
    expect(next.outsiders).toHaveLength(0);
    expect(next.placements.filter((p) => p.name === 'Mara of the Reeds')).toHaveLength(4);
    expect(
      next.placements.every((p) => p.tier === 'Outcast' || p.name !== 'Mara of the Reeds'),
    ).toBe(true);
  });
});
