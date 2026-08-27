/**
 * Cloudflare Pages Function / Worker: one hostname.
 * Live: proxy to tunnel origin in KV. Dark: serve snapshot JSON (+ archive app assets).
 *
 * Auth for control plane: Authorization: Bearer <campaignId>:<hmac-sha256(deviceKey, body)>
 */

export interface KvLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

export interface EdgeEnv {
  CAMPAIGNS: KvLike;
  /** HMAC keys keyed by campaign id. */
  DEVICE_KEYS: KvLike;
  LIVE_PROXY_TIMEOUT_MS?: string;
  /** Used when Host has no campaign label and ?campaign= is absent. */
  DEFAULT_CAMPAIGN?: string;
  /** GitHub Pages origin for the product (landing + Guidebook), no trailing slash. */
  GUIDE_ORIGIN?: string;
  ASSETS?: { fetch(request: Request): Promise<Response> };
}

export function kvKey(
  campaign: string,
  field: 'origin' | 'snapshot' | 'meta' | 'pages',
): string {
  return `campaign:${campaign}:${field}`;
}

export async function hmacHex(key: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

async function authorize(
  request: Request,
  env: EdgeEnv,
  campaign: string,
  body: string,
): Promise<boolean> {
  const header = request.headers.get('authorization') ?? '';
  const m = /^Bearer\s+([^:]+):([0-9a-f]+)$/i.exec(header);
  if (!m) return false;
  if (m[1] !== campaign) return false;
  const deviceKey = await env.DEVICE_KEYS.get(campaign);
  if (!deviceKey) return false;
  const expected = await hmacHex(deviceKey, body);
  return timingSafeEqualHex(expected, m[2]!.toLowerCase());
}

const CAMPAIGN_COOKIE = 'kodranni_campaign';

export function isCampaignAppPath(pathname: string): boolean {
  const p = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  return (
    p === '/community' ||
    p.startsWith('/community/') ||
    p === '/characters' ||
    p.startsWith('/characters/') ||
    p.startsWith('/api/')
  );
}

export function isPublicProductHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  return host === 'kodranni.com' || host === 'www.kodranni.com';
}

function aliasCampaign(id: string | null | undefined, fallback: string | null): string | null {
  const s = id?.trim();
  if (!s) return null;
  if ((s === 'demo' || s === 'play') && fallback) return fallback;
  return s;
}

function campaignFromCookie(header: string | null | undefined): string | null {
  if (!header) return null;
  const parts = header.split(';');
  for (const part of parts) {
    const [rawName, ...rest] = part.trim().split('=');
    if (rawName === CAMPAIGN_COOKIE) {
      try {
        return decodeURIComponent(rest.join('=').trim());
      } catch {
        return rest.join('=').trim() || null;
      }
    }
  }
  return null;
}

export function campaignFromUrl(
  url: URL,
  defaultCampaign?: string,
  cookieHeader?: string | null,
): string | null {
  const fallback = defaultCampaign?.trim() || null;
  const q = aliasCampaign(url.searchParams.get('campaign'), fallback);
  if (q) return q;
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (host === 'kodranni.com' || host === 'www.kodranni.com') {
    if (url.pathname.startsWith('/Guidebook')) return null;
    if (url.pathname === '/' || url.pathname === '/index.html') return null;
    if (isCampaignAppPath(url.pathname)) {
      return aliasCampaign(campaignFromCookie(cookieHeader), fallback) ?? fallback;
    }
    return null;
  }
  if (host === 'demo.kodranni.com' || host === 'play.kodranni.com') return fallback;
  if (host.endsWith('.workers.dev')) return fallback;
  const sub = /^([a-z0-9-]+)\.kodranni\.com$/.exec(host);
  if (sub) return aliasCampaign(sub[1], fallback);
  return fallback;
}

function isProductPath(url: URL, campaign: string | null): boolean {
  const p = url.pathname;
  if (p.startsWith('/Guidebook')) return true;
  if (p === '/Kodranni' || p.startsWith('/Kodranni/')) return true;
  if (campaign) return false;
  if (!isPublicProductHost(url.hostname)) return false;
  if (p === '/' || p === '/index.html') return true;
  if (p.startsWith('/design/')) return true;
  if (p.startsWith('/pagefind')) return true;
  if (p === '/favicon.ico' || p.startsWith('/favicon') || p === '/apple-touch-icon.png') return true;
  if (p.startsWith('/og') || p.endsWith('.xml')) return true;
  return false;
}

function guideOriginPath(pathname: string): string {
  if (pathname === '/Kodranni' || pathname.startsWith('/Kodranni/')) {
    return pathname.slice('/Kodranni'.length) || '/';
  }
  return pathname;
}

function exposeGuidebookPaths(body: string): string {
  return body
    .replace(/(["'(])\/Kodranni\/Guidebook/g, '$1/Guidebook')
    .replace(/(["'(])\/Kodranni\/design/g, '$1/design');
}

function shouldRewriteProduct(contentType: string): boolean {
  return /text\/html|text\/css|javascript|json|svg\+xml|xml/i.test(contentType);
}

async function proxyProduct(request: Request, env: EdgeEnv, url: URL): Promise<Response> {
  const origin = (env.GUIDE_ORIGIN ?? '').replace(/\/$/, '');
  if (!origin) return json({ error: 'product origin unset' }, 404);
  const dest = `${origin}${guideOriginPath(url.pathname)}${url.search}`;
  const res = await fetch(dest, {
    method: request.method,
    headers: { accept: request.headers.get('accept') ?? '*/*' },
    redirect: 'follow',
    signal: AbortSignal.timeout(10_000),
  });
  const headers = new Headers(res.headers);
  headers.delete('content-encoding');
  headers.delete('content-length');
  const type = headers.get('content-type') ?? '';
  if (request.method !== 'HEAD' && shouldRewriteProduct(type)) {
    let body = await res.text();
    if (isPublicProductHost(url.hostname)) body = exposeGuidebookPaths(body);
    return new Response(body, { status: res.status, headers });
  }
  return new Response(res.body, { status: res.status, headers });
}

const SNOWFLAKE = /\b\d{17,20}\b/;

function snapshotLooksPrivate(json: string): boolean {
  return SNOWFLAKE.test(json) || json.includes('"initiator"') || json.includes('pendingMoves');
}

export async function handleEdgeRequest(request: Request, env: EdgeEnv): Promise<Response> {
  const url = new URL(request.url);
  const campaign = campaignFromUrl(url, env.DEFAULT_CAMPAIGN, request.headers.get('cookie'));

  if (
    (request.method === 'GET' || request.method === 'HEAD') &&
    isProductPath(url, campaign)
  ) {
    if (env.ASSETS) {
      const asset = await env.ASSETS.fetch(request);
      if (asset.status !== 404) return asset;
    }
    return proxyProduct(request, env, url);
  }

  if (url.pathname === '/api/snapshot' && request.method === 'GET') {
    if (!campaign) return json({ error: 'missing campaign' }, 400);
    const snap = await env.CAMPAIGNS.get(kvKey(campaign, 'snapshot'));
    if (!snap) return json({ error: 'no snapshot' }, 404);
    return new Response(snap, {
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    });
  }

  if (url.pathname === '/api/snapshot' && request.method === 'PUT') {
    if (!campaign) return json({ error: 'missing campaign' }, 400);
    const body = await request.text();
    if (!(await authorize(request, env, campaign, body))) {
      return json({ error: 'unauthorized' }, 401);
    }
    if (snapshotLooksPrivate(body)) {
      return json({ error: 'snapshot not redacted' }, 400);
    }
    await env.CAMPAIGNS.put(kvKey(campaign, 'snapshot'), body);
    return json({ ok: true });
  }

  if (url.pathname === '/api/pages' && request.method === 'PUT') {
    if (!campaign) return json({ error: 'missing campaign' }, 400);
    const body = await request.text();
    if (!(await authorize(request, env, campaign, body))) {
      return json({ error: 'unauthorized' }, 401);
    }
    await env.CAMPAIGNS.put(kvKey(campaign, 'pages'), body);
    return json({ ok: true });
  }

  if (url.pathname === '/control/session' && request.method === 'POST') {
    if (!campaign) return json({ error: 'missing campaign' }, 400);
    const body = await request.text();
    if (!(await authorize(request, env, campaign, body))) {
      return json({ error: 'unauthorized' }, 401);
    }
    let parsed: { origin: string | null };
    try {
      parsed = JSON.parse(body) as { origin: string | null };
    } catch {
      return json({ error: 'invalid json' }, 400);
    }
    if (parsed.origin != null && !parsed.origin.startsWith('https://')) {
      return json({ error: 'origin must be https or null' }, 400);
    }
    await env.CAMPAIGNS.put(kvKey(campaign, 'origin'), parsed.origin ?? '');
    return json({ ok: true, origin: parsed.origin });
  }

  if (url.pathname === '/control/register' && request.method === 'POST') {
    if (!campaign) return json({ error: 'missing campaign' }, 400);
    const body = await request.text();
    let parsed: { deviceKey: string };
    try {
      parsed = JSON.parse(body) as { deviceKey: string };
    } catch {
      return json({ error: 'invalid json' }, 400);
    }
    if (!parsed.deviceKey || parsed.deviceKey.length < 32) {
      return json({ error: 'deviceKey too short' }, 400);
    }
    const existing = await env.DEVICE_KEYS.get(campaign);
    if (existing) return json({ error: 'already registered' }, 409);
    await env.DEVICE_KEYS.put(campaign, parsed.deviceKey);
    return json({ ok: true, campaign });
  }

  if (
    campaign &&
    (request.method === 'GET' || request.method === 'HEAD') &&
    (url.pathname === '/' || url.pathname === '/index.html')
  ) {
    return campaignHomeRedirect(url, campaign);
  }

  if (campaign) {
    const live = await proxyLive(request, env, url, campaign);
    if (live) return live;
  }

  if (campaign && (request.method === 'GET' || request.method === 'HEAD')) {
    const pagesJson = await env.CAMPAIGNS.get(kvKey(campaign, 'pages'));
    if (pagesJson) {
      try {
        const pages = JSON.parse(pagesJson) as Record<string, string>;
        const html =
          pages[url.pathname] ??
          pages[url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : `${url.pathname}/`];
        if (html) return serveArchiveHtml(html, url, campaign);
      } catch {
        /* fall through */
      }
    }
  }

  if (env.ASSETS && (request.method === 'GET' || request.method === 'HEAD')) {
    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404) return asset;
  }

  if (
    url.pathname === '/' ||
    url.pathname === '/index.html' ||
    url.pathname === '/community' ||
    url.pathname === '/community/' ||
    url.pathname === '/characters' ||
    url.pathname === '/characters/'
  ) {
    if (!campaign) {
      return new Response(archiveShell(null), {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      });
    }
    const snap = await env.CAMPAIGNS.get(kvKey(campaign, 'snapshot'));
    return serveArchiveHtml(archiveShell(snap), url, campaign);
  }

  if (url.pathname === '/api/snapshot') {
    return json({ error: 'method not allowed' }, 405);
  }

  return json({ error: 'not found' }, 404);
}

function withForwarded(request: Request, dest: URL): Headers {
  const h = new Headers(request.headers);
  h.set('host', dest.host);
  h.set('x-forwarded-host', new URL(request.url).host);
  h.set('x-forwarded-proto', new URL(request.url).protocol.replace(':', ''));
  h.delete('cookie');
  return h;
}

function originLooksDown(res: Response): boolean {
  if (res.status >= 520 && res.status <= 530) return true;
  return res.status === 502 || res.status === 503 || res.status === 504;
}

async function proxyLive(
  request: Request,
  env: EdgeEnv,
  url: URL,
  campaign: string,
): Promise<Response | null> {
  const origin = await env.CAMPAIGNS.get(kvKey(campaign, 'origin'));
  if (!origin) return null;
  const timeoutMs = Number(env.LIVE_PROXY_TIMEOUT_MS ?? 4000);
  try {
    const dest = new URL(origin);
    dest.pathname = url.pathname;
    dest.search = url.search;
    dest.searchParams.delete('campaign');
    dest.hash = '';
    const init: RequestInit = {
      method: request.method,
      headers: withForwarded(request, dest),
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs),
    };
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      init.body = await request.arrayBuffer();
    }
    const proxied = await fetch(dest, init);
    if (originLooksDown(proxied)) {
      await env.CAMPAIGNS.put(kvKey(campaign, 'origin'), '');
      return null;
    }
    return await publicizeLiveResponse(request, proxied, campaign);
  } catch {
    await env.CAMPAIGNS.put(kvKey(campaign, 'origin'), '');
    return null;
  }
}

function publicLocation(requestUrl: URL, location: string, campaign: string): string {
  const next = new URL(location, requestUrl);
  next.protocol = requestUrl.protocol;
  next.host = requestUrl.host;
  if (isPublicProductHost(requestUrl.hostname)) {
    next.searchParams.set('campaign', campaign);
  }
  return `${next.pathname}${next.search}${next.hash}`;
}

function attachCampaignCookie(headers: Headers, url: URL, campaign: string): void {
  if (!isPublicProductHost(url.hostname)) return;
  headers.append(
    'set-cookie',
    `${CAMPAIGN_COOKIE}=${encodeURIComponent(campaign)}; Path=/; Max-Age=2592000; SameSite=Lax; Secure`,
  );
}

function campaignHomeRedirect(url: URL, campaign: string): Response {
  const dest = new URL(url);
  dest.pathname = '/community/';
  if (isPublicProductHost(url.hostname)) dest.searchParams.set('campaign', campaign);
  const headers = new Headers({ location: `${dest.pathname}${dest.search}` });
  attachCampaignCookie(headers, url, campaign);
  return new Response(null, { status: 302, headers });
}

function stampCampaignLinks(html: string, campaign: string, hostname: string): string {
  if (!isPublicProductHost(hostname)) return html;
  return html.replace(/\b(href|src|action)="(\/[^"]*)"/gi, (full, attr: string, path: string) => {
    if (path.startsWith('//')) return full;
    if (/[?&]campaign=/.test(path)) return full;
    if (path.startsWith('/Guidebook')) return full;
    const sep = path.includes('?') ? '&' : '?';
    return `${attr}="${path}${sep}campaign=${encodeURIComponent(campaign)}"`;
  });
}

async function publicizeLiveResponse(
  request: Request,
  proxied: Response,
  campaign: string,
): Promise<Response> {
  const url = new URL(request.url);
  const headers = new Headers(proxied.headers);
  const loc = headers.get('location');
  if (loc) headers.set('location', publicLocation(url, loc, campaign));
  attachCampaignCookie(headers, url, campaign);
  headers.delete('content-encoding');
  headers.delete('content-length');
  const type = headers.get('content-type') ?? '';
  if (isPublicProductHost(url.hostname) && type.includes('text/html')) {
    const html = await proxied.text();
    return new Response(stampCampaignLinks(html, campaign, url.hostname), {
      status: proxied.status,
      headers,
    });
  }
  return new Response(proxied.body, { status: proxied.status, headers });
}

function serveArchiveHtml(html: string, url: URL, campaign: string): Response {
  const headers = new Headers({
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
  });
  attachCampaignCookie(headers, url, campaign);
  return new Response(stampCampaignLinks(html, campaign, url.hostname), { headers });
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

function archiveShell(snapshotJson: string | null): string {
  const payload = snapshotJson ?? 'null';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Kodranni</title>
  <style>
    :root { color-scheme: dark; --blood:#a01818; --silver:#c6c1b8; --dim:#8a8580; }
    body { margin:0; background:#050505; color:var(--silver); font: 1.15rem/1.6 Georgia, serif; }
    main { max-width: 42rem; margin: 0 auto; padding: 2rem 1.25rem; }
    a { color: #f2efe9; }
    .kicker { color: var(--blood); letter-spacing: .16em; text-transform: uppercase; font-size: .72rem; }
    .meta { color: var(--dim); }
    .card { display:block; padding:.75rem .9rem; border:1px solid #2a2222; margin:.4rem 0; text-decoration:none; color:inherit; }
  </style>
</head>
<body>
  <main>
    <p class="kicker">Kodranni</p>
    <div id="root"><p class="meta">Loading…</p></div>
  </main>
  <script type="application/json" id="snap">${payload.replace(/</g, '\\u003c')}</script>
  <script>
    const snap = JSON.parse(document.getElementById('snap').textContent);
    const root = document.getElementById('root');
    if (!snap) {
      root.innerHTML = '<h1>No archive yet</h1><p class="meta">The table has not published a snapshot.</p>';
    } else {
      const c = snap.community || {};
      const chars = snap.characters || [];
      root.innerHTML =
        '<h1>' + escapeHtml(c.name || 'Community') + '</h1>' +
        '<p class="meta">As of ' + escapeHtml(snap.generatedAt || '') + ' · archive</p>' +
        '<h2>Roster</h2>' +
        (chars.map(ch => '<p class="card"><strong>' + escapeHtml(ch.name) + '</strong> · ' + escapeHtml(ch.status) + '</p>').join('')
          || '<p class="meta">None published.</p>');
    }
    function escapeHtml(s) {
      return String(s).replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
    }
  </script>
</body>
</html>`;
}

export default {
  fetch(request: Request, env: EdgeEnv): Promise<Response> {
    return handleEdgeRequest(request, env);
  },
};
