import { describe, expect, it } from 'vitest';
import {
  attachCampaignHostname,
  mintCampaignTunnel,
  originHostFor,
  publicHostnameFor,
} from '../src/tunnel-mint.js';

describe('mintCampaignTunnel', () => {
  it('creates a tunnel, CNAME, and token on first start', async () => {
    const calls: { url: string; method: string }[] = [];
    const cfFetch: typeof fetch = async (input, init) => {
      const url = String(input);
      const method = (init?.method ?? 'GET').toUpperCase();
      calls.push({ url, method });
      if (url.includes('/cfd_tunnel') && method === 'POST' && !url.includes('/configurations')) {
        return new Response(JSON.stringify({ success: true, result: { id: 'tun-1' } }), {
          headers: { 'content-type': 'application/json' },
        });
      }
      if (url.includes('/token')) {
        return new Response(JSON.stringify({ success: true, result: 'eyJtoken' }), {
          headers: { 'content-type': 'application/json' },
        });
      }
      if (url.includes('/dns_records') && method === 'GET') {
        return new Response(JSON.stringify({ success: true, result: [] }), {
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: true, result: {} }), {
        headers: { 'content-type': 'application/json' },
      });
    };
    const minted = await mintCampaignTunnel(
      'vardmark',
      { CF_API_TOKEN: 't', CF_ACCOUNT_ID: 'acc', CF_ZONE_ID: 'zone' },
      {},
      cfFetch,
    );
    expect(minted.origin).toBe('https://origin-vardmark.kodranni.com');
    expect(minted.token).toBe('eyJtoken');
    expect(minted.created).toBe(true);
    expect(originHostFor('vardmark')).not.toBe('demo.kodranni.com');
    expect(calls.some((c) => c.method === 'POST' && c.url.includes('/dns_records'))).toBe(true);
  });

  it('reuses tunnelId on later starts', async () => {
    let created = 0;
    const cfFetch: typeof fetch = async (input, init) => {
      const url = String(input);
      const method = (init?.method ?? 'GET').toUpperCase();
      if (url.includes('/cfd_tunnel') && method === 'POST' && !url.includes('/configurations')) {
        created++;
        return new Response(JSON.stringify({ success: true, result: { id: 'nope' } }));
      }
      if (url.includes('/token')) {
        return new Response(JSON.stringify({ success: true, result: 'tok2' }));
      }
      if (url.includes('/dns_records') && method === 'GET') {
        return new Response(
          JSON.stringify({
            success: true,
            result: [{ id: 'dns1', content: 'tun-keep.cfargotunnel.com', proxied: true }],
          }),
        );
      }
      return new Response(JSON.stringify({ success: true, result: {} }));
    };
    const minted = await mintCampaignTunnel(
      'vardmark',
      { CF_API_TOKEN: 't', CF_ACCOUNT_ID: 'acc', CF_ZONE_ID: 'zone' },
      { tunnelId: 'tun-keep' },
      cfFetch,
    );
    expect(created).toBe(0);
    expect(minted.tunnelId).toBe('tun-keep');
    expect(minted.created).toBe(false);
  });
});

describe('publicHostnameFor', () => {
  it('names the campaign and refuses reserved labels', () => {
    expect(publicHostnameFor('Aspalath')).toBe('aspalath.kodranni.com');
    expect(publicHostnameFor('demo')).toBeNull();
    expect(publicHostnameFor('play')).toBeNull();
    expect(publicHostnameFor('www')).toBeNull();
    expect(publicHostnameFor('origin-aspalath')).toBeNull();
    expect(publicHostnameFor('not a slug')).toBeNull();
  });
});

describe('attachCampaignHostname', () => {
  const env = { CF_API_TOKEN: 't', CF_ACCOUNT_ID: 'acc', CF_ZONE_ID: 'zone' };

  it('skips without credentials and skips a reserved name', async () => {
    let called = 0;
    const cfFetch: typeof fetch = async () => {
      called += 1;
      return new Response('{}');
    };
    expect((await attachCampaignHostname('aspalath', {}, cfFetch)).result).toBe('skipped');
    expect((await attachCampaignHostname('demo', env, cfFetch)).result).toBe('skipped');
    expect((await attachCampaignHostname('origin-aspalath', env, cfFetch)).result).toBe('skipped');
    expect(called).toBe(0);
  });

  it('attaches the public name and leaves an existing name alone', async () => {
    const calls: { url: string; method: string; body?: string }[] = [];
    const cfFetch: typeof fetch = async (input, init) => {
      const url = String(input);
      const method = (init?.method ?? 'GET').toUpperCase();
      calls.push({ url, method, body: typeof init?.body === 'string' ? init.body : undefined });
      if (method === 'GET') {
        return new Response(
          JSON.stringify({
            success: true,
            result: [{ hostname: 'demo.kodranni.com', service: 'kodranni-edge' }],
          }),
          { headers: { 'content-type': 'application/json' } },
        );
      }
      return new Response(
        JSON.stringify({ success: true, result: { hostname: 'aspalath.kodranni.com' } }),
        { headers: { 'content-type': 'application/json' } },
      );
    };
    expect((await attachCampaignHostname('aspalath', env, cfFetch)).result).toBe('attached');
    const put = calls.find((call) => call.method === 'PUT');
    expect(put?.url).toContain('/workers/domains');
    expect(put?.body).toContain('"hostname":"aspalath.kodranni.com"');
    expect(put?.body).toContain('"service":"kodranni-edge"');
    expect(calls.some((call) => call.url.includes('origin-'))).toBe(false);
    expect(calls.some((call) => call.method === 'POST')).toBe(false);

    const again: { method: string }[] = [];
    const listed: typeof fetch = async (_input, init) => {
      again.push({ method: (init?.method ?? 'GET').toUpperCase() });
      return new Response(
        JSON.stringify({
          success: true,
          result: [{ hostname: 'aspalath.kodranni.com', service: 'kodranni-edge' }],
        }),
        { headers: { 'content-type': 'application/json' } },
      );
    };
    expect((await attachCampaignHostname('aspalath', env, listed)).result).toBe('attached');
    expect(again.every((call) => call.method === 'GET')).toBe(true);
  });

  it('returns failed when Cloudflare refuses the name', async () => {
    const cfFetch: typeof fetch = async (_input, init) => {
      const method = (init?.method ?? 'GET').toUpperCase();
      if (method === 'GET') {
        return new Response(JSON.stringify({ success: true, result: [] }), {
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: false, errors: [{ message: 'hostname taken' }] }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    };
    const failed = await attachCampaignHostname('aspalath', env, cfFetch);
    expect(failed.result).toBe('failed');
    expect(failed.detail).toContain('hostname taken');
  });
});
