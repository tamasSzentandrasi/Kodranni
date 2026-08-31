export const prerender = false;

import {
  applyMachineDefaults,
  defaultCampaignTomlPath,
  readCampaignConfig,
  writeCampaignConfig,
} from '@kodranni/store';
import { isLocalDeskRequest } from '../../lib/loopback';
import { resolveCampaignSlug } from '../../lib/campaign-paths';
import { edgeControl } from '../../lib/edge-control';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

/** GET /operator/discord?op=app|guilds|channels|roles&guild= */
export async function GET({ request }: { request: Request }) {
  if (!isLocalDeskRequest(request)) return new Response('Not found', { status: 404 });
  const url = new URL(request.url);
  const op = url.searchParams.get('op') ?? 'app';
  const guildId = url.searchParams.get('guild') ?? undefined;
  if (op === 'app' || op === 'guilds' || op === 'channels' || op === 'roles') {
    const r = await edgeControl('/control/discord/rest', { op, guildId });
    return json(r.json, r.status);
  }
  return json({ error: 'unknown op' }, 400);
}

/** POST /operator/discord — save guild / play channel / ST role into campaign.toml */
export async function POST({ request }: { request: Request }) {
  if (!isLocalDeskRequest(request)) return new Response('Not found', { status: 404 });
  const slug = resolveCampaignSlug();
  if (!slug) return json({ error: 'no campaign' }, 503);
  let body: { guildId?: string; channelId?: string; roleId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: 'invalid json' }, 400);
  }
  const snowflake = /^\d{17,20}$/;
  if (!body.guildId || !snowflake.test(body.guildId)) return json({ error: 'need guild' }, 400);
  if (!body.channelId || !snowflake.test(body.channelId)) {
    return json({ error: 'need play channel' }, 400);
  }
  if (!body.roleId || !snowflake.test(body.roleId)) return json({ error: 'need ST role' }, 400);
  const path = defaultCampaignTomlPath(slug);
  const cfg = applyMachineDefaults(await readCampaignConfig(path));
  cfg.discordGuildId = body.guildId;
  cfg.discordPlayChannelId = body.channelId;
  cfg.discordStorytellerRoleId = body.roleId;
  if (!cfg.platforms.includes('discord')) cfg.platforms = [...cfg.platforms, 'discord'];
  await writeCampaignConfig(cfg, path);
  process.env.DISCORD_GUILD_ID = body.guildId;
  process.env.DISCORD_PLAY_CHANNEL_ID = body.channelId;
  process.env.DISCORD_STORYTELLER_ROLE_ID = body.roleId;
  return json({ ok: true });
}
