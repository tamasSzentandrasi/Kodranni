import { afterEach, describe, expect, it } from 'vitest';
import { installNightHandler, type NightOp, type NightResult } from '@kodranni/store';
import { POST } from '../src/pages/api/desk/night';

afterEach(() => {
  installNightHandler(undefined);
});

function post(headers: Record<string, string>, body: string) {
  return POST({
    request: new Request('http://127.0.0.1:8742/api/desk/night', {
      method: 'POST',
      headers: { host: '127.0.0.1:8742', ...headers },
      body,
    }),
  });
}

describe('POST /api/desk/night', () => {
  it('404s a tunneled request and does not run the night', async () => {
    let called = false;
    installNightHandler(async () => {
      called = true;
      return { ok: true };
    });
    const res = await post(
      { 'content-type': 'application/json', 'x-forwarded-host': 'kodranni.com' },
      JSON.stringify({ op: 'live' }),
    );
    expect(res.status).toBe(404);
    expect(called).toBe(false);
  });

  it('503s when this process has no night control', async () => {
    const res = await post({ 'content-type': 'application/json' }, JSON.stringify({ op: 'live' }));
    expect(res.status).toBe(503);
  });

  it('refuses Go Live from the player face', async () => {
    let called = false;
    installNightHandler(async () => {
      called = true;
      const result: NightResult = { ok: true, already: true };
      return result;
    });
    const res = await post(
      { 'content-type': 'application/json', cookie: 'kod_desk=0' },
      JSON.stringify({ op: 'live' }),
    );
    expect(res.status).toBe(404);
    expect(called).toBe(false);
  });

  it('ends the session from a form and returns to the page', async () => {
    const seen: NightOp[] = [];
    installNightHandler(async (op) => {
      seen.push(op);
      return { ok: true };
    });
    const res = await post(
      {
        'content-type': 'application/x-www-form-urlencoded',
        referer: 'http://127.0.0.1:8742/session/',
      },
      'op=end',
    );
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe('/session/');
    expect(seen).toEqual(['end']);
  });

  it('400s an unknown op and 500s a night failure', async () => {
    installNightHandler(async () => {
      throw new Error('cloudflared not found on PATH');
    });
    const bad = await post({ 'content-type': 'application/json' }, JSON.stringify({ op: 'nap' }));
    expect(bad.status).toBe(400);
    const failed = await post({ 'content-type': 'application/json' }, JSON.stringify({ op: 'live' }));
    expect(failed.status).toBe(500);
    expect(await failed.json()).toEqual({ error: 'cloudflared not found on PATH' });
  });
});
