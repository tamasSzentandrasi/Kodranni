export const prerender = false;

import { applyPublicSnapshot, openSqliteStore, parsePublicSnapshot } from '@kodranni/store';
import { isLocalDeskRequest } from '../../lib/loopback';
import { resolveCampaignSlug, resolveStorePath } from '../../lib/campaign-paths';

/** POST /operator/restore — replace this campaign from a public snapshot. Loopback only. */
export async function POST({ request }: { request: Request }) {
  if (!isLocalDeskRequest(request)) {
    return new Response('Not found', { status: 404 });
  }
  const storePath = resolveStorePath();
  const slug = resolveCampaignSlug();
  if (!storePath || !slug) {
    return new Response(JSON.stringify({ error: 'no store' }), {
      status: 503,
      headers: { 'content-type': 'application/json' },
    });
  }
  const ct = request.headers.get('content-type') ?? '';
  let raw = '';
  if (ct.includes('multipart/form-data')) {
    const fd = await request.formData();
    const file = fd.get('snapshot');
    if (typeof file === 'string') raw = file;
    else if (file && 'text' in file) raw = await (file as Blob).text();
  } else {
    raw = await request.text();
  }
  if (!raw.trim()) {
    return new Response(JSON.stringify({ error: 'empty snapshot' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }
  try {
    const snap = parsePublicSnapshot(raw);
    const store = openSqliteStore(storePath);
    applyPublicSnapshot(store, snap, slug);
    store.close();
    return new Response(JSON.stringify({ ok: true, slug, name: snap.community.name }), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }
}
