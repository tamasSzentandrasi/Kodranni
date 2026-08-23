export const prerender = false;

import { setFortunes, setStartingFortunes, type FortuneKey } from '@kodranni/app';
import { openSqliteStore } from '@kodranni/store';
import { resolveStorePath } from '../../../../lib/campaign-paths';
import { foundingOriginOk } from '../../../../lib/origin';
import { resolveSetup } from '../../../../lib/setup-auth';

export { foundingOriginOk };

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** PUT /api/community/fortunes/founding — ST desk writes weather (live store only). */
export async function PUT({
  request,
  url,
}: {
  request: Request;
  url?: URL;
}) {
  const publicUrl = url ?? new URL(request.url);
  if (!foundingOriginOk(request, publicUrl)) return json({ error: 'Invalid origin' }, 403);

  const storePath = resolveStorePath();
  if (!storePath) return json({ error: 'No live store configured' }, 503);

  let body: { fortunes?: unknown };
  try {
    body = (await request.json()) as { fortunes?: unknown };
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }
  if (!body || typeof body.fortunes !== 'object' || body.fortunes === null) {
    return json({ error: 'fortunes required' }, 400);
  }

  const store = openSqliteStore(storePath);
  try {
    const live = store.getCommunity();
    const auth = resolveSetup(request, publicUrl, live.slug);
    if (!auth.canEdit) return json({ error: auth.reason ?? 'Unauthorized' }, 401);

    const fortunes = body.fortunes as Record<FortuneKey, 0 | 1 | 2 | 3>;
    const community = live.fortunesFoundedAt
      ? setFortunes(store, { fortunes, actor: auth.claims?.accountId })
      : setStartingFortunes(store, { fortunes, actor: auth.claims?.accountId });
    return json({
      ok: true,
      fortunes: community.fortunes,
      fortunesFoundedAt: community.fortunesFoundedAt,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: msg }, 400);
  } finally {
    store.close();
  }
}
