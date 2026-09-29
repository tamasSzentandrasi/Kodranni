export const prerender = false;

import { applyPublicSnapshot, openSqliteStore, parsePublicSnapshot } from '@kodranni/store';
import { resolveCampaignSlug, resolveStorePath } from '../../../lib/campaign-paths';
import { rejectUnlessDesk } from '../../../lib/loopback';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

/** POST /api/desk/restore — replace this campaign from a public snapshot. */
export async function POST({ request }: { request: Request }) {
  const denied = rejectUnlessDesk(request);
  if (denied) return denied;
  const storePath = resolveStorePath();
  const slug = resolveCampaignSlug();
  if (!storePath || !slug) return json({ error: 'no store' }, 503);
  const ct = request.headers.get('content-type') ?? '';
  const form = ct.includes('multipart/form-data');
  let raw = '';
  if (form) {
    const fd = await request.formData();
    const file = fd.get('snapshot');
    if (typeof file === 'string') raw = file;
    else if (file && 'text' in file) raw = await (file as Blob).text();
  } else {
    raw = await request.text();
  }
  const fail = (error: string, status = 400) =>
    form
      ? new Response(null, {
          status: 303,
          headers: { location: '/community/?restore=failed', 'cache-control': 'no-store' },
        })
      : json({ error }, status);
  if (!raw.trim()) return fail('empty snapshot');
  try {
    const snap = parsePublicSnapshot(raw);
    const store = openSqliteStore(storePath);
    applyPublicSnapshot(store, snap, slug);
    store.close();
    if (form) {
      return new Response(null, {
        status: 303,
        headers: { location: '/community/?restore=ok', 'cache-control': 'no-store' },
      });
    }
    return json({ ok: true, slug, name: snap.community.name });
  } catch (e) {
    return fail(e instanceof Error ? e.message : String(e));
  }
}
