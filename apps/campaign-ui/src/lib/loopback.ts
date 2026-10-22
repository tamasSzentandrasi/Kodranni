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

/**
 * Localhost is the Storyteller's machine. The face defaults to the desk.
 * `kod_desk=0` is the player face, for comparing the two on this machine.
 * A tunnel and an archive stay the public hall, cookie or not.
 */
export function deskToolsOn(request: Request): boolean {
  if (request.headers.get('x-kodranni-archive') === '1') return false;
  if (!isLocalDeskRequest(request)) return false;
  return cookieValue(request.headers.get('cookie'), DESK_COOKIE) !== '0';
}

export function deskCookieHeader(on: boolean): string {
  const value = on ? '1' : '0';
  return `${DESK_COOKIE}=${value}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax; HttpOnly`;
}

/** JSON/HTML refusal for a desk write. Null means the call may proceed. */
export function rejectUnlessDesk(request: Request): Response | null {
  if (!deskToolsOn(request)) return new Response('Not found', { status: 404 });
  return null;
}

/**
 * An archived hall may still read the public snapshot and the between-sessions
 * Session reading. Every other /api/ call stays refused.
 */
export function archiveAllowsApi(method: string, pathname: string): boolean {
  const read = method === 'GET' || method === 'HEAD';
  if (pathname === '/api/snapshot' || pathname.startsWith('/api/snapshot/')) return read;
  return read && (pathname === '/api/session' || pathname === '/api/session/');
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
