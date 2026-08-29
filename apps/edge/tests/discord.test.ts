import { generateKeyPairSync, sign as nodeSign } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { handleDiscordInteraction } from '../src/discord.js';
import { handleEdgeRequest } from '../src/handler.js';

function keypair() {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const jwk = publicKey.export({ format: 'jwk' });
  const pubHex = Buffer.from(jwk.x as string, 'base64url').toString('hex');
  return { pubHex, privateKey };
}

function signedRequest(priv: ReturnType<typeof generateKeyPairSync>['privateKey'], body: string) {
  const ts = String(Math.floor(Date.now() / 1000));
  const sig = nodeSign(null, Buffer.from(ts + body), priv).toString('hex');
  return new Request('https://kodranni.com/interactions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-signature-ed25519': sig,
      'x-signature-timestamp': ts,
    },
    body,
  });
}

class MemoryKv {
  store = new Map<string, string>();
  async get(key: string) {
    return this.store.get(key) ?? null;
  }
  async put(key: string, value: string) {
    this.store.set(key, value);
  }
}

describe('Discord HTTP', () => {
  it('rejects a bad signature', async () => {
    const { pubHex } = keypair();
    const res = await handleDiscordInteraction(
      new Request('https://kodranni.com/interactions', {
        method: 'POST',
        headers: {
          'x-signature-ed25519': '00'.repeat(64),
          'x-signature-timestamp': '1',
        },
        body: '{}',
      }),
      { CAMPAIGNS: new MemoryKv(), DISCORD_PUBLIC_KEY: pubHex },
    );
    expect(res.status).toBe(401);
  });

  it('PONGs a PING', async () => {
    const { pubHex, privateKey } = keypair();
    const body = JSON.stringify({ type: 1 });
    const res = await handleDiscordInteraction(signedRequest(privateKey, body), {
      CAMPAIGNS: new MemoryKv(),
      DISCORD_PUBLIC_KEY: pubHex,
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ type: 1 });
  });

  it('answers skill autocomplete from the domain catalog', async () => {
    const { pubHex, privateKey } = keypair();
    const body = JSON.stringify({
      type: 4,
      data: { name: 'roll', options: [{ name: 'skill', value: 'cra', focused: true }] },
    });
    const res = await handleDiscordInteraction(signedRequest(privateKey, body), {
      CAMPAIGNS: new MemoryKv(),
      DISCORD_PUBLIC_KEY: pubHex,
    });
    const json = (await res.json()) as { type: number; data: { choices: { value: string }[] } };
    expect(json.type).toBe(8);
    expect(json.data.choices.length).toBeGreaterThan(0);
  });

  it('replies dark when origin is unset', async () => {
    const { pubHex, privateKey } = keypair();
    const kv = new MemoryKv();
    const body = JSON.stringify({ type: 2, guild_id: '1', data: { name: 'roll' } });
    const res = await handleEdgeRequest(signedRequest(privateKey, body), {
      CAMPAIGNS: kv,
      DEVICE_KEYS: new MemoryKv(),
      DEFAULT_CAMPAIGN: 'vardmark',
      DISCORD_PUBLIC_KEY: pubHex,
    } as any);
    const json = (await res.json()) as { type: number; data: { content: string } };
    expect(json.type).toBe(4);
    expect(json.data.content).toContain('not live');
  });
});
