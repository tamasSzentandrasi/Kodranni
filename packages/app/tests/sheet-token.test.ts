import { describe, expect, it } from 'vitest';
import {
  issueSheetToken,
  verifySheetToken,
  withEditToken,
} from '../src/sheet-token.js';

const secret = 'test-sheet-secret-do-not-use-in-prod';

describe('sheet tokens', () => {
  it('issues and verifies a player token', () => {
    const token = issueSheetToken({
      platform: 'discord',
      accountId: 'u1',
      characterSlug: 'mara',
      secret,
      nowSec: 1_000_000,
      ttlSec: 3600,
    });
    const v = verifySheetToken(token, {
      characterSlug: 'mara',
      secret,
      nowSec: 1_000_100,
    });
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.claims.accountId).toBe('u1');
      expect(v.claims.role).toBe('player');
    }
  });

  it('rejects expired, wrong slug, bad sig', () => {
    const token = issueSheetToken({
      platform: 'discord',
      accountId: 'u1',
      characterSlug: 'mara',
      secret,
      nowSec: 1000,
      ttlSec: 10,
    });
    expect(
      verifySheetToken(token, { characterSlug: 'mara', secret, nowSec: 2000 }).ok,
    ).toBe(false);
    expect(
      verifySheetToken(token, { characterSlug: 'other', secret, nowSec: 1005 }).ok,
    ).toBe(false);
    expect(
      verifySheetToken(token + 'x', { characterSlug: 'mara', secret, nowSec: 1005 }).ok,
    ).toBe(false);
  });

  it('withEditToken appends query', () => {
    expect(withEditToken('https://live.example/characters/mara/', 'tok')).toBe(
      'https://live.example/characters/mara/?edit=tok',
    );
    expect(withEditToken('https://live.example/characters/mara/?x=1', 'tok')).toBe(
      'https://live.example/characters/mara/?x=1&edit=tok',
    );
  });
});
