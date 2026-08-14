import { describe, expect, it } from 'vitest';
import { localHttpUrlFromBind, parseCloudflaredUrl } from '../src/tunnel.js';

describe('parseCloudflaredUrl', () => {
  it('extracts trycloudflare hostname from log noise', () => {
    const log = `
2026-08-14T12:00:00Z INF Thank you for trying Cloudflare Tunnel.
2026-08-14T12:00:01Z INF |  https://random-words-here.trycloudflare.com                                 |
2026-08-14T12:00:01Z INF Connection registered
`;
    expect(parseCloudflaredUrl(log)).toBe('https://random-words-here.trycloudflare.com');
  });

  it('returns undefined when absent', () => {
    expect(parseCloudflaredUrl('no url here')).toBeUndefined();
  });

  it('strips trailing slash', () => {
    expect(parseCloudflaredUrl('visit https://abc.trycloudflare.com/ now')).toBe(
      'https://abc.trycloudflare.com',
    );
  });
});

describe('localHttpUrlFromBind', () => {
  it('prefixes http for host:port', () => {
    expect(localHttpUrlFromBind('127.0.0.1:8742')).toBe('http://127.0.0.1:8742');
  });
});
