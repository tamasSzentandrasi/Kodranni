/** Desk routes must not be reachable via the live tunnel. */

export function isTunnelledRequest(request: Request): boolean {
  const h = request.headers;
  return Boolean(
    h.get('cf-connecting-ip') ||
      h.get('cdn-loop') ||
      h.get('cf-ray') ||
      h.get('x-forwarded-host'),
  );
}

export function isLocalDeskRequest(request: Request): boolean {
  if (isTunnelledRequest(request)) return false;
  const host = (request.headers.get('host') ?? '').toLowerCase().split(':')[0];
  return host === '127.0.0.1' || host === 'localhost' || host === '::1';
}

export function isDeskPath(pathname: string): boolean {
  const p = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  return (
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
