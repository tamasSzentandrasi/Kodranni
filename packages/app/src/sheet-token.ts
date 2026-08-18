/**
 * Bot-signed sheet edit tokens (HMAC-SHA256).
 * Secret: KODRANNI_SHEET_TOKEN_SECRET (prefer ~/.kodranni/secrets/sheet-token-secret).
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

export type SheetTokenRole = 'player' | 'storyteller';

export interface SheetTokenClaims {
  platform: string;
  accountId: string;
  characterSlug: string;
  role: SheetTokenRole;
  /** Unix seconds. */
  exp: number;
}

export interface IssueSheetTokenCommand {
  platform: string;
  accountId: string;
  characterSlug: string;
  role?: SheetTokenRole;
  /** TTL seconds; default 24h. */
  ttlSec?: number;
  /** Override secret (tests). */
  secret?: string;
  nowSec?: number;
}

const DEFAULT_TTL_SEC = 60 * 60 * 24;

function b64url(buf: Buffer | string): string {
  const b = typeof buf === 'string' ? Buffer.from(buf, 'utf8') : buf;
  return b.toString('base64url');
}

function fromB64url(s: string): Buffer {
  return Buffer.from(s, 'base64url');
}

export function sheetTokenSecret(
  env: NodeJS.ProcessEnv = process.env,
  override?: string,
): string | undefined {
  const s = (override ?? env.KODRANNI_SHEET_TOKEN_SECRET ?? '').trim();
  return s || undefined;
}

export function issueSheetToken(cmd: IssueSheetTokenCommand): string {
  const secret = sheetTokenSecret(process.env, cmd.secret);
  if (!secret) {
    throw new Error(
      'KODRANNI_SHEET_TOKEN_SECRET not set — add ~/.kodranni/secrets/sheet-token-secret',
    );
  }
  const now = cmd.nowSec ?? Math.floor(Date.now() / 1000);
  const claims: SheetTokenClaims = {
    platform: cmd.platform,
    accountId: cmd.accountId,
    characterSlug: cmd.characterSlug,
    role: cmd.role ?? 'player',
    exp: now + (cmd.ttlSec ?? DEFAULT_TTL_SEC),
  };
  const body = b64url(JSON.stringify(claims));
  const sig = createHmac('sha256', secret).update(body).digest();
  return `${body}.${b64url(sig)}`;
}

export type VerifySheetTokenResult =
  | { ok: true; claims: SheetTokenClaims }
  | { ok: false; reason: string };

export function verifySheetToken(
  token: string | null | undefined,
  opts: {
    characterSlug: string;
    secret?: string;
    nowSec?: number;
    /** If set, accountId must match (optional strict bind). */
    accountId?: string;
  },
): VerifySheetTokenResult {
  if (!token || !token.includes('.')) {
    return { ok: false, reason: 'missing edit token' };
  }
  const secret = sheetTokenSecret(process.env, opts.secret);
  if (!secret) {
    return { ok: false, reason: 'sheet token secret not configured' };
  }
  const [body, sigB64] = token.split('.');
  if (!body || !sigB64) return { ok: false, reason: 'malformed token' };

  const expected = createHmac('sha256', secret).update(body).digest();
  let got: Buffer;
  try {
    got = fromB64url(sigB64);
  } catch {
    return { ok: false, reason: 'malformed signature' };
  }
  if (got.length !== expected.length || !timingSafeEqual(got, expected)) {
    return { ok: false, reason: 'invalid signature' };
  }

  let claims: SheetTokenClaims;
  try {
    claims = JSON.parse(fromB64url(body).toString('utf8')) as SheetTokenClaims;
  } catch {
    return { ok: false, reason: 'malformed claims' };
  }
  if (!claims?.characterSlug || !claims.accountId || !claims.exp) {
    return { ok: false, reason: 'incomplete claims' };
  }
  const now = opts.nowSec ?? Math.floor(Date.now() / 1000);
  if (claims.exp < now) return { ok: false, reason: 'token expired' };
  if (claims.characterSlug !== opts.characterSlug) {
    return { ok: false, reason: 'token slug mismatch' };
  }
  if (opts.accountId && claims.accountId !== opts.accountId) {
    return { ok: false, reason: 'token account mismatch' };
  }
  if (claims.role !== 'player' && claims.role !== 'storyteller') {
    return { ok: false, reason: 'invalid role' };
  }
  return { ok: true, claims };
}

/** Append ?edit= or &edit= to a sheet URL. */
export function withEditToken(url: string, token: string): string {
  const join = url.includes('?') ? '&' : '?';
  return `${url}${join}edit=${encodeURIComponent(token)}`;
}
