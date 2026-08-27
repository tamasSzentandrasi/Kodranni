export const prerender = false;

import { existsSync, readFileSync } from 'node:fs';
import { openSqliteStore } from '@kodranni/store';
import { resolveStorePath } from '../../lib/campaign-paths';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

/** GET /api/snapshot — redacted public snapshot from live store or KODRANNI_PUBLIC_JSON. */
export async function GET() {
  const storePath = resolveStorePath();
  if (storePath) {
    const store = openSqliteStore(storePath);
    try {
      return json(store.toPublicSnapshot());
    } finally {
      store.close();
    }
  }
  const jsonPath = process.env.KODRANNI_PUBLIC_JSON;
  if (jsonPath && existsSync(jsonPath)) {
    return json(JSON.parse(readFileSync(jsonPath, 'utf8')));
  }
  return json({ error: 'No store or snapshot configured' }, 503);
}
