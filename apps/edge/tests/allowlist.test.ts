import { describe, expect, it } from 'vitest';
import { livePathAllowed } from '../src/allowlist.js';

describe('livePathAllowed', () => {
  it('allows hall, sheets, and player APIs', () => {
    expect(livePathAllowed('GET', '/community/')).toBe(true);
    expect(livePathAllowed('GET', '/characters/torvald/')).toBe(true);
    expect(livePathAllowed('GET', '/api/snapshot')).toBe(true);
    expect(livePathAllowed('GET', '/api/community/rev')).toBe(true);
    expect(livePathAllowed('POST', '/api/character/torvald')).toBe(true);
    expect(livePathAllowed('GET', '/hall-client.js')).toBe(true);
  });

  it('denies setup, operator, and ST community writes', () => {
    expect(livePathAllowed('GET', '/community/setup/')).toBe(false);
    expect(livePathAllowed('GET', '/operator/')).toBe(false);
    expect(livePathAllowed('GET', '/emissary')).toBe(false);
    expect(livePathAllowed('POST', '/internal/discord')).toBe(false);
    expect(livePathAllowed('POST', '/api/community/fortunes/founding')).toBe(false);
  });
});
