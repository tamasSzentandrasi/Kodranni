import { describe, expect, it } from 'vitest';
import { isDeskPath, isLocalDeskRequest } from '../src/lib/loopback';

describe('local desk', () => {
  it('recognises operator and emissary paths', () => {
    expect(isDeskPath('/emissary')).toBe(true);
    expect(isDeskPath('/operator/snapshot')).toBe(true);
    expect(isDeskPath('/community/setup/')).toBe(true);
    expect(isDeskPath('/community/')).toBe(false);
    expect(isDeskPath('/internal/discord')).toBe(false);
  });

  it('allows loopback Host without tunnel headers', () => {
    const req = new Request('http://127.0.0.1:8742/operator', {
      headers: { host: '127.0.0.1:8742' },
    });
    expect(isLocalDeskRequest(req)).toBe(true);
  });

  it('rejects tunneled requests even when Host is localhost', () => {
    const req = new Request('http://localhost/operator', {
      headers: {
        host: 'localhost',
        'x-forwarded-host': 'kodranni.com',
        'cf-connecting-ip': '1.2.3.4',
      },
    });
    expect(isLocalDeskRequest(req)).toBe(false);
  });
});
