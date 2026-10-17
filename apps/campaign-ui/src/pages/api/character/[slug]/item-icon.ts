export const prerender = false;

import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { openSqliteStore } from '@kodranni/store';
import { resolveItemsDir, resolveStorePath } from '../../../../lib/campaign-paths';
import { deskToolsOn } from '../../../../lib/loopback';
import { resolveSheetEdit } from '../../../../lib/sheet-auth';

const MAX_BYTES = 2 * 1024 * 1024;

function contentType(ext: string): string {
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'image/jpeg';
}

/** Trust the bytes when the filename extension disagrees. */
function sniffImage(buf: Buffer): '.png' | '.jpg' | '.webp' | null {
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return '.png';
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return '.jpg';
  if (
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return '.webp';
  }
  return null;
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
      'Cache-Control': 'no-store',
    },
  });
}

/**
 * POST /api/character/:slug/item-icon — multipart `file` + `index`.
 * Max 2MB. jpeg, png, or webp.
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
  if (!deskToolsOn(request) && !auth.canEdit) {
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

  const buf = Buffer.from(await (file as File).arrayBuffer());
  if (buf.byteLength > MAX_BYTES) return json({ error: 'Use a jpg, png, or webp under 2MB' }, 400);
  const sniffed = sniffImage(buf);
  if (!sniffed) return json({ error: 'Use a jpg, png, or webp under 2MB' }, 400);

  const wantedName = String(form.get('name') ?? '').trim();
  const store = openSqliteStore(storePath);
  let fileName = '';
  try {
    const ch = store.getCharacterBySlug(slug);
    if (!ch) return json({ error: 'Character not found' }, 404);
    const items = [...(ch.inventory.items ?? [])];
    let at = items[index] && (!wantedName || items[index].name === wantedName) ? index : -1;
    if (at < 0 && wantedName) at = items.findIndex((it) => it.name === wantedName);
    if (at < 0 || !items[at]) return json({ error: 'No item at that index' }, 400);

    mkdirSync(itemsDir, { recursive: true });
    fileName = `${slug}-${at}-${Date.now().toString(36)}${Math.floor(Math.random() * 36).toString(36)}${sniffed}`;
    writeFileSync(join(itemsDir, fileName), buf);

    const previous = items[at].icon;
    items[at] = { ...items[at], icon: fileName };
    ch.inventory.items = items;
    store.putCharacter(ch);
    if (previous && previous !== fileName && previous === basename(previous) && !previous.includes('..')) {
      const old = join(itemsDir, previous);
      if (existsSync(old)) unlinkSync(old);
    }
  } catch (e) {
    if (fileName) {
      const orphan = join(itemsDir, fileName);
      if (existsSync(orphan)) unlinkSync(orphan);
    }
    const msg = e instanceof Error ? e.message : 'Icon failed';
    return json({ error: msg }, 400);
  } finally {
    store.close();
  }

  return json({
    ok: true,
    icon: fileName,
    url: `/api/character/${encodeURIComponent(slug)}/item-icon?file=${encodeURIComponent(fileName)}`,
  });
}
