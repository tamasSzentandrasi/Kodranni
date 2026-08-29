import { describe, expect, it } from 'vitest';
import { mintCampaignTunnel, originHostFor } from '../src/tunnel-mint.js';

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
