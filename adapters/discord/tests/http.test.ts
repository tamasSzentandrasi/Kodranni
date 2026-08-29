import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import { createDiscordHttpAdapter, mapRawDiscordInteraction } from '../src/http.js';

const prevFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = prevFetch;
});

describe('mapRawDiscordInteraction', () => {
  it('maps a slash command and flattens user options', () => {
    const mapped = mapRawDiscordInteraction({
      id: 'ix1',
      type: 2,
      token: 'tok',
      application_id: 'app',
      guild_id: 'g1',
      channel_id: 'c1',
      member: { user: { id: 'u1', username: 'ada' }, roles: ['st'] },
      data: {
        name: 'intent',
        options: [
          { name: 'player', type: 6, value: 'u2' },
          { name: 'skill', type: 3, value: 'Craft' },
        ],
      },
    });
    expect(mapped).toMatchObject({
      type: 'command',
      name: 'intent',
      user: { accountId: 'u1', roleIds: ['st'] },
      options: { player: 'u2', skill: 'Craft' },
    });
  });

  it('maps buttons and selects', () => {
    expect(
      mapRawDiscordInteraction({
        id: 'b1',
        type: 3,
        token: 'tok',
        application_id: 'app',
        channel_id: 'c1',
        user: { id: 'u1' },
        data: { custom_id: 'roll-cast:x', component_type: 2 },
        message: { id: 'm1' },
      }),
    ).toMatchObject({ type: 'button', customId: 'roll-cast:x', messageRef: { messageId: 'm1' } });
    expect(
      mapRawDiscordInteraction({
        id: 's1',
        type: 3,
        token: 'tok',
        application_id: 'app',
        channel_id: 'c1',
        user: { id: 'u1' },
        data: { custom_id: 'roll-arch:x', component_type: 3, values: ['warrior'] },
      }),
    ).toMatchObject({ type: 'select', values: ['warrior'] });
  });
});

describe('createDiscordHttpAdapter', () => {
  it('replies to commands via webhook @original and sends cards via the Worker', async () => {
    const calls: { url: string; method: string; body: string }[] = [];
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input instanceof Request ? input.url : input);
      const body = typeof init?.body === 'string' ? init.body : '';
      calls.push({ url, method: init?.method ?? 'GET', body });
      if (url.includes('/control/discord/rest')) {
        return new Response(JSON.stringify({ id: 'msg9' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response('{}', { status: 200 });
    }) as typeof fetch;

    const port = createDiscordHttpAdapter({
      campaignId: 'vardmark',
      edgeUrl: 'https://edge.test',
      deviceKey: 'k'.repeat(32),
      applicationId: 'app',
    });
    const seen: string[] = [];
    port.onInteraction(async (i) => {
      seen.push(i.type);
      if (i.type === 'command') await port.replyEphemeral(i, 'ok');
    });

    await port.receive({
      id: 'ix1',
      type: 2,
      token: 'tok',
      application_id: 'app',
      channel_id: 'c1',
      user: { id: 'u1' },
      data: { name: 'live' },
    });
    expect(seen).toEqual(['command']);
    expect(calls.some((c) => c.url.includes('/webhooks/app/tok/messages/@original'))).toBe(true);

    const ref = await port.sendCard('c1', { title: 'Session', description: 'live' });
    expect(ref.messageId).toBe('msg9');
    const rest = calls.find((c) => c.url.includes('/control/discord/rest'));
    expect(rest).toBeTruthy();
    const expectedSig = createHmac('sha256', 'k'.repeat(32)).update(rest!.body).digest('hex');
    expect(rest!.url).toContain('campaign=vardmark');
    expect(JSON.parse(rest!.body).op).toBe('send');
    void expectedSig;
  });
});
