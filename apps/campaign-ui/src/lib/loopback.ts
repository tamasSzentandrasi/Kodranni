/** Desk routes must not be reachable via the live tunnel. */

export const DESK_COOKIE = 'kod_desk';

export function isTunnelledRequest(request: Request): boolean {
  const h = request.headers;
  return Boolean(
    h.get('cf-connecting-ip') ||
      h.get('cdn-loop') ||
      h.get('cf-ray') ||
      h.get('x-forwarded-host'),
  );
}

function requestHost(request: Request): string {
  const fromHeader = (request.headers.get('host') ?? '').toLowerCase().split(':')[0];
  if (fromHeader) return fromHeader;
  // Unit requests often omit Host. The URL host is this process; tunnel headers already failed closed.
  try {
    return new URL(request.url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

export function isLocalDeskRequest(request: Request): boolean {
  if (isTunnelledRequest(request)) return false;
  const host = requestHost(request);
  return host === '127.0.0.1' || host === 'localhost' || host === '::1';
}

export function cookieValue(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return decodeURIComponent(rest.join('=') || '');
  }
  return undefined;
}

/** Loopback, and this browser chose the desk. A projected window leaves the cookie off. */
export function deskToolsOn(request: Request): boolean {
  return isLocalDeskRequest(request) && cookieValue(request.headers.get('cookie'), DESK_COOKIE) === '1';
}

export function deskCookieHeader(on: boolean): string {
  if (!on) return `${DESK_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly`;
  return `${DESK_COOKIE}=1; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax; HttpOnly`;
}

/** JSON/HTML refusal for a desk write. Null means the call may proceed. */
export function rejectUnlessDesk(request: Request): Response | null {
  if (!isLocalDeskRequest(request)) return new Response('Not found', { status: 404 });
  if (!deskToolsOn(request)) {
    return new Response(JSON.stringify({ error: 'Open the desk on this machine' }), {
      status: 401,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    });
  }
  return null;
}

export function isDeskPath(pathname: string): boolean {
  const p = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  return (
    p === '/api/desk' ||
    p.startsWith('/api/desk/') ||
    p === '/emissary' ||
    p.startsWith('/emissary/') ||
    p === '/operator' ||
    p.startsWith('/operator/') ||
    p === '/community/setup' ||
    p.startsWith('/community/setup/') ||
    p === '/setup' ||
    p.startsWith('/setup/')
  );
}
