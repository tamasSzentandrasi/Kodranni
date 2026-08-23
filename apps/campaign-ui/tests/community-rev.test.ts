import { describe, expect, it } from 'vitest';
import type { CharacterRecord, CommunityRecord } from '@kodranni/store';
import { emptyCommunity } from '@kodranni/store';
import {
  communityRevHash,
  hallRevPayload,
  hashHallRev,
  stableStringify,
} from '../src/lib/community-rev';

function character(partial: {
  slug: string;
  name: string;
  whoWeSee?: string;
  status?: CharacterRecord['status'];
  hierarchy?: CharacterRecord['hierarchy'];
}): CharacterRecord {
  return {
    id: partial.slug,
    slug: partial.slug,
    name: partial.name,
    kind: 'pc',
    status: partial.status ?? 'active',
    communityTie: '',
    whoWeSee: partial.whoWeSee,
    player: { platform: 'discord', displayName: 'hidden', accountId: 'acc-should-not-hash' },
    initiator: { platform: 'discord', displayName: 'st', accountId: 'st-should-not-hash' },
    foundations: {},
    foundationsEffective: {},
    skills: [],
    traits: [],
    exertion: { current: 0, max: 0 },
    echoes: [],
    echoCapacity: 0,
    echoWeight: 0,
    harm: {},
    dying: false,
    hierarchy: partial.hierarchy ?? [],
    armour: { kind: 'none', donned: false },
    inventory: { foodDays: 0, waterDays: 0, items: [] },
    flags: { decadence: false, overCapacity: false },
  };
}

function community(extra: Partial<CommunityRecord> = {}): CommunityRecord {
  return {
    ...emptyCommunity('vardmark', 'The Vardmark'),
    fortunesFoundedAt: '2026-08-01T12:00:00.000Z',
    fortuneMeta: { cohesion: { at: '2026-08-01T12:00:00.000Z', source: 'founding' } },
    pendingMoves: [],
    ...extra,
  };
}

describe('stableStringify', () => {
  it('sorts object keys so insertion order does not change the string', () => {
    expect(stableStringify({ b: 1, a: 2 })).toBe(stableStringify({ a: 2, b: 1 }));
    expect(stableStringify({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
  });

  it('omits undefined object values', () => {
    expect(stableStringify({ a: 1, b: undefined })).toBe('{"a":1}');
  });
});

describe('hallRevPayload', () => {
  const chars = [
    character({
      slug: 'torvald',
      name: 'Torvald Adzeson',
      whoWeSee: 'measures twice',
      hierarchy: [{ axis: 'Coin', tier: 'Acknowledged' }],
    }),
  ];

  it('includes the specified hall fields and strips sheet/account bindings', () => {
    const payload = hallRevPayload(community(), chars);
    expect(Object.keys(payload).sort()).toEqual(
      [
        'characters',
        'fortuneMeta',
        'fortunes',
        'fortunesFoundedAt',
        'hierarchyAxes',
        'myths',
        'outsiders',
        'pendingMoves',
        'placements',
        'ruler',
      ].sort(),
    );
    expect(payload.characters).toEqual([
      {
        slug: 'torvald',
        name: 'Torvald Adzeson',
        status: 'active',
        whoWeSee: 'measures twice',
        hierarchy: [{ axis: 'Coin', tier: 'Acknowledged' }],
      },
    ]);
    const json = JSON.stringify(payload);
    expect(json).not.toContain('generatedAt');
    expect(json).not.toContain('accountId');
    expect(json).not.toContain('acc-should-not-hash');
    expect(payload.characters[0]).not.toHaveProperty('player');
    expect(payload.characters[0]).not.toHaveProperty('initiator');
  });

  it('defaults whoWeSee to empty string', () => {
    const payload = hallRevPayload(community(), [character({ slug: 'x', name: 'X' })]);
    expect(payload.characters[0]?.whoWeSee).toBe('');
  });

  it('runs completeMemberPlacements before hashing so missing axes land as Outcast', () => {
    const payload = hallRevPayload(community(), chars);
    const torvald = payload.placements.filter((p) => p.characterSlug === 'torvald');
    expect(torvald.map((p) => p.axis).sort()).toEqual(['Arms', 'Blood', 'Coin', 'Faith']);
    expect(torvald.find((p) => p.axis === 'Arms')?.tier).toBe('Outcast');
  });
});

describe('communityRevHash', () => {
  const chars = [character({ slug: 'torvald', name: 'Torvald Adzeson' })];

  it('returns 64-char lowercase hex', () => {
    const rev = communityRevHash(community(), chars);
    expect(rev).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is stable for the same hall payload', () => {
    const a = communityRevHash(community(), chars);
    const b = communityRevHash(community(), chars);
    expect(a).toBe(b);
  });

  it('does not change when generatedAt would have', () => {
    const payload = hallRevPayload(community(), chars);
    const withStamp = hashHallRev(payload);
    expect(withStamp).toBe(communityRevHash(community(), chars));
    expect(stableStringify({ ...payload, generatedAt: '2099-01-01T00:00:00.000Z' })).not.toBe(
      stableStringify(payload),
    );
    expect('generatedAt' in payload).toBe(false);
  });

  it('changes when fortunes, pendingMoves, or whoWeSee change', () => {
    const base = communityRevHash(community(), chars);
    const fortunes = communityRevHash(
      community({ fortunes: { ...community().fortunes, vitality: 0 } }),
      chars,
    );
    const pending = communityRevHash(
      community({
        pendingMoves: [
          {
            id: 'm1',
            name: 'Torvald Adzeson',
            characterSlug: 'torvald',
            axis: 'Coin',
            fromTier: 'Acknowledged',
            toTier: 'Trusted',
          },
        ],
      }),
      chars,
    );
    const who = communityRevHash(community(), [
      character({ slug: 'torvald', name: 'Torvald Adzeson', whoWeSee: 'other' }),
    ]);
    expect(fortunes).not.toBe(base);
    expect(pending).not.toBe(base);
    expect(who).not.toBe(base);
  });
});
