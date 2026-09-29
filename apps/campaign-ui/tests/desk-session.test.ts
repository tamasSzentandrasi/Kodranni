import { describe, expect, it } from 'vitest';
import { POST } from '../src/pages/api/desk/session';

function post(headers: Record<string, string>, body: string) {
  return POST({
    request: new Request('http://127.0.0.1:8742/api/desk/session', {
      method: 'POST',
      headers: { host: '127.0.0.1:8742', ...headers },
      body,
    }),
  });
}

describe('POST /api/desk/session', () => {
  it('404s a tunneled request', async () => {
    const res = await post(
      { 'content-type': 'application/json', 'x-forwarded-host': 'kodranni.com' },
      JSON.stringify({ on: true }),
    );
    expect(res.status).toBe(404);
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('sets the cookie and returns to the hall page', async () => {
    const res = await post(
      {
        'content-type': 'application/x-www-form-urlencoded',
        referer: 'http://127.0.0.1:8742/community/hierarchy/',
      },
      'on=1',
    );
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe('/community/hierarchy/');
    expect(res.headers.get('set-cookie')).toContain('kod_desk=1');
  });

  it('clears the cookie and leaves a retired desk path', async () => {
    const res = await post(
      { 'content-type': 'application/json', referer: 'http://127.0.0.1:8742/community/setup/' },
      JSON.stringify({ on: false }),
    );
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe('/community/');
    expect(res.headers.get('set-cookie')).toContain('Max-Age=0');
  });

  it('204s without a referer and refuses another host', async () => {
    const quiet = await post({ 'content-type': 'application/json' }, JSON.stringify({ on: true }));
    expect(quiet.status).toBe(204);
    expect(quiet.headers.get('location')).toBeNull();
    const foreign = await post(
      { 'content-type': 'application/json', referer: 'https://evil.example/community/' },
      JSON.stringify({ on: true }),
    );
    expect(foreign.status).toBe(204);
    expect(foreign.headers.get('location')).toBeNull();
    expect(foreign.headers.get('set-cookie')).toContain('kod_desk=1');
  });
});
