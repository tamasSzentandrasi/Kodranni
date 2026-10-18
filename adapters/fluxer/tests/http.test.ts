import { describe, expect, it } from 'vitest';
import { createFluxerAdapter } from '../src/index.js';

const CHANNEL = '100000000000000101';
const MESSAGE = '100000000000000202';

function capture() {
  const calls: { method: string; url: string; authorization: string | null; body?: string }[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    const headers = new Headers(init?.headers);
    calls.push({
      method: init?.method ?? 'GET',
      url: String(input),
      authorization: headers.get('authorization'),
      body: typeof init?.body === 'string' ? init.body : undefined,
    });
    if ((init?.method ?? 'GET') === 'POST') {
      return new Response(JSON.stringify({ id: MESSAGE }), { status: 200 });
    }
    return new Response(null, { status: 204 });
  };
  return { calls, fetchImpl };
}

describe('fluxer HTTP cards', () => {
  it('posts the embed and one reaction per enabled button', async () => {
    const { calls, fetchImpl } = capture();
    const port = createFluxerAdapter({
      token: 't',
      guildId: '100000000000000099',
      apiBase: 'http://fluxer.test/api/v1',
      fetch: fetchImpl,
    });
    const ref = await port.sendCard(CHANNEL, {
      title: 'The Tide',
      description: 'The marker stands at 8 of 15.',
      buttons: [
        { id: 'tide-close', label: 'Close' },
        { id: 'oppose:1', label: 'Oppose', disabled: true },
        { id: 'why-pool:1', label: 'Why this pool?' },
      ],
    });
    expect(ref).toEqual({ platform: 'fluxer', channelId: CHANNEL, messageId: MESSAGE });
    expect(calls.map((call) => call.method)).toEqual(['POST', 'PUT', 'PUT']);
    expect(calls[0]?.url).toBe(`http://fluxer.test/api/v1/channels/${CHANNEL}/messages`);
    expect(calls[0]?.authorization).toBe('Bot t');
    const posted = JSON.parse(calls[0]?.body ?? '{}') as { embeds?: unknown; components?: unknown };
    expect(posted.components).toBeUndefined();
    expect(posted.embeds).toEqual([
      expect.objectContaining({ title: 'The Tide', description: 'The marker stands at 8 of 15.' }),
    ]);
    expect(calls[1]?.url).toBe(
      `http://fluxer.test/api/v1/channels/${CHANNEL}/messages/${MESSAGE}/reactions/${encodeURIComponent('✕')}/@me`,
    );
    expect(calls[2]?.url).toContain(encodeURIComponent('❓'));
    expect(calls[1]?.body).toBeUndefined();
    expect(calls.every((call) => call.authorization === 'Bot t')).toBe(true);
  });

  it('uses the public Fluxer API when no base is passed', async () => {
    const { calls, fetchImpl } = capture();
    const port = createFluxerAdapter({ token: 't', guildId: 'g', fetch: fetchImpl });
    await port.sendCard(CHANNEL, { title: 'x' });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe(`https://web.fluxer.app/api/v1/channels/${CHANNEL}/messages`);
    expect(JSON.parse(calls[0]?.body ?? '{}')).not.toHaveProperty('components');
  });

  it('clears reactions when the edited card has none, and replaces them otherwise', async () => {
    const { calls, fetchImpl } = capture();
    const port = createFluxerAdapter({
      token: 't',
      guildId: 'g',
      apiBase: 'http://fluxer.test/api/v1/',
      fetch: fetchImpl,
    });
    const ref = { platform: 'fluxer' as const, channelId: CHANNEL, messageId: MESSAGE };
    await port.editCard(ref, { title: 'Spent' });
    expect(calls.map((call) => call.method)).toEqual(['PATCH', 'DELETE']);
    expect(calls[1]?.url).toBe(
      `http://fluxer.test/api/v1/channels/${CHANNEL}/messages/${MESSAGE}/reactions`,
    );
    calls.length = 0;
    await port.editCard(ref, {
      title: 'Open',
      buttons: [{ id: 'tide-roll', label: 'Roll' }],
    });
    expect(calls.map((call) => call.method)).toEqual(['PATCH', 'DELETE', 'PUT']);
    expect(calls[2]?.url).toContain(`/reactions/${encodeURIComponent('🎲')}/@me`);
  });

  it('refuses to call out without a token', async () => {
    const { calls, fetchImpl } = capture();
    const port = createFluxerAdapter({ token: '  ', guildId: 'g', fetch: fetchImpl });
    await expect(port.sendCard(CHANNEL, { title: 'x' })).rejects.toThrow('fluxer token is missing');
    expect(calls).toHaveLength(0);
  });
});
