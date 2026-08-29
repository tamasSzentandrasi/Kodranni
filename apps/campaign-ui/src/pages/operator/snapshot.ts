export const prerender = false;

import { openSqliteStore } from '@kodranni/store';
import { isLocalDeskRequest } from '../../lib/loopback';
import { resolveCampaignSlug, resolveStorePath } from '../../lib/campaign-paths';

/** GET /operator/snapshot — redacted public.json, loopback only. */
export async function GET({ request }: { request: Request }) {
  if (!isLocalDeskRequest(request)) {
    return new Response('Not found', { status: 404 });
  }
  const storePath = resolveStorePath();
  if (!storePath) {
    return new Response(JSON.stringify({ error: 'no store' }), {
      status: 503,
      headers: { 'content-type': 'application/json' },
    });
  }
  const store = openSqliteStore(storePath);
  try {
    const snap = store.toPublicSnapshot();
    const slug = resolveCampaignSlug() ?? snap.community.slug;
    return new Response(JSON.stringify(snap, null, 2) + '\n', {
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store',
        'content-disposition': `attachment; filename="${slug}-public.json"`,
      },
    });
  } finally {
    store.close();
  }
}
