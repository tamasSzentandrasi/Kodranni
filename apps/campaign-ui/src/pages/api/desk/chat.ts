export const prerender = false;

import { rejectUnlessDesk } from '../../../lib/loopback';
import {
  discordHttpEnabled,
  discordRuntimeOn,
  ensureDiscordRuntime,
  stopDiscordRuntime,
} from '../../../lib/discord-boot';
import { stopFluxerRuntime } from '../../../lib/fluxer-boot';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

/** POST /api/desk/chat — start or stop Discord, or stop a Fluxer gateway already up. Loopback desk only. */
export async function POST({ request }: { request: Request }): Promise<Response> {
  const denied = rejectUnlessDesk(request);
  if (denied) return denied;
  let body: { platform?: unknown; op?: unknown };
  try {
    body = (await request.json()) as { platform?: unknown; op?: unknown };
  } catch {
    return json({ error: 'invalid body' }, 400);
  }
  const platform = body.platform === 'discord' || body.platform === 'fluxer' ? body.platform : null;
  const op = body.op === 'live' || body.op === 'end' ? body.op : null;
  if (!platform || !op) return json({ error: 'need platform and op' }, 400);
  if (platform === 'fluxer' && op === 'live') {
    return json({ error: 'Fluxer waits for the same controls Discord uses.' }, 409);
  }
  try {
    if (op === 'end') {
      if (platform === 'discord') await stopDiscordRuntime();
      else await stopFluxerRuntime();
      return json({ ok: true, bound: false });
    }
    if (platform === 'discord') {
      if (!discordHttpEnabled()) {
        process.env.KODRANNI_DISCORD_HTTP = '1';
        if (process.env.KODRANNI_DISCORD_GATEWAY !== '1') delete process.env.DISCORD_BOT_TOKEN;
      }
      const started = await ensureDiscordRuntime();
      if (!started) return json({ error: 'Discord did not start' }, 500);
      return json({ ok: true, bound: discordRuntimeOn() });
    }
    return json({ error: 'Fluxer waits for the same controls Discord uses.' }, 409);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'could not start';
    return json({ error: message }, 500);
  }
}
