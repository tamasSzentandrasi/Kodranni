export const prerender = false;

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { openSqliteStore } from '@kodranni/store';
import { resolveAvatarsDir, resolveStorePath } from '../../../lib/campaign-paths';
import { resolveSheetEdit } from '../../../lib/sheet-auth';

const ALLOWED = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

function contentType(ext: string): string {
  switch (ext) {
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    default:
      return 'image/jpeg';
  }
}

/** GET /api/avatar/:slug — serve uploaded portrait for a character. */
export async function GET({ params }: { params: { slug?: string } }) {
  const slug = params.slug;
  if (!slug) return new Response('Missing slug', { status: 400 });

  const storePath = resolveStorePath();
  const avatarsDir = resolveAvatarsDir();
  if (!storePath || !avatarsDir) {
    return new Response('No live store', { status: 404 });
  }

  const store = openSqliteStore(storePath);
  try {
    const ch = store.getCharacterBySlug(slug);
    if (!ch?.avatar) return new Response('No avatar', { status: 404 });

    if (ch.avatar.startsWith('http://') || ch.avatar.startsWith('https://')) {
      return Response.redirect(ch.avatar, 302);
    }

    const file = ch.avatar.includes('/') ? ch.avatar.split('/').pop()! : ch.avatar;
    const full = join(avatarsDir, file);
    if (!existsSync(full)) return new Response('File missing', { status: 404 });

    const ext = extname(full).toLowerCase();
    const buf = readFileSync(full);
    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Type': contentType(ext),
        'Cache-Control': 'public, max-age=60',
      },
    });
  } finally {
    store.close();
  }
}

/**
 * POST /api/avatar/:slug — multipart field `file` uploads portrait.
 * Stores under campaign media/avatars/ and sets character.avatar basename.
 */
export async function POST({
  params,
  request,
}: {
  params: { slug?: string };
  request: Request;
}) {
  const slug = params.slug;
  if (!slug) return new Response('Missing slug', { status: 400 });

  const storePath = resolveStorePath();
  const avatarsDir = resolveAvatarsDir();
  if (!storePath || !avatarsDir) {
    return new Response(JSON.stringify({ error: 'No live store configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const auth = resolveSheetEdit(request, new URL(request.url), slug);
  if (!auth.canEdit) {
    return new Response(
      JSON.stringify({
        error: auth.reason ?? 'edit token required',
        hint: 'Open the sheet from the table bot link to upload.',
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const ct = request.headers.get('content-type') ?? '';
  if (!ct.includes('multipart/form-data')) {
    return new Response(JSON.stringify({ error: 'Expected multipart/form-data' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const form = await request.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') {
    return new Response(JSON.stringify({ error: 'Missing file field' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const name = (file as File).name || 'avatar.jpg';
  const ext = extname(name).toLowerCase() || '.jpg';
  if (!ALLOWED.has(ext)) {
    return new Response(JSON.stringify({ error: 'Allowed: jpg png webp gif' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const buf = Buffer.from(await (file as File).arrayBuffer());
  if (buf.byteLength > 4 * 1024 * 1024) {
    return new Response(JSON.stringify({ error: 'Max 4MB' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  mkdirSync(avatarsDir, { recursive: true });
  const basename = `${slug}${ext}`;
  writeFileSync(join(avatarsDir, basename), buf);

  const store = openSqliteStore(storePath);
  try {
    const ch = store.getCharacterBySlug(slug);
    if (!ch) {
      return new Response(JSON.stringify({ error: 'Character not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    store.putCharacter({ ...ch, avatar: basename });
  } finally {
    store.close();
  }

  return new Response(JSON.stringify({ ok: true, avatar: basename, url: `/api/avatar/${slug}` }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
