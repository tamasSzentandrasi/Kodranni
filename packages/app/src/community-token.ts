/**
 * Bot-signed community setup tokens (HMAC-SHA256).
 * Same secret as sheet tokens: KODRANNI_SHEET_TOKEN_SECRET.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { sheetTokenSecret } from './sheet-token.js';

export interface CommunityTokenClaims {
  kind: 'community-setup';
  platform: string;
  accountId: string;
  communitySlug: string;
  role: 'storyteller';
  /** Unix seconds. */
  exp: number;
}

export interface IssueCommunityTokenCommand {
  platform: string;
  accountId: string;
  communitySlug: string;
  /** TTL seconds; default 24h. */
  ttlSec?: number;
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

export function issueCommunityToken(cmd: IssueCommunityTokenCommand): string {
  const secret = sheetTokenSecret(process.env, cmd.secret);
  if (!secret) {
    throw new Error(
      'KODRANNI_SHEET_TOKEN_SECRET not set — add ~/.kodranni/secrets/sheet-token-secret',
    );
  }
  const now = cmd.nowSec ?? Math.floor(Date.now() / 1000);
  const claims: CommunityTokenClaims = {
    kind: 'community-setup',
    platform: cmd.platform,
    accountId: cmd.accountId,
    communitySlug: cmd.communitySlug,
    role: 'storyteller',
    exp: now + (cmd.ttlSec ?? DEFAULT_TTL_SEC),
  };
  const body = b64url(JSON.stringify(claims));
  const sig = createHmac('sha256', secret).update(body).digest();
  return `${body}.${b64url(sig)}`;
}

export type VerifyCommunityTokenResult =
  | { ok: true; claims: CommunityTokenClaims }
  | { ok: false; reason: string };

export function verifyCommunityToken(
  token: string | null | undefined,
  opts: {
    communitySlug: string;
    secret?: string;
    nowSec?: number;
    accountId?: string;
  },
): VerifyCommunityTokenResult {
  if (!token || !token.includes('.')) {
    return { ok: false, reason: 'missing setup token' };
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

  let claims: CommunityTokenClaims;
  try {
    claims = JSON.parse(fromB64url(body).toString('utf8')) as CommunityTokenClaims;
  } catch {
    return { ok: false, reason: 'malformed claims' };
  }
  if (
    claims?.kind !== 'community-setup' ||
    !claims.communitySlug ||
    !claims.accountId ||
    !claims.exp
  ) {
    return { ok: false, reason: 'incomplete claims' };
  }
  const now = opts.nowSec ?? Math.floor(Date.now() / 1000);
  if (claims.exp < now) return { ok: false, reason: 'token expired' };
  if (claims.communitySlug !== opts.communitySlug) {
    return { ok: false, reason: 'token community mismatch' };
  }
  if (opts.accountId && claims.accountId !== opts.accountId) {
    return { ok: false, reason: 'token account mismatch' };
  }
  if (claims.role !== 'storyteller') {
    return { ok: false, reason: 'invalid role' };
  }
  return { ok: true, claims };
}
