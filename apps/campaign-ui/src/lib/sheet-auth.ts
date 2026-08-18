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
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAgeSec}; SameSite=Lax`;
}

export { COOKIE as EDIT_COOKIE_NAME };
