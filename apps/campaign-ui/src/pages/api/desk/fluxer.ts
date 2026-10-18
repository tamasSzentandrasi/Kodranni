export const prerender = false;

import {
  applyMachineDefaults,
  defaultCampaignTomlPath,
  readCampaignConfig,
  writeCampaignConfig,
} from '@kodranni/store';
import { resolveCampaignSlug } from '../../../lib/campaign-paths';
import { rejectUnlessDesk } from '../../../lib/loopback';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

/** POST /api/desk/fluxer — save server / play channel / ST role into campaign.toml */
export async function POST({ request }: { request: Request }) {
  const denied = rejectUnlessDesk(request);
  if (denied) return denied;
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
  cfg.fluxerGuildId = body.guildId;
  cfg.fluxerPlayChannelId = body.channelId;
  cfg.fluxerStorytellerRoleId = body.roleId;
  if (!cfg.platforms.includes('fluxer')) cfg.platforms = [...cfg.platforms, 'fluxer'];
  await writeCampaignConfig(cfg, path);
  process.env.FLUXER_GUILD_ID = body.guildId;
  process.env.FLUXER_PLAY_CHANNEL_ID = body.channelId;
  process.env.FLUXER_STORYTELLER_ROLE_ID = body.roleId;
  return json({ ok: true });
}
