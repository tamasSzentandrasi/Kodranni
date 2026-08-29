export const prerender = false;

import { discordHttpEnabled, ensureDiscordRuntime } from '../../../lib/discord-boot';
import { isLocalDeskRequest } from '../../../lib/loopback';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

async function boot({ request }: { request: Request }) {
  if (!isLocalDeskRequest(request)) return new Response('Not found', { status: 404 });
  if (!discordHttpEnabled()) return json({ error: 'discord http disabled' }, 404);
  const handle = await ensureDiscordRuntime();
  if (!handle) return json({ error: 'discord runtime failed' }, 500);
  return json({ ok: true });
}

/** Kernel starts HTTP Discord after the UI is live. GET avoids Astro form CSRF. */
export async function GET(ctx: { request: Request }) {
  return boot(ctx);
}

export async function POST(ctx: { request: Request }) {
  return boot(ctx);
}
