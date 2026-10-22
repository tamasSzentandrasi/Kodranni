import { verifySheetToken, type SheetTokenClaims } from '@kodranni/app';

const COOKIE = 'kod_edit';

export function parseCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return decodeURIComponent(rest.join('=') || '');
  }
  return undefined;
}

/** Read edit token from Authorization, cookie, or ?edit= */
export function extractEditToken(request: Request, url: URL): string | undefined {
  const auth = request.headers.get('authorization');
  if (auth?.toLowerCase().startsWith('bearer ')) {
    const t = auth.slice(7).trim();
    if (t) return t;
  }
  const q = url.searchParams.get('edit');
  if (q) return q;
  return parseCookie(request.headers.get('cookie'), COOKIE);
}

export function resolveSheetEdit(
  request: Request,
  url: URL,
  characterSlug: string,
): { canEdit: boolean; claims?: SheetTokenClaims; token?: string; reason?: string } {
  const token = extractEditToken(request, url);
  if (!token) return { canEdit: false, reason: 'missing edit token' };
  const v = verifySheetToken(token, { characterSlug });
  if (!v.ok) return { canEdit: false, reason: v.reason, token };
  return { canEdit: true, claims: v.claims, token };
}

export function editCookieHeader(token: string, maxAgeSec = 60 * 60 * 24): string {
  // No Secure: the desk is http://127.0.0.1, and a Secure cookie would be dropped there.
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAgeSec}; SameSite=Lax; HttpOnly`;
}

/**
 * A chat link arrives as ?edit=. Park a valid token in the HttpOnly cookie and
 * leave the address. An invalid token stays on the request and is not redirected.
 */
export function redirectSheetEdit(url: URL, characterSlug: string): Response | null {
  const token = url.searchParams.get('edit');
  if (!token) return null;
  const verdict = verifySheetToken(token, { characterSlug });
  if (!verdict.ok) return null;
  const next = new URL(url.href);
  next.searchParams.delete('edit');
  return new Response(null, {
    status: 303,
    headers: {
      Location: `${next.pathname}${next.search}${next.hash}`,
      'Set-Cookie': editCookieHeader(token),
      'Cache-Control': 'no-store',
    },
  });
}

export { COOKIE as EDIT_COOKIE_NAME };
