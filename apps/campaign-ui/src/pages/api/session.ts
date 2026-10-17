export const prerender = false;

import { sessionReading } from '@kodranni/hall-render';
import { emptyTableState, openSqliteStore } from '@kodranni/store';
import { resolveStorePath } from '../../lib/campaign-paths';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

/** GET /api/session — the shared scene and Tide. Players poll this while the tab is open. */
export async function GET({ request }: { request: Request }) {
  if (request.headers.get('x-kodranni-archive') === '1') {
    return json({ between: true, scene: [], tide: null });
  }
  const storePath = resolveStorePath();
  if (!storePath) return json(sessionReading(emptyTableState()));
  const store = openSqliteStore(storePath);
  try {
    return json(sessionReading(store.getTableState()));
  } finally {
    store.close();
  }
}
