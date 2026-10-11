import { describe, expect, it } from 'vitest';
import {
  completeMemberPlacements,
  inductOutsiderIntoCommunity,
} from '../src/hierarchy.js';
import { demoJakov, demoTomaso } from '../src/seed.js';
import { emptyCommunity } from '../src/sqlite.js';

describe('completeMemberPlacements', () => {
  it('keeps explicit placements and leaves everyone else unassigned', () => {
    const community = emptyCommunity('vardmark', 'Test');
    community.hierarchyAxes = ['Arms', 'Faith', 'Coin', 'Blood'];
    community.placements = [
      {
        name: 'Tomaso Fero',
        axis: 'Coin',
        tier: 'Acknowledged',
        characterSlug: 'tomaso',
      },
    ];
    community.outsiders = [{ name: 'Mara of the Reeds', faction: 'Reed-marsh folk' }];
    const chars = [demoTomaso(), demoJakov()];
    const placements = completeMemberPlacements(community, chars);
    const coin = placements.find((p) => p.characterSlug === 'tomaso' && p.axis === 'Coin');
    expect(coin?.tier).toBe('Acknowledged');
    expect(placements.find((p) => p.characterSlug === 'tomaso' && p.axis === 'Arms')).toBeUndefined();
    expect(placements.find((p) => p.characterSlug === 'jakov')).toBeUndefined();
  });

  it('drops a dead character from the diagram', () => {
    const community = emptyCommunity('vardmark', 'Test');
    community.placements = [
      { name: 'Tomaso Fero', axis: 'Coin', tier: 'Acknowledged', characterSlug: 'tomaso' },
    ];
    const tomaso = demoTomaso();
    tomaso.status = 'dead';
    expect(completeMemberPlacements(community, [tomaso])).toHaveLength(0);
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
