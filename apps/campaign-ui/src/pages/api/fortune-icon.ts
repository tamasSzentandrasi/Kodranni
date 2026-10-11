export const prerender = false;

import { existsSync, readFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { resolveItemsDir } from '../../lib/campaign-paths';

function contentType(ext: string): string {
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'image/jpeg';
}

/** GET /api/fortune-icon?file= — a fortune or label icon. Public. Basename only. */
export async function GET({ request }: { request: Request }) {
  const file = new URL(request.url).searchParams.get('file') ?? '';
  if (!file || file !== basename(file) || file.includes('..') || file.includes('/') || file.includes('\\')) {
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
