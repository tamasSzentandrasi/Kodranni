import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { campaignFromUrl, handleEdgeRequest, kvKey, type KvLike } from '../src/handler.js';

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
  return { CAMPAIGNS: new MemoryKv(), DEVICE_KEYS: new MemoryKv() };
}

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

    const html = await handleEdgeRequest(
      new Request(`https://face.example/?campaign=${campaign}`),
      e,
    );
    expect(html.status).toBe(200);
    expect(await html.text()).toContain('The Vardmark');
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
      new Request(`https://face.example/?campaign=${campaign}`),
      { ...e, LIVE_PROXY_TIMEOUT_MS: '50' },
    );
    expect(page.status).toBe(200);
    expect(await page.text()).toContain('Y');
    expect(await e.CAMPAIGNS.get(kvKey(campaign, 'origin'))).toBe('');
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
