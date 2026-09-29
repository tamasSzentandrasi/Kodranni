export const prerender = false;

import { deskCookieHeader, isLocalDeskRequest } from '../../../lib/loopback';

function loopbackHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === '127.0.0.1' || host === 'localhost' || host === '::1';
}

/** Same-machine page to return to. Null when there is no safe Referer. */
function nextPath(request: Request): string | null {
  const ref = request.headers.get('referer');
  if (!ref) return null;
  let url: URL;
  try {
    url = new URL(ref);
  } catch {
    return null;
  }
  if (!loopbackHost(url.hostname)) return null;
  const path = url.pathname;
  if (
    path === '/operator' ||
    path.startsWith('/operator/') ||
    path === '/emissary' ||
    path.startsWith('/emissary/') ||
    path.includes('/setup') ||
    path.startsWith('/api/')
  ) {
    return '/community/';
  }
  if (!path.startsWith('/') || path.startsWith('//')) return null;
  return path + url.search;
}

async function wantsDesk(request: Request): Promise<boolean> {
  const ct = request.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    const body = (await request.json()) as { on?: unknown };
    return body.on === true || body.on === 1 || body.on === '1';
  }
  const fd = await request.formData();
  return String(fd.get('on') ?? '') === '1';
}

/** POST /api/desk/session — set or clear kod_desk. Loopback only; the cookie is the thing being set. */
export async function POST({ request }: { request: Request }): Promise<Response> {
  if (!isLocalDeskRequest(request)) return new Response('Not found', { status: 404 });
  let on = false;
  try {
    on = await wantsDesk(request);
  } catch {
    return new Response(JSON.stringify({ error: 'invalid body' }), {
      status: 400,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    });
  }
  const headers = new Headers();
  headers.set('set-cookie', deskCookieHeader(on));
  headers.set('cache-control', 'no-store');
  const next = nextPath(request);
  if (!next) return new Response(null, { status: 204, headers });
  headers.set('location', next);
  return new Response(null, { status: 303, headers });
}
