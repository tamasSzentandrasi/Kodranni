import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  campaignFromUrl,
  handleEdgeRequest,
  kvKey,
  shouldStampCampaign,
  type KvLike,
} from '../src/handler.js';

class MemoryKv implements KvLike {
  store = new Map<string, string>();
  async get(key: string) {
    return this.store.get(key) ?? null;
  }
  async put(key: string, value: string) {
    this.store.set(key, value);
  }
}

function sign(key: string, body: string) {
  return createHmac('sha256', key).update(body).digest('hex');
}

function env() {
  return {
    CAMPAIGNS: new MemoryKv(),
    DEVICE_KEYS: new MemoryKv(),
    DEFAULT_CAMPAIGN: 'vardmark',
  };
}

describe('shouldStampCampaign', () => {
  it('stamps hall routes and leaves chrome files alone', () => {
    expect(shouldStampCampaign('/community/')).toBe(true);
    expect(shouldStampCampaign('/characters/torvald/')).toBe(true);
    expect(shouldStampCampaign('/design/campaign.css')).toBe(false);
    expect(shouldStampCampaign('/hall-client.js')).toBe(false);
    expect(shouldStampCampaign('/brand/falcon-logo.png')).toBe(false);
  });
});

describe('campaignFromUrl', () => {
  it('prefers ?campaign=', () => {
    expect(
      campaignFromUrl(new URL('https://demo.kodranni.com/?campaign=other'), 'vardmark'),
    ).toBe('other');
  });

  it('maps demo.kodranni.com to the default campaign, not slug demo', () => {
    expect(campaignFromUrl(new URL('https://demo.kodranni.com/community/'), 'vardmark')).toBe(
      'vardmark',
    );
  });

  it('aliases demo/play query slugs to DEFAULT_CAMPAIGN', () => {
    expect(campaignFromUrl(new URL('https://kodranni.com/?campaign=demo'), 'vardmark')).toBe(
      'vardmark',
    );
    expect(campaignFromUrl(new URL('https://kodranni.com/?campaign=play'), 'vardmark')).toBe(
      'vardmark',
    );
  });

  it('requires ?campaign= on kodranni.com (product lives at /)', () => {
    expect(campaignFromUrl(new URL('https://kodranni.com/'), 'vardmark')).toBeNull();
    expect(campaignFromUrl(new URL('https://kodranni.com/?campaign=vardmark'), 'vardmark')).toBe(
      'vardmark',
    );
  });

  it('treats apex /community and /characters as the default campaign', () => {
    expect(campaignFromUrl(new URL('https://kodranni.com/community/'), 'vardmark')).toBe(
      'vardmark',
    );
    expect(
      campaignFromUrl(
        new URL('https://kodranni.com/characters/torvald/'),
        'vardmark',
        'kodranni_campaign=ash-hill',
      ),
    ).toBe('ash-hill');
  });

  it('maps a campaign-named subdomain to that slug', () => {
    expect(campaignFromUrl(new URL('https://ash-hill.kodranni.com/'))).toBe('ash-hill');
  });

  it('falls back to DEFAULT_CAMPAIGN on workers.dev', () => {
    expect(
      campaignFromUrl(new URL('https://kodranni-edge.kodranni.workers.dev/'), 'vardmark'),
    ).toBe('vardmark');
  });
});

describe('edge handler', () => {
  it('registers, stores a snapshot, and serves it when origin is unset', async () => {
    const e = env();
    const campaign = 'vardmark';
    const deviceKey = 'a'.repeat(32);
    const regBody = JSON.stringify({ deviceKey });
    const reg = await handleEdgeRequest(
      new Request(`https://face.example/control/register?campaign=${campaign}`, {
        method: 'POST',
        body: regBody,
      }),
      e,
    );
    expect(reg.status).toBe(200);

    const snap = {
      generatedAt: '2026-08-25T00:00:00.000Z',
      schemaVersion: 1,
      community: { slug: 'vardmark', name: 'The Vardmark', fortunes: {} },
      characters: [{ slug: 'torvald', name: 'Torvald', status: 'active' }],
    };
    const body = JSON.stringify(snap);
    const put = await handleEdgeRequest(
      new Request(`https://face.example/api/snapshot?campaign=${campaign}`, {
        method: 'PUT',
        headers: { authorization: `Bearer ${campaign}:${sign(deviceKey, body)}` },
        body,
      }),
      e,
    );
    expect(put.status).toBe(200);

    const get = await handleEdgeRequest(
      new Request(`https://face.example/api/snapshot?campaign=${campaign}`),
      e,
    );
    expect(get.status).toBe(200);
    const got = (await get.json()) as { community: { name: string } };
    expect(got.community.name).toBe('The Vardmark');

    const home = await handleEdgeRequest(
      new Request(`https://face.example/?campaign=${campaign}`),
      e,
    );
    expect(home.status).toBe(302);
    expect(home.headers.get('location')).toBe(`/community/?campaign=${campaign}`);

    const html = await handleEdgeRequest(
      new Request(`https://face.example/community/?campaign=${campaign}`),
      e,
    );
    expect(html.status).toBe(200);
    const pageHtml = await html.text();
    expect(pageHtml).toContain('The Vardmark');
    expect(pageHtml).toContain('data-hall-search');
    expect(pageHtml).toContain('Fortunes');
  });

  it('rejects snapshots that look unredacted', async () => {
    const e = env();
    const campaign = 'x';
    const deviceKey = 'b'.repeat(32);
    await handleEdgeRequest(
      new Request(`https://face.example/control/register?campaign=${campaign}`, {
        method: 'POST',
        body: JSON.stringify({ deviceKey }),
      }),
      e,
    );
    const body = JSON.stringify({
      generatedAt: 't',
      community: { slug: 'x', name: 'X' },
      characters: [{ slug: 'a', name: 'A', initiator: { accountId: '123456789012345678' } }],
    });
    const put = await handleEdgeRequest(
      new Request(`https://face.example/api/snapshot?campaign=${campaign}`, {
        method: 'PUT',
        headers: { authorization: `Bearer ${campaign}:${sign(deviceKey, body)}` },
        body,
      }),
      e,
    );
    expect(put.status).toBe(400);
  });

  it('proxies to origin when set, and fail-closes to archive on timeout', async () => {
    const e = env();
    const campaign = 'y';
    const deviceKey = 'c'.repeat(32);
    await handleEdgeRequest(
      new Request(`https://face.example/control/register?campaign=${campaign}`, {
        method: 'POST',
        body: JSON.stringify({ deviceKey }),
      }),
      e,
    );
    const snapBody = JSON.stringify({
      generatedAt: 't',
      community: { slug: 'y', name: 'Y' },
      characters: [],
    });
    await handleEdgeRequest(
      new Request(`https://face.example/api/snapshot?campaign=${campaign}`, {
        method: 'PUT',
        headers: { authorization: `Bearer ${campaign}:${sign(deviceKey, snapBody)}` },
        body: snapBody,
      }),
      e,
    );
    const originBody = JSON.stringify({ origin: 'https://127.0.0.1:9' });
    const sess = await handleEdgeRequest(
      new Request(`https://face.example/control/session?campaign=${campaign}`, {
        method: 'POST',
        headers: { authorization: `Bearer ${campaign}:${sign(deviceKey, originBody)}` },
        body: originBody,
      }),
      e,
    );
    expect(sess.status).toBe(200);
    expect(await e.CAMPAIGNS.get(kvKey(campaign, 'origin'))).toBe('https://127.0.0.1:9');

    const page = await handleEdgeRequest(
      new Request(`https://face.example/community/?campaign=${campaign}`),
      { ...e, LIVE_PROXY_TIMEOUT_MS: '50' },
    );
    expect(page.status).toBe(200);
    expect(await page.text()).toContain('Fortunes');
    expect(await e.CAMPAIGNS.get(kvKey(campaign, 'origin'))).toBe('');
  });

  it('keeps ?campaign= across live redirects on the product host', async () => {
    const e = env();
    const campaign = 'y';
    const deviceKey = 'c'.repeat(32);
    await handleEdgeRequest(
      new Request(`https://kodranni.com/control/register?campaign=${campaign}`, {
        method: 'POST',
        body: JSON.stringify({ deviceKey }),
      }),
      e,
    );
    const originBody = JSON.stringify({ origin: 'https://origin.example' });
    await handleEdgeRequest(
      new Request(`https://kodranni.com/control/session?campaign=${campaign}`, {
        method: 'POST',
        headers: { authorization: `Bearer ${campaign}:${sign(deviceKey, originBody)}` },
        body: originBody,
      }),
      e,
    );

    const prev = globalThis.fetch;
    globalThis.fetch = async (input) => {
      const u = String(input instanceof Request ? input.url : input);
      expect(u).toBe('https://origin.example/community/');
      return new Response('<html><a href="/characters/torvald/">sheet</a></html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      });
    };
    try {
      const home = await handleEdgeRequest(
        new Request(`https://kodranni.com/?campaign=${campaign}`),
        e,
      );
      expect(home.status).toBe(302);
      expect(home.headers.get('location')).toBe(`/community/?campaign=${campaign}`);

      const live = await handleEdgeRequest(
        new Request(`https://kodranni.com/community/?campaign=${campaign}`),
        e,
      );
      expect(live.status).toBe(200);
      expect(await live.text()).toContain('href="/characters/torvald/?campaign=y"');
      expect(live.headers.get('set-cookie') ?? '').toContain('kodranni_campaign=y');
    } finally {
      globalThis.fetch = prev;
    }
  });

  it('fail-closes to archive instead of returning Cloudflare origin errors', async () => {
    const e = env();
    const campaign = 'y';
    const deviceKey = 'c'.repeat(32);
    await handleEdgeRequest(
      new Request(`https://face.example/control/register?campaign=${campaign}`, {
        method: 'POST',
        body: JSON.stringify({ deviceKey }),
      }),
      e,
    );
    const snapBody = JSON.stringify({
      generatedAt: 't',
      community: { slug: 'y', name: 'Y' },
      characters: [],
    });
    await handleEdgeRequest(
      new Request(`https://face.example/api/snapshot?campaign=${campaign}`, {
        method: 'PUT',
        headers: { authorization: `Bearer ${campaign}:${sign(deviceKey, snapBody)}` },
        body: snapBody,
      }),
      e,
    );
    const originBody = JSON.stringify({ origin: 'https://origin.example' });
    await handleEdgeRequest(
      new Request(`https://face.example/control/session?campaign=${campaign}`, {
        method: 'POST',
        headers: { authorization: `Bearer ${campaign}:${sign(deviceKey, originBody)}` },
        body: originBody,
      }),
      e,
    );

    const prev = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response('<h1>Error 1016</h1><p>Origin DNS error</p>', { status: 530 });
    try {
      const page = await handleEdgeRequest(
        new Request(`https://face.example/community/?campaign=${campaign}`),
        e,
      );
      expect(page.status).toBe(200);
      expect(await page.text()).toContain('Fortunes');
      expect(await e.CAMPAIGNS.get(kvKey(campaign, 'origin'))).toBe('');
    } finally {
      globalThis.fetch = prev;
    }
  });

  it('serves archive CSS and images from ASSETS instead of a 404 page', async () => {
    const e = {
      ...env(),
      ASSETS: {
        async fetch(request: Request) {
          const path = new URL(request.url).pathname;
          if (path === '/design/campaign.css') {
            return new Response('body{color:red}', {
              status: 200,
              headers: { 'content-type': 'text/css' },
            });
          }
          return new Response('missing', { status: 404 });
        },
      },
    };
    const snap = JSON.stringify({
      generatedAt: 't',
      schemaVersion: 1,
      community: { slug: 'vardmark', name: 'The Vardmark', fortunes: {} },
      characters: [],
    });
    await e.CAMPAIGNS.put(kvKey('vardmark', 'snapshot'), snap);

    const css = await handleEdgeRequest(
      new Request('https://demo.kodranni.com/design/campaign.css'),
      e,
    );
    expect(css.status).toBe(200);
    expect(await css.text()).toBe('body{color:red}');

    const stamped = await handleEdgeRequest(
      new Request('https://kodranni.com/design/campaign.css?campaign=vardmark'),
      e,
    );
    expect(stamped.status).toBe(200);
    expect(await stamped.text()).toBe('body{color:red}');

    const html = await handleEdgeRequest(
      new Request('https://kodranni.com/community/?campaign=vardmark'),
      e,
    );
    const body = await html.text();
    expect(body).toContain('href="/design/campaign.css"');
    expect(body).not.toContain('/design/campaign.css?campaign=');
    expect(body).toContain('href="/community/?campaign=vardmark"');
  });

  it('serves hall-render HTML from the snapshot, not a dummy shell', async () => {
    const e = env();
    const campaign = 'vardmark';
    const snap = JSON.stringify({
      generatedAt: '2026-08-27T00:00:00.000Z',
      schemaVersion: 1,
      community: {
        slug: 'vardmark',
        name: 'The Vardmark',
        fortunes: { vitality: 2, cohesion: 2, surplus: 2, standing: 2, tradition: 2 },
        myths: [],
        hierarchyAxes: ['Arms'],
        ruler: null,
        placements: [],
        outsiders: [],
      },
      characters: [],
    });
    await e.CAMPAIGNS.put(kvKey(campaign, 'snapshot'), snap);
    const html = await handleEdgeRequest(
      new Request('https://demo.kodranni.com/community/'),
      e,
    );
    const body = await html.text();
    expect(body).toContain('data-hall-search');
    expect(body).toContain('Fortunes');
    expect(body).toContain('The Vardmark');
    expect(body).not.toContain('No archive yet');
  });

  it('does not proxy setup or operator paths while live', async () => {
    const e = env();
    const campaign = 'y';
    await e.CAMPAIGNS.put(kvKey(campaign, 'origin'), 'https://origin.example');
    const prev = globalThis.fetch;
    let hit = false;
    globalThis.fetch = async () => {
      hit = true;
      return new Response('secret', { status: 200 });
    };
    try {
      const res = await handleEdgeRequest(
        new Request('https://demo.kodranni.com/community/setup/'),
        e,
      );
      expect(res.status).toBe(404);
      expect(hit).toBe(false);
    } finally {
      globalThis.fetch = prev;
    }
  });

  it('maps GitHub Pages /Kodranni/Guidebook assets onto kodranni.com/Guidebook', async () => {
    const e = {
      ...env(),
      GUIDE_ORIGIN: 'https://tamasszentandrasi.github.io/Kodranni',
    };
    const prev = globalThis.fetch;
    globalThis.fetch = async (input) => {
      const u = String(input instanceof Request ? input.url : input);
      expect(u).toBe(
        'https://tamasszentandrasi.github.io/Kodranni/Guidebook/introduction/',
      );
      return new Response('<link href="/Kodranni/Guidebook/_astro/x.css" rel="stylesheet"/>', {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8' },
      });
    };
    try {
      const res = await handleEdgeRequest(
        new Request('https://kodranni.com/Guidebook/introduction/'),
        e,
      );
      expect(res.status).toBe(200);
      expect(await res.text()).toContain('href="/Guidebook/_astro/x.css"');
    } finally {
      globalThis.fetch = prev;
    }
  });

  it('fetches GitHub project paths without doubling /Kodranni', async () => {
    const e = {
      ...env(),
      GUIDE_ORIGIN: 'https://tamasszentandrasi.github.io/Kodranni',
    };
    const prev = globalThis.fetch;
    globalThis.fetch = async (input) => {
      const u = String(input instanceof Request ? input.url : input);
      expect(u).toBe(
        'https://tamasszentandrasi.github.io/Kodranni/Guidebook/_astro/x.css',
      );
      return new Response('body{color:red}', {
        status: 200,
        headers: { 'content-type': 'text/css' },
      });
    };
    try {
      const res = await handleEdgeRequest(
        new Request('https://kodranni.com/Kodranni/Guidebook/_astro/x.css'),
        e,
      );
      expect(res.status).toBe(200);
      expect(await res.text()).toBe('body{color:red}');
    } finally {
      globalThis.fetch = prev;
    }
  });

  it('proxies Discord channel send through the Worker bot token', async () => {
    const e = {
      ...env(),
      DISCORD_BOT_TOKEN: 'bot-secret',
    };
    const campaign = 'vardmark';
    const deviceKey = 'e'.repeat(32);
    await handleEdgeRequest(
      new Request(`https://face.example/control/register?campaign=${campaign}`, {
        method: 'POST',
        body: JSON.stringify({ deviceKey }),
      }),
      e,
    );
    const body = JSON.stringify({
      op: 'send',
      channelId: '123456789012345678',
      payload: { content: 'hi' },
    });
    const prev = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      const u = String(input instanceof Request ? input.url : input);
      expect(u).toBe('https://discord.com/api/v10/channels/123456789012345678/messages');
      expect((init?.headers as Record<string, string>).authorization).toBe('Bot bot-secret');
      return new Response(JSON.stringify({ id: 'm1' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    };
    try {
      const res = await handleEdgeRequest(
        new Request(`https://face.example/control/discord/rest?campaign=${campaign}`, {
          method: 'POST',
          headers: { authorization: `Bearer ${campaign}:${sign(deviceKey, body)}` },
          body,
        }),
        e,
      );
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ id: 'm1' });
    } finally {
      globalThis.fetch = prev;
    }
  });

  it('rejects unauthorized snapshot PUT', async () => {
    const e = env();
    const campaign = 'z';
    await handleEdgeRequest(
      new Request(`https://face.example/control/register?campaign=${campaign}`, {
        method: 'POST',
        body: JSON.stringify({ deviceKey: 'd'.repeat(32) }),
      }),
      e,
    );
    const body = JSON.stringify({ community: { name: 'Z' }, characters: [] });
    const put = await handleEdgeRequest(
      new Request(`https://face.example/api/snapshot?campaign=${campaign}`, {
        method: 'PUT',
        headers: { authorization: `Bearer ${campaign}:deadbeef` },
        body,
      }),
      e,
    );
    expect(put.status).toBe(401);
  });
});
