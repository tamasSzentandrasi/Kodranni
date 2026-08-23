import { verifyCommunityToken, type CommunityTokenClaims } from '@kodranni/app';

const COOKIE = 'kod_setup';

export function parseCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return decodeURIComponent(rest.join('=') || '');
  }
  return undefined;
}

/** Read setup token from Authorization, cookie, or ?edit= */
export function extractSetupToken(request: Request, url: URL): string | undefined {
  const auth = request.headers.get('authorization');
  if (auth?.toLowerCase().startsWith('bearer ')) {
    const t = auth.slice(7).trim();
    if (t) return t;
  }
  const q = url.searchParams.get('edit');
  if (q) return q;
  return parseCookie(request.headers.get('cookie'), COOKIE);
}

export function resolveSetup(
  request: Request,
  url: URL,
  communitySlug: string,
): { canEdit: boolean; claims?: CommunityTokenClaims; token?: string; reason?: string } {
  const token = extractSetupToken(request, url);
  if (!token) return { canEdit: false, reason: 'missing setup token' };
  const v = verifyCommunityToken(token, { communitySlug });
  if (!v.ok) return { canEdit: false, reason: v.reason, token };
  return { canEdit: true, claims: v.claims, token };
}

export function setupCookieHeader(token: string, maxAgeSec = 60 * 60 * 24): string {
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAgeSec}; SameSite=Lax`;
}

export { COOKIE as SETUP_COOKIE_NAME };
