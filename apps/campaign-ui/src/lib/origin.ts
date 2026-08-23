function firstForwarded(value: string | null): string | undefined {
  if (!value) return undefined;
  const part = value.split(',')[0]?.trim();
  if (!part) return undefined;
  return part.replace(/^"|"$/g, '');
}

function originFromHost(proto: string, host: string): string | undefined {
  if (proto !== 'http' && proto !== 'https') return undefined;
  try {
    const u = new URL(`${proto}://${host}`);
    if (u.protocol !== `${proto}:`) return undefined;
    return u.origin;
  } catch {
    return undefined;
  }
}

function addForwardedOrigins(allowed: Set<string>, proto: string | undefined, host: string): void {
  const schemes = proto === 'http' || proto === 'https' ? [proto] : (['https', 'http'] as const);
  for (const scheme of schemes) {
    const origin = originFromHost(scheme, host);
    if (origin) allowed.add(origin);
  }
}

/**
 * Same-origin CSRF. Do not match Origin against Host — quick tunnels rewrite
 * Host to localhost (`--http-host-header localhost`). Public origin is Astro.url
 * or X-Forwarded-Host / X-Forwarded-Proto (and RFC 7239 Forwarded).
 */
export function foundingOriginOk(request: Request, publicUrl: URL): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    return false;
  }
  if (originUrl.protocol !== 'http:' && originUrl.protocol !== 'https:') return false;

  const allowed = new Set<string>();
  allowed.add(publicUrl.origin);

  const xfHost = firstForwarded(request.headers.get('x-forwarded-host'));
  const xfProto = firstForwarded(request.headers.get('x-forwarded-proto'));
  if (xfHost) addForwardedOrigins(allowed, xfProto, xfHost);

  const forwarded = request.headers.get('forwarded');
  if (forwarded) {
    for (const part of forwarded.split(',')) {
      const host = /(?:^|;)\s*host="?([^;";]+)"?/i.exec(part)?.[1]?.trim();
      const proto = /(?:^|;)\s*proto="?([^;";]+)"?/i.exec(part)?.[1]?.trim();
      if (host) addForwardedOrigins(allowed, proto, host);
    }
  }

  return allowed.has(originUrl.origin);
}
