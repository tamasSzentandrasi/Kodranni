export const prerender = false;

import { ensureEdgeDeviceKey } from '@kodranni/store';
import { verifyDeviceHmac } from '../../lib/device-hmac';
import { discordHttpEnabled, receiveDiscordInteraction } from '../../lib/discord-boot';
import { resolveCampaignSlug } from '../../lib/campaign-paths';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

/** POST /internal/discord — Worker forwards verified Discord interactions (HMAC). */
export async function POST({ request }: { request: Request }) {
  if (!discordHttpEnabled()) return json({ error: 'discord http disabled' }, 404);
  const campaign =
    request.headers.get('x-kodranni-campaign')?.trim() || resolveCampaignSlug() || '';
  if (!campaign) return json({ error: 'missing campaign' }, 400);
  const body = await request.text();
  try {
    ensureEdgeDeviceKey();
  } catch {
    return json({ error: 'no device key' }, 401);
  }
  if (!verifyDeviceHmac(campaign, body, request.headers.get('authorization'))) {
    return json({ error: 'unauthorized' }, 401);
  }
  let raw: unknown;
  try {
    raw = JSON.parse(body);
  } catch {
    return json({ error: 'invalid json' }, 400);
  }
  try {
    await receiveDiscordInteraction(raw);
    return json({ ok: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
}
