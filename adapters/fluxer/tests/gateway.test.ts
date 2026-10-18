import { describe, expect, it } from 'vitest';
import { createFluxerAdapter } from '../src/index.js';
import { createFluxerGateway, FLUXER_GATEWAY_URL, type FluxerSocket } from '../src/gateway.js';

class FakeSocket implements FluxerSocket {
  static opened: FakeSocket[] = [];
  sent: string[] = [];
  private listeners: Record<string, ((ev: { data?: unknown; code?: number }) => void)[]> = {};
  constructor(public url: string) {
    FakeSocket.opened.push(this);
    queueMicrotask(() => this.emit('open', {}));
  }
  addEventListener(
    type: 'open' | 'message' | 'close' | 'error',
    fn: (ev: { data?: unknown; code?: number }) => void,
  ) {
    (this.listeners[type] ??= []).push(fn);
  }
  send(data: string) {
    this.sent.push(data);
  }
  close() {
    this.emit('close', { code: 1000 });
  }
  emit(type: string, ev: { data?: unknown; code?: number }) {
    for (const fn of this.listeners[type] ?? []) fn(ev);
  }
}

function hello(socket: FakeSocket) {
  socket.emit('message', { data: JSON.stringify({ op: 10, d: { heartbeat_interval: 60_000 } }) });
}

function ready(socket: FakeSocket) {
  socket.emit('message', {
    data: JSON.stringify({ op: 0, t: 'READY', s: 1, d: { session_id: 'sess', user: { id: 'bot-1' } } }),
  });
}

describe('fluxer gateway', () => {
  it('identifies after hello and does not put the token in a close error', async () => {
    FakeSocket.opened = [];
    const gw = createFluxerGateway({ token: 'secret-token', WebSocket: FakeSocket });
    const starting = gw.start();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const socket = FakeSocket.opened[0]!;
    expect(socket.url).toBe(FLUXER_GATEWAY_URL);
    hello(socket);
    await new Promise((resolve) => setTimeout(resolve, 0));
    const identify = socket.sent
      .map((line) => JSON.parse(line) as { op: number; d?: { token?: string; intents?: number; initial_guild_id?: string } })
      .find((packet) => packet.op === 2);
    expect(identify?.d?.token).toBe('secret-token');
    expect(identify?.d?.intents).toBeUndefined();
    expect(identify?.d?.initial_guild_id).toBeUndefined();
    socket.close();
    await expect(starting).rejects.toThrow('fluxer gateway closed');
    gw.stop();
  });

  it('turns a prefix message and a card reaction into interactions', async () => {
    FakeSocket.opened = [];
    const calls: { method: string; url: string; body?: string }[] = [];
    const fetchImpl: typeof fetch = async (url, init) => {
      calls.push({
        method: init?.method ?? 'GET',
        url: String(url),
        body: typeof init?.body === 'string' ? init.body : undefined,
      });
      if (String(url).endsWith('/messages')) {
        return new Response(JSON.stringify({ id: 'msg-1' }), { status: 200 });
      }
      return new Response(null, { status: 204 });
    };
    const seen: string[] = [];
    const port = createFluxerAdapter({
      token: 't',
      guildId: 'guild-1',
      playChannelId: 'channel-1',
      fetch: fetchImpl,
      gateway: { WebSocket: FakeSocket },
    });
    port.onInteraction(async (interaction) => {
      seen.push(interaction.type === 'command' ? interaction.name : interaction.customId);
    });
    const starting = port.start();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const socket = FakeSocket.opened[0]!;
    hello(socket);
    const identify = socket.sent
      .map((line) => JSON.parse(line) as { op: number; d?: { initial_guild_id?: string; token?: string } })
      .find((packet) => packet.op === 2);
    expect(identify?.d?.initial_guild_id).toBe('guild-1');
    expect(identify?.d?.token).toBe('t');
    ready(socket);
    await starting;
    await port.sendCard('channel-1', {
      title: 'Roll',
      description: 'posted',
      buttons: [{ id: 'oppose:roll-1', label: 'Oppose' }],
    });
    socket.emit('message', {
      data: JSON.stringify({
        op: 0,
        t: 'MESSAGE_CREATE',
        s: 2,
        d: {
          id: 'm-2',
          channel_id: 'channel-1',
          guild_id: 'guild-1',
          content: '!roll Marino Orvanti',
          author: { id: 'user-1', username: 'ada' },
          member: { roles: ['role-st'], nick: 'Ada' },
        },
      }),
    });
    socket.emit('message', {
      data: JSON.stringify({
        op: 0,
        t: 'MESSAGE_REACTION_ADD',
        s: 3,
        d: {
          user_id: 'bot-1',
          channel_id: 'channel-1',
          guild_id: 'guild-1',
          message_id: 'msg-1',
          emoji: { name: '⚔' },
        },
      }),
    });
    socket.emit('message', {
      data: JSON.stringify({
        op: 0,
        t: 'MESSAGE_REACTION_ADD',
        s: 4,
        d: {
          user_id: 'user-1',
          channel_id: 'channel-1',
          guild_id: 'guild-1',
          message_id: 'msg-1',
          emoji: { name: '⚔' },
          member: { roles: ['role-st'] },
        },
      }),
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(seen).toEqual(['roll', 'oppose:roll-1']);
    expect(calls.some((call) => call.method === 'POST' && call.url.includes('/messages'))).toBe(true);
    expect(calls.every((call) => call.url.startsWith('https://api.fluxer.app/v1/'))).toBe(true);
    await port.stop();
  });
});
