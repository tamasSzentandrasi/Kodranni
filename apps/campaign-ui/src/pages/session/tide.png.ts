export const prerender = false;

import { tidePictureSvg } from '@kodranni/hall-render';
import { openSqliteStore } from '@kodranni/store';
import { resolveStorePath } from '../../lib/campaign-paths';

/** GET /session/tide.png — the open bar, dyed like the desk. Query ?p=&a=&b= busts a chat cache. */
export async function GET({ request }: { request: Request }) {
  if (request.headers.get('x-kodranni-archive') === '1') {
    return new Response('Not found', { status: 404 });
  }
  const storePath = resolveStorePath();
  const tide = (() => {
    if (!storePath) return null;
    const store = openSqliteStore(storePath);
    try {
      return store.getTableState().tide;
    } finally {
      store.close();
    }
  })();
  const svg = tide
    ? tidePictureSvg(tide)
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 168" width="720" height="168"><rect width="720" height="168" fill="#f4efe6"/><text x="360" y="88" text-anchor="middle" fill="#2a2222" font-size="16" font-family="Palatino, Georgia, serif">No Tide is open.</text></svg>`;
  try {
    const sharp = (await import('sharp')).default;
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    return new Response(new Uint8Array(png), {
      headers: { 'content-type': 'image/png', 'cache-control': 'no-store' },
    });
  } catch {
    return new Response(svg, {
      headers: { 'content-type': 'image/svg+xml', 'cache-control': 'no-store' },
    });
  }
}
