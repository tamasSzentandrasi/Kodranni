import { describe, expect, it } from 'vitest';
import { issueCommunityToken, verifyCommunityToken } from '../src/community-token.js';
import { issueSheetToken, verifySheetToken } from '../src/sheet-token.js';

const secret = 'test-sheet-secret-do-not-use-in-prod';

describe('community setup tokens', () => {
  it('issues and verifies a storyteller token', () => {
    const token = issueCommunityToken({
      platform: 'discord',
      accountId: 'st-1',
      communitySlug: 'vardmark',
      secret,
      nowSec: 1_000_000,
      ttlSec: 3600,
    });
    const v = verifyCommunityToken(token, {
      communitySlug: 'vardmark',
      secret,
      nowSec: 1_000_100,
    });
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.claims.accountId).toBe('st-1');
      expect(v.claims.role).toBe('storyteller');
      expect(v.claims.kind).toBe('community-setup');
    }
  });

  it('rejects expired, wrong community, bad sig', () => {
    const token = issueCommunityToken({
      platform: 'discord',
      accountId: 'st-1',
      communitySlug: 'vardmark',
      secret,
      nowSec: 1000,
      ttlSec: 10,
    });
    expect(
      verifyCommunityToken(token, { communitySlug: 'vardmark', secret, nowSec: 2000 }).ok,
    ).toBe(false);
    expect(
      verifyCommunityToken(token, { communitySlug: 'other', secret, nowSec: 1005 }).ok,
    ).toBe(false);
    expect(
      verifyCommunityToken(token + 'x', { communitySlug: 'vardmark', secret, nowSec: 1005 }).ok,
    ).toBe(false);
  });

  it('does not accept a sheet token as a setup token', () => {
    const sheet = issueSheetToken({
      platform: 'discord',
      accountId: 'st-1',
      characterSlug: 'vardmark',
      role: 'storyteller',
      secret,
      nowSec: 1_000_000,
    });
    expect(verifyCommunityToken(sheet, { communitySlug: 'vardmark', secret, nowSec: 1_000_100 }).ok).toBe(
      false,
    );
    const setup = issueCommunityToken({
      platform: 'discord',
      accountId: 'st-1',
      communitySlug: 'mara',
      secret,
      nowSec: 1_000_000,
    });
    expect(verifySheetToken(setup, { characterSlug: 'mara', secret, nowSec: 1_000_100 }).ok).toBe(false);
  });
});
