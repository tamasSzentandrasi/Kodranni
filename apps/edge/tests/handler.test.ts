import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  avatarIndexKey,
  avatarKvKey,
  campaignFromUrl,
  gcInactiveCampaigns,
  handleEdgeRequest,
  kvKey,
  pictureIndexKey,
  pictureKvKey,
  shouldStampCampaign,
  type KvLike,
} from '../src/handler.js';
import { INACTIVE_MS, MAX_CAMPAIGNS_PER_DEVICE } from '../src/limits.js';

class MemoryKv implements KvLike {
  store = new Map<string, string>();
  async get(key: string) {
    return this.store.get(key) ?? null;
  }
  async put(key: string, value: string) {
    this.store.set(key, value);
  }
  async delete(key: string) {
    this.store.delete(key);
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
    expect(shouldStampCampaign('/session/')).toBe(true);
    expect(shouldStampCampaign('/session/omens.png')).toBe(false);
    expect(shouldStampCampaign('/community/hierarchy/')).toBe(true);
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

  it('uses the hall cookie on apex hall paths, never invents a campaign', () => {
    expect(campaignFromUrl(new URL('https://kodranni.com/community/'), 'vardmark')).toBeNull();
    expect(
      campaignFromUrl(
        new URL('https://kodranni.com/characters/torvald/'),
        'vardmark',
        'kodranni_campaign=ash-hill',
      ),
    ).toBe('ash-hill');
  });

  it('uses the campaign cookie for live CSS on kodranni.com', () => {
    expect(
      campaignFromUrl(
        new URL('https://kodranni.com/_astro/CampaignLayout.css'),
        'vardmark',
        'kodranni_campaign=vardmark',
      ),
    ).toBe('vardmark');
    expect(
      campaignFromUrl(new URL('https://kodranni.com/_astro/CampaignLayout.css'), 'vardmark'),
    ).toBeNull();
  });

  it('reads the campaign from its public name and keeps the tunnel host internal', () => {
    expect(campaignFromUrl(new URL('https://aspalath.kodranni.com/community/'), 'vardmark')).toBe(
      'aspalath',
    );
    expect(campaignFromUrl(new URL('https://origin-aspalath.kodranni.com/'))).toBe('aspalath');
    expect(campaignFromUrl(new URL('https://demo.kodranni.com/community/'), 'vardmark')).toBe(
      'vardmark',
    );
    expect(campaignFromUrl(new URL('https://www.kodranni.com/community/'), 'vardmark')).toBeNull();
  });

  it('does not serve Vardmark for an unknown host', () => {
    expect(campaignFromUrl(new URL('https://evil.example/community/'), 'vardmark')).toBeNull();
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
    const regBodyJson = (await reg.json()) as { hostname?: string };
    expect(regBodyJson.hostname).toBe('skipped');

    const again = await handleEdgeRequest(
      new Request(`https://face.example/control/register?campaign=${campaign}`, {
        method: 'POST',
        body: regBody,
      }),
      e,
    );
    expect(again.status).toBe(200);

    const foreign = await handleEdgeRequest(
      new Request(`https://face.example/control/register?campaign=${campaign}`, {
        method: 'POST',
        body: JSON.stringify({ deviceKey: 'b'.repeat(32) }),
      }),
      e,
    );
    expect(foreign.status).toBe(409);

    const reserved = await handleEdgeRequest(
      new Request('https://face.example/control/register?campaign=demo', {
        method: 'POST',
        body: regBody,
      }),
      e,
    );
    expect(reserved.status).toBe(400);

    const play = await handleEdgeRequest(
      new Request('https://face.example/control/register?campaign=play', {
        method: 'POST',
        body: regBody,
      }),
      e,
    );
    expect(play.status).toBe(400);

    const tunnelName = await handleEdgeRequest(
      new Request('https://face.example/control/register?campaign=origin-aspalath', {
        method: 'POST',
        body: regBody,
      }),
      e,
    );
    expect(tunnelName.status).toBe(400);

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
    expect(pageHtml).toContain('Fortunes');
    expect(pageHtml).not.toContain('data-hall-search');

    const hier = await handleEdgeRequest(
      new Request(`https://face.example/community/hierarchy/?campaign=${campaign}`),
      e,
    );
    expect(hier.status).toBe(200);
    const hierHtml = await hier.text();
    expect(hierHtml).toContain('data-hall-search');
    expect(hierHtml).toContain('Hierarchy');
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

  it('forwards sheet and campaign cookies to the live origin', async () => {
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
    let seenCookie = '';
    let seenForwardedHost = '';
    globalThis.fetch = async (_input, init) => {
      const headers = init?.headers;
      seenCookie = headers instanceof Headers ? (headers.get('cookie') ?? '') : '';
      seenForwardedHost = headers instanceof Headers ? (headers.get('x-forwarded-host') ?? '') : '';
      return new Response('ok', { status: 200, headers: { 'content-type': 'text/html' } });
    };
    try {
      await handleEdgeRequest(
        new Request('https://kodranni.com/characters/torvald/?campaign=y', {
          headers: {
            cookie: 'kod_edit=tok; kodranni_campaign=y; kod_desk=1; kod_setup=old; other=nope',
          },
        }),
        e,
      );
      expect(seenCookie).toContain('kod_edit=tok');
      expect(seenCookie).toContain('kodranni_campaign=y');
      expect(seenCookie).not.toContain('kod_desk');
      expect(seenCookie).not.toContain('kod_setup');
      expect(seenCookie).not.toContain('other=nope');
      expect(seenForwardedHost).toBe('kodranni.com');
    } finally {
      globalThis.fetch = prev;
    }
  });

  it('proxies live CSS on kodranni.com from the campaign cookie', async () => {
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
    const fetched: string[] = [];
    globalThis.fetch = async (input) => {
      fetched.push(String(input instanceof Request ? input.url : input));
      return new Response('body{color:red}', {
        status: 200,
        headers: { 'content-type': 'text/css' },
      });
    };
    try {
      const res = await handleEdgeRequest(
        new Request('https://kodranni.com/_astro/CampaignLayout.css', {
          headers: { cookie: 'kodranni_campaign=y' },
        }),
        e,
      );
      expect(fetched.some((u) => u.includes('origin.example/_astro/CampaignLayout.css'))).toBe(
        true,
      );
      expect(res.status).toBe(200);
      expect(await res.text()).toBe('body{color:red}');
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

  it('serves demo item pictures and the map client when the tunnel 404s them', async () => {
    const e = {
      ...env(),
      ASSETS: {
        async fetch(request: Request) {
          const path = new URL(request.url).pathname;
          if (path === '/demo-items/adze.png') {
            return new Response('adze', {
              status: 200,
              headers: { 'content-type': 'image/png' },
            });
          }
          if (path === '/map-client.js') {
            return new Response('bootMap()', {
              status: 200,
              headers: { 'content-type': 'text/javascript' },
            });
          }
          if (path === '/ornament/cmap-mark.jpg') {
            return new Response('rose', {
              status: 200,
              headers: { 'content-type': 'image/jpeg' },
            });
          }
          return new Response('missing', { status: 404 });
        },
      },
    };
    await e.CAMPAIGNS.put(kvKey('vardmark', 'origin'), 'https://origin.example');
    const prev = globalThis.fetch;
    globalThis.fetch = async () => new Response('nope', { status: 404 });
    try {
      const item = await handleEdgeRequest(
        new Request('https://demo.kodranni.com/demo-items/adze.png'),
        e,
      );
      expect(item.status).toBe(200);
      expect(await item.text()).toBe('adze');
      const mapJs = await handleEdgeRequest(
        new Request('https://demo.kodranni.com/map-client.js'),
        e,
      );
      expect(mapJs.status).toBe(200);
      expect(await mapJs.text()).toBe('bootMap()');
      const rose = await handleEdgeRequest(
        new Request('https://demo.kodranni.com/ornament/cmap-mark.jpg'),
        e,
      );
      expect(rose.status).toBe(200);
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
    expect(body).toContain('Fortunes');
    expect(body).not.toContain('data-hall-search');
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
      const desk = await handleEdgeRequest(
        new Request('https://demo.kodranni.com/api/desk/snapshot'),
        e,
      );
      expect(res.status).toBe(404);
      expect(desk.status).toBe(404);
      expect(hit).toBe(false);
    } finally {
      globalThis.fetch = prev;
    }
  });

  it('proxies the player Session page and reading, and still refuses the desk', async () => {
    const e = env();
    const campaign = 'y';
    await e.CAMPAIGNS.put(kvKey(campaign, 'origin'), 'https://origin.example');
    const prev = globalThis.fetch;
    globalThis.fetch = async (input) => {
      const u = String(input instanceof Request ? input.url : input);
      return new Response(`proxied ${u}`, {
        status: 200,
        headers: { 'content-type': 'text/html' },
      });
    };
    try {
      const session = await handleEdgeRequest(
        new Request(`https://kodranni.com/session/?campaign=${campaign}`),
        e,
      );
      const reading = await handleEdgeRequest(
        new Request(`https://kodranni.com/api/session?campaign=${campaign}`),
        e,
      );
      const deskWrite = await handleEdgeRequest(
        new Request(`https://kodranni.com/api/desk/table?campaign=${campaign}`, { method: 'POST' }),
        e,
      );
      expect(session.status).toBe(200);
      expect(await session.text()).toContain('https://origin.example/session/');
      expect(reading.status).toBe(200);
      expect(await reading.text()).toContain('https://origin.example/api/session');
      expect(deskWrite.status).toBe(404);
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

  it('swaps a die token for the guild emoji before the channel post', async () => {
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
    const channelId = '223456789012345678';
    const body = JSON.stringify({
      op: 'send',
      channelId,
      payload: { content: 'rolled {{kod-die:d8}} {{kod-die:d6}}' },
    });
    const prev = globalThis.fetch;
    const posted: string[] = [];
    globalThis.fetch = async (input, init) => {
      const u = String(input instanceof Request ? input.url : input);
      if (u.endsWith(`/channels/${channelId}`)) {
        return new Response(JSON.stringify({ guild_id: '323456789012345678' }), { status: 200 });
      }
      if (u.endsWith('/emojis')) {
        return new Response(JSON.stringify([{ name: 'd8', id: '423456789012345678' }]), {
          status: 200,
        });
      }
      posted.push(String(init?.body ?? ''));
      return new Response(JSON.stringify({ id: 'm2' }), {
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
      expect(posted[0]).toContain('<:d8:423456789012345678>');
      expect(posted[0]).toContain('🎲');
      expect(posted[0]).not.toContain('{{kod-die:');
    } finally {
      globalThis.fetch = prev;
    }
  });

  it('lists Discord guilds for the desk picker without exposing the bot token to the host', async () => {
    const e = {
      ...env(),
      DISCORD_BOT_TOKEN: 'bot-secret',
      DISCORD_APP_ID: 'app-1',
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
    const prev = globalThis.fetch;
    globalThis.fetch = async (input) => {
      const u = String(input instanceof Request ? input.url : input);
      expect(u).toBe('https://discord.com/api/v10/users/@me/guilds');
      return new Response(JSON.stringify([{ id: '111111111111111111', name: 'Table' }]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    };
    try {
      const appBody = JSON.stringify({ op: 'app' });
      const app = await handleEdgeRequest(
        new Request(`https://face.example/control/discord/rest?campaign=${campaign}`, {
          method: 'POST',
          headers: { authorization: `Bearer ${campaign}:${sign(deviceKey, appBody)}` },
          body: appBody,
        }),
        e,
      );
      expect(app.status).toBe(200);
      const appJson = (await app.json()) as { invite: string };
      expect(appJson.invite).toContain('client_id=app-1');

      const gBody = JSON.stringify({ op: 'guilds' });
      const res = await handleEdgeRequest(
        new Request(`https://face.example/control/discord/rest?campaign=${campaign}`, {
          method: 'POST',
          headers: { authorization: `Bearer ${campaign}:${sign(deviceKey, gBody)}` },
          body: gBody,
        }),
        e,
      );
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        guilds: [{ id: '111111111111111111', name: 'Table' }],
      });
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

  it('rejects snapshots larger than 1 MB', async () => {
    const e = env();
    const campaign = 'big';
    const deviceKey = 'k'.repeat(32);
    await handleEdgeRequest(
      new Request(`https://face.example/control/register?campaign=${campaign}`, {
        method: 'POST',
        body: JSON.stringify({ deviceKey }),
      }),
      e,
    );
    const body = JSON.stringify({
      generatedAt: 't',
      community: { slug: 'big', name: 'B' },
      characters: [],
      pad: 'x'.repeat(1_000_001),
    });
    const put = await handleEdgeRequest(
      new Request(`https://face.example/api/snapshot?campaign=${campaign}`, {
        method: 'PUT',
        headers: { authorization: `Bearer ${campaign}:${sign(deviceKey, body)}` },
        body,
      }),
      e,
    );
    expect(put.status).toBe(413);
  });

  it('refuses a fourth campaign on the same device key', async () => {
    const e = env();
    const deviceKey = 'm'.repeat(32);
    for (let i = 0; i < MAX_CAMPAIGNS_PER_DEVICE; i++) {
      const res = await handleEdgeRequest(
        new Request(`https://face.example/control/register?campaign=c${i}`, {
          method: 'POST',
          body: JSON.stringify({ deviceKey }),
        }),
        e,
      );
      expect(res.status).toBe(200);
    }
    const fourth = await handleEdgeRequest(
      new Request('https://face.example/control/register?campaign=c3', {
        method: 'POST',
        body: JSON.stringify({ deviceKey }),
      }),
      e,
    );
    expect(fourth.status).toBe(403);
  });

  it('serves a published portrait when the hall is dark and drops it from the index', async () => {
    const e = env();
    const campaign = 'vardmark';
    const deviceKey = 'p'.repeat(32);
    await handleEdgeRequest(
      new Request(`https://face.example/control/register?campaign=${campaign}`, {
        method: 'POST',
        body: JSON.stringify({ deviceKey }),
      }),
      e,
    );
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
    const keep = JSON.stringify({ type: 'image/jpeg', data: jpeg.toString('base64') });
    const drop = JSON.stringify({
      type: 'image/png',
      data: Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString('base64'),
    });
    const putKeep = await handleEdgeRequest(
      new Request(`https://face.example/api/avatar/jakov?campaign=${campaign}`, {
        method: 'PUT',
        headers: { authorization: `Bearer ${campaign}:${sign(deviceKey, keep)}` },
        body: keep,
      }),
      e,
    );
    const putDrop = await handleEdgeRequest(
      new Request(`https://face.example/api/avatar/ghilzai?campaign=${campaign}`, {
        method: 'PUT',
        headers: { authorization: `Bearer ${campaign}:${sign(deviceKey, drop)}` },
        body: drop,
      }),
      e,
    );
    expect(putKeep.status).toBe(200);
    expect(putDrop.status).toBe(200);
    const both = JSON.stringify({ slugs: ['jakov', 'ghilzai'] });
    const indexed = await handleEdgeRequest(
      new Request(`https://face.example/api/avatar-index?campaign=${campaign}`, {
        method: 'PUT',
        headers: { authorization: `Bearer ${campaign}:${sign(deviceKey, both)}` },
        body: both,
      }),
      e,
    );
    expect(indexed.status).toBe(200);

    const dark = await handleEdgeRequest(
      new Request('https://demo.kodranni.com/api/avatar/jakov'),
      e,
    );
    expect(dark.status).toBe(200);
    expect(dark.headers.get('content-type')).toBe('image/jpeg');
    expect(Buffer.from(await dark.arrayBuffer())).toEqual(jpeg);

    const index = JSON.stringify({ slugs: ['jakov'] });
    const pruned = await handleEdgeRequest(
      new Request(`https://face.example/api/avatar-index?campaign=${campaign}`, {
        method: 'PUT',
        headers: { authorization: `Bearer ${campaign}:${sign(deviceKey, index)}` },
        body: index,
      }),
      e,
    );
    expect(pruned.status).toBe(200);
    const gone = await handleEdgeRequest(
      new Request('https://demo.kodranni.com/api/avatar/ghilzai'),
      e,
    );
    expect(gone.status).toBe(404);
    expect(await e.CAMPAIGNS.get(avatarKvKey(campaign, 'ghilzai'))).toBeNull();
    expect(await e.CAMPAIGNS.get(avatarIndexKey(campaign))).toContain('jakov');

    const refused = await handleEdgeRequest(
      new Request(`https://face.example/api/avatar/jakov?campaign=${campaign}`, {
        method: 'PUT',
        headers: { authorization: `Bearer ${campaign}:${sign('nope'.repeat(8), keep)}` },
        body: keep,
      }),
      e,
    );
    expect(refused.status).toBe(401);

    const weird = JSON.stringify({ type: 'text/plain', data: jpeg.toString('base64') });
    const badType = await handleEdgeRequest(
      new Request(`https://face.example/api/avatar/jakov?campaign=${campaign}`, {
        method: 'PUT',
        headers: { authorization: `Bearer ${campaign}:${sign(deviceKey, weird)}` },
        body: weird,
      }),
      e,
    );
    expect(badType.status).toBe(400);
  });

  it('proxies a portrait to the live hall instead of the stored copy', async () => {
    const e = env();
    const campaign = 'vardmark';
    await e.CAMPAIGNS.put(
      avatarKvKey(campaign, 'jakov'),
      `image/jpeg\n${Buffer.from('stored').toString('base64')}`,
    );
    await e.CAMPAIGNS.put(kvKey(campaign, 'origin'), 'https://origin.example');
    const prev = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response('from-live', { status: 200, headers: { 'content-type': 'image/jpeg' } });
    try {
      const res = await handleEdgeRequest(
        new Request('https://demo.kodranni.com/api/avatar/jakov'),
        e,
      );
      expect(res.status).toBe(200);
      expect(await res.text()).toBe('from-live');
    } finally {
      globalThis.fetch = prev;
    }
  });

  it('tombstones campaigns with no activity for 90 days', async () => {
    const e = env();
    const campaign = 'old';
    const deviceKey = 'n'.repeat(32);
    await handleEdgeRequest(
      new Request(`https://face.example/control/register?campaign=${campaign}`, {
        method: 'POST',
        body: JSON.stringify({ deviceKey }),
      }),
      e,
    );
    await e.CAMPAIGNS.put(avatarKvKey(campaign, 'jakov'), 'image/jpeg\nYQ==');
    await e.CAMPAIGNS.put(avatarIndexKey(campaign), JSON.stringify({ slugs: ['jakov'] }));
    await e.CAMPAIGNS.put(pictureKvKey(campaign, 'fortune-vitality-a.jpg'), 'image/jpeg\nYQ==');
    await e.CAMPAIGNS.put(
      pictureIndexKey(campaign),
      JSON.stringify({ files: ['fortune-vitality-a.jpg'] }),
    );
    const { tombstoned } = await gcInactiveCampaigns(e, Date.now() + INACTIVE_MS + 1000);
    expect(tombstoned).toContain(campaign);
    expect(await e.CAMPAIGNS.get(avatarKvKey(campaign, 'jakov'))).toBeNull();
    expect(await e.CAMPAIGNS.get(pictureKvKey(campaign, 'fortune-vitality-a.jpg'))).toBeNull();
    expect(await e.CAMPAIGNS.get(pictureIndexKey(campaign))).toBeNull();
  });

  it('serves a published picture on the fortune and item urls when the hall is dark', async () => {
    const e = env();
    const campaign = 'vardmark';
    const deviceKey = 'q'.repeat(32);
    await handleEdgeRequest(
      new Request(`https://face.example/control/register?campaign=${campaign}`, {
        method: 'POST',
        body: JSON.stringify({ deviceKey }),
      }),
      e,
    );
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
    const keep = JSON.stringify({ type: 'image/jpeg', data: jpeg.toString('base64') });
    const drop = JSON.stringify({ type: 'image/png', data: png.toString('base64') });
    const putKeep = await handleEdgeRequest(
      new Request(`https://face.example/api/picture/fortune-vitality-a.jpg?campaign=${campaign}`, {
        method: 'PUT',
        headers: { authorization: `Bearer ${campaign}:${sign(deviceKey, keep)}` },
        body: keep,
      }),
      e,
    );
    const putDrop = await handleEdgeRequest(
      new Request(`https://face.example/api/picture/label-old-a.png?campaign=${campaign}`, {
        method: 'PUT',
        headers: { authorization: `Bearer ${campaign}:${sign(deviceKey, drop)}` },
        body: drop,
      }),
      e,
    );
    expect(putKeep.status).toBe(200);
    expect(putDrop.status).toBe(200);
    const both = JSON.stringify({ files: ['fortune-vitality-a.jpg', 'label-old-a.png'] });
    const indexed = await handleEdgeRequest(
      new Request(`https://face.example/api/picture-index?campaign=${campaign}`, {
        method: 'PUT',
        headers: { authorization: `Bearer ${campaign}:${sign(deviceKey, both)}` },
        body: both,
      }),
      e,
    );
    expect(indexed.status).toBe(200);

    const fortune = await handleEdgeRequest(
      new Request('https://demo.kodranni.com/api/fortune-icon?file=fortune-vitality-a.jpg'),
      e,
    );
    expect(fortune.status).toBe(200);
    expect(fortune.headers.get('content-type')).toBe('image/jpeg');
    expect(fortune.headers.get('cache-control')).toBe('no-store');
    expect(Buffer.from(await fortune.arrayBuffer())).toEqual(jpeg);

    const item = await handleEdgeRequest(
      new Request('https://demo.kodranni.com/api/character/jakov/item-icon?file=fortune-vitality-a.jpg'),
      e,
    );
    expect(item.status).toBe(200);
    expect(Buffer.from(await item.arrayBuffer())).toEqual(jpeg);

    const index = JSON.stringify({ files: ['fortune-vitality-a.jpg'] });
    const pruned = await handleEdgeRequest(
      new Request(`https://face.example/api/picture-index?campaign=${campaign}`, {
        method: 'PUT',
        headers: { authorization: `Bearer ${campaign}:${sign(deviceKey, index)}` },
        body: index,
      }),
      e,
    );
    expect(pruned.status).toBe(200);
    const gone = await handleEdgeRequest(
      new Request('https://demo.kodranni.com/api/fortune-icon?file=label-old-a.png'),
      e,
    );
    expect(gone.status).toBe(404);
    expect(await gone.text()).toBe('File missing');
    expect(await e.CAMPAIGNS.get(pictureKvKey(campaign, 'label-old-a.png'))).toBeNull();
    expect(await e.CAMPAIGNS.get(pictureIndexKey(campaign))).toContain('fortune-vitality-a.jpg');

    const slipped = await handleEdgeRequest(
      new Request('https://demo.kodranni.com/api/fortune-icon?file=../secret.png'),
      e,
    );
    expect(slipped.status).toBe(400);

    const refused = await handleEdgeRequest(
      new Request(`https://face.example/api/picture/fortune-vitality-a.jpg?campaign=${campaign}`, {
        method: 'PUT',
        headers: { authorization: `Bearer ${campaign}:${sign('nope'.repeat(8), keep)}` },
        body: keep,
      }),
      e,
    );
    expect(refused.status).toBe(401);

    const weird = JSON.stringify({ type: 'text/plain', data: jpeg.toString('base64') });
    const badType = await handleEdgeRequest(
      new Request(`https://face.example/api/picture/fortune-vitality-a.jpg?campaign=${campaign}`, {
        method: 'PUT',
        headers: { authorization: `Bearer ${campaign}:${sign(deviceKey, weird)}` },
        body: weird,
      }),
      e,
    );
    expect(badType.status).toBe(400);
  });

  it('proxies a picture to the live hall and keeps a live 404', async () => {
    const e = env();
    const campaign = 'vardmark';
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
    await e.CAMPAIGNS.put(
      pictureKvKey(campaign, 'fortune-vitality-a.jpg'),
      `image/jpeg\n${jpeg.toString('base64')}`,
    );
    await e.CAMPAIGNS.put(kvKey(campaign, 'origin'), 'https://origin.example');
    const prev = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response('from-live', { status: 200, headers: { 'content-type': 'image/jpeg' } });
    try {
      const live = await handleEdgeRequest(
        new Request('https://demo.kodranni.com/api/fortune-icon?file=fortune-vitality-a.jpg'),
        e,
      );
      expect(live.status).toBe(200);
      expect(await live.text()).toBe('from-live');
    } finally {
      globalThis.fetch = prev;
    }

    globalThis.fetch = async () => new Response('missing-live', { status: 404 });
    try {
      const missing = await handleEdgeRequest(
        new Request('https://demo.kodranni.com/api/character/jakov/item-icon?file=fortune-vitality-a.jpg'),
        e,
      );
      expect(missing.status).toBe(404);
      expect(await missing.text()).toBe('missing-live');
    } finally {
      globalThis.fetch = prev;
    }
  });
});
