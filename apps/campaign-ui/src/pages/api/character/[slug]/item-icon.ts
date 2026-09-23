export const prerender = false;

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { openSqliteStore } from '@kodranni/store';
import { resolveItemsDir, resolveStorePath } from '../../../../lib/campaign-paths';
import { resolveSheetEdit } from '../../../../lib/sheet-auth';

const ALLOWED = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const MAX_BYTES = 256 * 1024;

function contentType(ext: string): string {
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'image/jpeg';
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** GET /api/character/:slug/item-icon?file= — serve an item icon. */
export async function GET({
  params,
  request,
}: {
  params: { slug?: string };
  request: Request;
}) {
  const slug = params.slug;
  if (!slug) return new Response('Missing slug', { status: 400 });
  const file = new URL(request.url).searchParams.get('file');
  if (!file || file.includes('/') || file.includes('..')) {
    return new Response('Missing file', { status: 400 });
  }
  const itemsDir = resolveItemsDir();
  if (!itemsDir) return new Response('No live store', { status: 404 });
  const full = join(itemsDir, file);
  if (!existsSync(full)) return new Response('File missing', { status: 404 });
  const ext = extname(full).toLowerCase();
  return new Response(readFileSync(full), {
    status: 200,
    headers: {
      'Content-Type': contentType(ext),
      'Cache-Control': 'public, max-age=60',
    },
  });
}

/**
 * POST /api/character/:slug/item-icon — multipart `file` + `index`.
 * Max 256KB. jpeg/png/webp.
 */
export async function POST({
  params,
  request,
}: {
  params: { slug?: string };
  request: Request;
}) {
  const slug = params.slug;
  if (!slug) return json({ error: 'Missing slug' }, 400);
  const storePath = resolveStorePath();
  const itemsDir = resolveItemsDir();
  if (!storePath || !itemsDir) return json({ error: 'No live store configured' }, 503);

  const auth = resolveSheetEdit(request, new URL(request.url), slug);
  if (!auth.canEdit) {
    return json({ error: auth.reason ?? 'edit token required' }, 401);
  }

  const ct = request.headers.get('content-type') ?? '';
  if (!ct.includes('multipart/form-data')) {
    return json({ error: 'Expected multipart/form-data' }, 400);
  }
  const form = await request.formData();
  const file = form.get('file');
  const index = Number(form.get('index'));
  if (!file || typeof file === 'string') return json({ error: 'Missing file' }, 400);
  if (!Number.isInteger(index) || index < 0) return json({ error: 'Missing index' }, 400);

  const name = (file as File).name || 'item.jpg';
  const ext = extname(name).toLowerCase() || '.jpg';
  if (!ALLOWED.has(ext)) return json({ error: 'Allowed: jpg png webp' }, 400);
  const buf = Buffer.from(await (file as File).arrayBuffer());
  if (buf.byteLength > MAX_BYTES) return json({ error: 'Max 256KB' }, 400);

  mkdirSync(itemsDir, { recursive: true });
  const basename = `${slug}-${index}${ext}`;
  writeFileSync(join(itemsDir, basename), buf);

  const store = openSqliteStore(storePath);
  try {
    const ch = store.getCharacterBySlug(slug);
    if (!ch) return json({ error: 'Character not found' }, 404);
    const items = [...(ch.inventory.items ?? [])];
    if (!items[index]) return json({ error: 'No item at that index' }, 400);
    items[index] = { ...items[index], icon: basename };
    ch.inventory.items = items;
    store.putCharacter(ch);
  } finally {
    store.close();
  }

  return json({
    ok: true,
    icon: basename,
    url: `/api/character/${encodeURIComponent(slug)}/item-icon?file=${encodeURIComponent(basename)}`,
  });
}
