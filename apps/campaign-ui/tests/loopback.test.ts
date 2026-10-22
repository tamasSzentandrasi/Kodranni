import { describe, expect, it } from 'vitest';
import { archiveAllowsApi, deskToolsOn, isDeskPath, isLocalDeskRequest } from '../src/lib/loopback';

describe('local desk', () => {
  it('recognises operator and emissary paths', () => {
    expect(isDeskPath('/emissary')).toBe(true);
    expect(isDeskPath('/operator/snapshot')).toBe(true);
    expect(isDeskPath('/community/setup/')).toBe(true);
    expect(isDeskPath('/api/desk')).toBe(true);
    expect(isDeskPath('/api/desk/session')).toBe(true);
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

  it('turns the desk on for loopback until the Storyteller chooses the player face', () => {
    const local = new Request('http://127.0.0.1:8742/community/', {
      headers: { host: '127.0.0.1:8742' },
    });
    expect(deskToolsOn(local)).toBe(true);
    const cookie = new Request('http://127.0.0.1:8742/community/', {
      headers: { host: '127.0.0.1:8742', cookie: 'kod_desk=1' },
    });
    expect(deskToolsOn(cookie)).toBe(true);
    const player = new Request('http://127.0.0.1:8742/community/', {
      headers: { host: '127.0.0.1:8742', cookie: 'kod_desk=0' },
    });
    expect(deskToolsOn(player)).toBe(false);
    const tunnel = new Request('http://127.0.0.1:8742/community/', {
      headers: { host: '127.0.0.1:8742', cookie: 'kod_desk=1', 'cf-ray': 'abc' },
    });
    expect(deskToolsOn(tunnel)).toBe(false);
    const archive = new Request('http://127.0.0.1:8742/community/', {
      headers: { host: '127.0.0.1:8742', 'x-kodranni-archive': '1' },
    });
    expect(deskToolsOn(archive)).toBe(false);
    const live = new Request('https://kodranni.com/community/', {
      headers: { host: 'kodranni.com' },
    });
    expect(deskToolsOn(live)).toBe(false);
  });

  it('lets an archive read the snapshot and the between-sessions Session call', () => {
    expect(archiveAllowsApi('GET', '/api/snapshot')).toBe(true);
    expect(archiveAllowsApi('HEAD', '/api/snapshot')).toBe(true);
    expect(archiveAllowsApi('PUT', '/api/snapshot')).toBe(false);
    expect(archiveAllowsApi('POST', '/api/snapshot')).toBe(false);
    expect(archiveAllowsApi('GET', '/api/session')).toBe(true);
    expect(archiveAllowsApi('HEAD', '/api/session/')).toBe(true);
    expect(archiveAllowsApi('POST', '/api/session')).toBe(false);
    expect(archiveAllowsApi('GET', '/api/desk/table')).toBe(false);
    expect(archiveAllowsApi('POST', '/api/desk/discord')).toBe(false);
  });
});
