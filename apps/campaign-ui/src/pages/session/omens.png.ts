export const prerender = false;

import { omenBoardSvg, publicDie } from '@kodranni/hall-render';
import { emptyTableState, openSqliteStore } from '@kodranni/store';
import { resolveStorePath } from '../../lib/campaign-paths';

function svgResponse(svg: string): Response {
  return new Response(svg, {
    headers: { 'content-type': 'image/svg+xml', 'cache-control': 'no-store' },
  });
}

/** GET /session/omens.png — one public net. Whispered faces are blank. */
export async function GET({ request }: { request: Request }) {
  if (request.headers.get('x-kodranni-archive') === '1') {
    return new Response('Not found', { status: 404 });
  }
  const storePath = resolveStorePath();
  const state = (() => {
    if (!storePath) return emptyTableState();
    const store = openSqliteStore(storePath);
    try {
      return store.getTableState();
    } finally {
      store.close();
    }
  })();
  const svg = omenBoardSvg(publicDie(state));
  try {
    const sharp = (await import('sharp')).default;
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    return new Response(new Uint8Array(png), {
      headers: { 'content-type': 'image/png', 'cache-control': 'no-store' },
    });
  } catch {
    return svgResponse(svg);
  }
}
