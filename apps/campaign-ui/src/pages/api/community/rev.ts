export const prerender = false;

import { openSqliteStore } from '@kodranni/store';
import { resolveStorePath } from '../../../lib/campaign-paths';
import { communityRevHash } from '../../../lib/community-rev';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

/** GET /api/community/rev — hall live poll. Live store only. */
export async function GET() {
  const storePath = resolveStorePath();
  if (!storePath) return json({ error: 'No live store configured' }, 503);

  const store = openSqliteStore(storePath);
  try {
    const community = store.getCommunity();
    const characters = store.listCharacters();
    const rev = communityRevHash(community, characters);
    return json({ generatedAt: new Date().toISOString(), rev });
  } finally {
    store.close();
  }
}
