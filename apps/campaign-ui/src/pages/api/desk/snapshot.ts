export const prerender = false;

import { openSqliteStore } from '@kodranni/store';
import { resolveCampaignSlug, resolveStorePath } from '../../../lib/campaign-paths';
import { rejectUnlessDesk } from '../../../lib/loopback';

/** GET /api/desk/snapshot — redacted public.json. Desk cookie on this machine. */
export async function GET({ request }: { request: Request }) {
  const denied = rejectUnlessDesk(request);
  if (denied) return denied;
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
