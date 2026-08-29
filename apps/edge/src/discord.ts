import { filterSkillSuggestions } from '@kodranni/domain';

type Kv = { get(key: string): Promise<string | null> };
type EdgeLike = {
  CAMPAIGNS: Kv;
  DEVICE_KEYS?: Kv;
  DEFAULT_CAMPAIGN?: string;
  DISCORD_PUBLIC_KEY?: string;
};

const PING = 1;
const COMMAND = 2;
const COMPONENT = 3;
const AUTOCOMPLETE = 4;
const PONG = 1;
const CHANNEL_MESSAGE = 4;
const DEFERRED_CHANNEL = 5;
const AUTOCOMPLETE_RESULT = 8;
const DEFERRED_UPDATE = 6;
const FLAG_EPHEMERAL = 1 << 6;

export async function handleDiscordInteraction(
  request: Request,
  env: EdgeLike,
  waitUntil?: (p: Promise<unknown>) => void,
): Promise<Response> {
  const sig = request.headers.get('x-signature-ed25519');
  const ts = request.headers.get('x-signature-timestamp');
  const raw = await request.text();
  const pub = env.DISCORD_PUBLIC_KEY?.trim();
  if (!sig || !ts || !pub) return new Response('Bad request signature.', { status: 401 });
  if (!(await verifyDiscord(pub, ts, raw, sig))) {
    return new Response('Bad request signature.', { status: 401 });
  }
  let ix: DiscordIx;
  try {
    ix = JSON.parse(raw) as DiscordIx;
  } catch {
    return json({ error: 'invalid json' }, 400);
  }
  if (ix.type === PING) return json({ type: PONG });
  if (ix.type === AUTOCOMPLETE) return json({ type: AUTOCOMPLETE_RESULT, data: { choices: skillChoices(ix) } });

  const campaign = await campaignForGuild(env, ix.guild_id);
  if (!campaign) {
    return json({
      type: CHANNEL_MESSAGE,
      data: {
        flags: FLAG_EPHEMERAL,
        content: 'This server is not bound to a Kodranni table.',
      },
    });
  }
  const origin = await env.CAMPAIGNS.get(`campaign:${campaign}:origin`);
  if (!origin) {
    const archive = archiveUrl(request, campaign);
    return json({
      type: CHANNEL_MESSAGE,
      data: {
        flags: FLAG_EPHEMERAL,
        content: `The table is not live. Archive: ${archive}`,
      },
    });
  }
  const deferred =
    ix.type === COMPONENT
      ? { type: DEFERRED_UPDATE }
      : { type: DEFERRED_CHANNEL, data: { flags: FLAG_EPHEMERAL } };
  const work = forwardToHost(origin, campaign, raw, env).catch(() => undefined);
  if (waitUntil) waitUntil(work);
  else void work;
  return json(deferred);
}

type DiscordIx = {
  type: number;
  guild_id?: string;
  token?: string;
  application_id?: string;
  data?: { name?: string; options?: { name: string; value?: string; focused?: boolean }[] };
};

function skillChoices(ix: DiscordIx): { name: string; value: string }[] {
  const focused = ix.data?.options?.find((o) => o.focused) ?? ix.data?.options?.find((o) => o.name === 'skill');
  const q = String(focused?.value ?? '');
  return filterSkillSuggestions(q, 25).map((p) => ({
    name: `${p.name} · ${p.foundation}`.slice(0, 100),
    value: p.value.slice(0, 100),
  }));
}

async function campaignForGuild(env: EdgeLike, guildId?: string): Promise<string | null> {
  if (!guildId) return env.DEFAULT_CAMPAIGN?.trim() || null;
  const mapped = await env.CAMPAIGNS.get(`guild:${guildId}`);
  return mapped || env.DEFAULT_CAMPAIGN?.trim() || null;
}

function archiveUrl(request: Request, campaign: string): string {
  const host = new URL(request.url).host;
  if (host === 'demo.kodranni.com' || host === 'play.kodranni.com') return `https://${host}/community/`;
  return `https://kodranni.com/community/?campaign=${encodeURIComponent(campaign)}`;
}

async function forwardToHost(
  origin: string,
  campaign: string,
  raw: string,
  env: EdgeLike & { DEVICE_KEYS?: { get(key: string): Promise<string | null> } },
): Promise<void> {
  const dest = new URL('/internal/discord', origin);
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'x-kodranni-campaign': campaign,
  };
  const deviceKey = env.DEVICE_KEYS ? await env.DEVICE_KEYS.get(campaign) : null;
  if (deviceKey) {
    headers.authorization = `Bearer ${campaign}:${await hmacHexLocal(deviceKey, raw)}`;
  }
  await fetch(dest, {
    method: 'POST',
    headers,
    body: raw,
    signal: AbortSignal.timeout(12_000),
  });
}

export async function verifyDiscord(
  publicKeyHex: string,
  timestamp: string,
  body: string,
  signatureHex: string,
): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      hexToBytes(publicKeyHex),
      { name: 'Ed25519' },
      false,
      ['verify'],
    );
    const msg = new TextEncoder().encode(timestamp + body);
    return await crypto.subtle.verify({ name: 'Ed25519' }, key, hexToBytes(signatureHex), msg);
  } catch {
    return false;
  }
}

async function hmacHexLocal(key: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
  const h = hex.trim().replace(/^0x/, '');
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
