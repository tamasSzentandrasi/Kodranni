export const prerender = false;

import { deskSetMap } from '@kodranni/app';
import { openSqliteStore, type RelationMap } from '@kodranni/store';
import { resolveCampaignSlug, resolveStorePath } from '../../../lib/campaign-paths';
import { rejectUnlessDesk } from '../../../lib/loopback';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

/** GET /api/desk/map — the stored character map, as a file. */
export async function GET({ request }: { request: Request }) {
  const denied = rejectUnlessDesk(request);
  if (denied) return denied;
  const storePath = resolveStorePath();
  if (!storePath) return json({ error: 'no store' }, 503);
  const store = openSqliteStore(storePath);
  try {
    const map = store.getRelationMap() ?? { nodes: [], edges: [] };
    const slug = resolveCampaignSlug() ?? 'campaign';
    return new Response(JSON.stringify(map, null, 2) + '\n', {
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store',
        'content-disposition': `attachment; filename="${slug}-character-map.json"`,
      },
    });
  } finally {
    store.close();
  }
}

/** POST /api/desk/map — replace the stored map with the uploaded file. */
export async function POST({ request }: { request: Request }) {
  const denied = rejectUnlessDesk(request);
  if (denied) return denied;
  const storePath = resolveStorePath();
  if (!storePath) return json({ error: 'no store' }, 503);
  let body: RelationMap;
  try {
    body = (await request.json()) as RelationMap;
  } catch {
    return json({ error: 'invalid json' }, 400);
  }
  const store = openSqliteStore(storePath);
  try {
    deskSetMap(store, body);
    return json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: msg }, 400);
  } finally {
    store.close();
  }
}
