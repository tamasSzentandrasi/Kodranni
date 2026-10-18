export interface MintEnv {
  CF_API_TOKEN?: string;
  CF_ACCOUNT_ID?: string;
  CF_ZONE_ID?: string;
}

export interface CampaignMeta {
  tunnelId?: string;
  originHost?: string;
  guildId?: string;
  createdAt?: string;
  lastActivity?: string;
}

export interface MintResult {
  origin: string;
  token: string;
  tunnelId: string;
  created: boolean;
}

const CF = 'https://api.cloudflare.com/client/v4';

export function originHostFor(campaign: string): string {
  return `origin-${campaign}.kodranni.com`;
}

const RESERVED_PUBLIC = new Set(['www', 'demo', 'play']);

/** Public player hostname. Null for reserved labels and the tunnel prefix. */
export function publicHostnameFor(campaign: string): string | null {
  const slug = campaign.trim().toLowerCase();
  if (!/^[a-z0-9-]{1,48}$/.test(slug)) return null;
  if (RESERVED_PUBLIC.has(slug) || slug.startsWith('origin-')) return null;
  return `${slug}.kodranni.com`;
}

export type HostnameAttach = 'attached' | 'skipped' | 'failed';

/**
 * Attach `<slug>.kodranni.com` to this Worker. Does not touch `origin-<slug>`.
 * Missing Cloudflare credentials skip. A refused name does not throw.
 */
export async function attachCampaignHostname(
  campaign: string,
  env: MintEnv,
  cfFetch: typeof fetch = fetch,
): Promise<HostnameAttach> {
  const host = publicHostnameFor(campaign);
  const token = env.CF_API_TOKEN?.trim();
  const account = env.CF_ACCOUNT_ID?.trim();
  const zone = env.CF_ZONE_ID?.trim();
  if (!host || !token || !account || !zone) return 'skipped';
  const headers = {
    authorization: `Bearer ${token}`,
    'content-type': 'application/json',
  };
  try {
    if (await hostnameAlreadyAttached(cfFetch, account, headers, host)) return 'attached';
  } catch {
    /* list failed; the attach below is the same name again if it is already there */
  }
  try {
    await cfJson(cfFetch, `${CF}/accounts/${account}/workers/domains`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        hostname: host,
        service: 'kodranni-edge',
        environment: 'production',
        zone_id: zone,
      }),
    });
    return 'attached';
  } catch {
    return 'failed';
  }
}

async function hostnameAlreadyAttached(
  cfFetch: typeof fetch,
  account: string,
  headers: Record<string, string>,
  host: string,
): Promise<boolean> {
  for (let page = 1; page <= 10; page++) {
    const res = await cfFetch(
      `${CF}/accounts/${account}/workers/domains?page=${page}&per_page=50`,
      { method: 'GET', headers },
    );
    const data = (await res.json().catch(() => ({}))) as {
      result?: { hostname?: string }[];
      success?: boolean;
      result_info?: { total_pages?: number };
    };
    if (!res.ok || data.success === false) throw new Error('cloudflare: list domains failed');
    const rows = Array.isArray(data.result) ? data.result : [];
    if (rows.some((row) => row?.hostname === host)) return true;
    const pages = data.result_info?.total_pages;
    if (rows.length < 50 || (pages != null && page >= pages)) return false;
  }
  return false;
}

export async function mintCampaignTunnel(
  campaign: string,
  env: MintEnv,
  meta: CampaignMeta,
  cfFetch: typeof fetch = fetch,
): Promise<MintResult> {
  const token = env.CF_API_TOKEN?.trim();
  const account = env.CF_ACCOUNT_ID?.trim();
  const zone = env.CF_ZONE_ID?.trim();
  if (!token || !account || !zone) {
    throw new Error('Worker missing CF_API_TOKEN / CF_ACCOUNT_ID / CF_ZONE_ID');
  }
  const headers = {
    authorization: `Bearer ${token}`,
    'content-type': 'application/json',
  };
  const host = originHostFor(campaign);
  let tunnelId = meta.tunnelId;
  let created = false;
  if (!tunnelId) {
    const createdRes = await cfJson(cfFetch, `${CF}/accounts/${account}/cfd_tunnel`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: `kodranni-${campaign}`, config_src: 'cloudflare' }),
    });
    tunnelId = String(createdRes.result?.id ?? '');
    if (!tunnelId) throw new Error('tunnel create returned no id');
    created = true;
  }
  await cfJson(cfFetch, `${CF}/accounts/${account}/cfd_tunnel/${tunnelId}/configurations`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      config: {
        ingress: [
          {
            hostname: host,
            service: 'http://127.0.0.1:8742',
            originRequest: { httpHostHeader: 'localhost' },
          },
          { service: 'http_status:404' },
        ],
      },
    }),
  });
  await ensureOriginCname(cfFetch, zone, headers, host, `${tunnelId}.cfargotunnel.com`);
  const tokRes = await cfJson(cfFetch, `${CF}/accounts/${account}/cfd_tunnel/${tunnelId}/token`, {
    method: 'GET',
    headers,
  });
  const runToken = typeof tokRes.result === 'string' ? tokRes.result : '';
  if (!runToken) throw new Error('tunnel token missing');
  return { origin: `https://${host}`, token: runToken, tunnelId, created };
}

async function ensureOriginCname(
  cfFetch: typeof fetch,
  zone: string,
  headers: Record<string, string>,
  name: string,
  content: string,
): Promise<void> {
  const list = await cfJson(
    cfFetch,
    `${CF}/zones/${zone}/dns_records?type=CNAME&name=${encodeURIComponent(name)}`,
    { method: 'GET', headers },
  );
  const existing = Array.isArray(list.result) ? list.result[0] : undefined;
  if (existing?.id) {
    if (existing.content === content && existing.proxied) return;
    await cfJson(cfFetch, `${CF}/zones/${zone}/dns_records/${existing.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ type: 'CNAME', name, content, proxied: true }),
    });
    return;
  }
  await cfJson(cfFetch, `${CF}/zones/${zone}/dns_records`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ type: 'CNAME', name, content, proxied: true }),
  });
}

async function cfJson(
  cfFetch: typeof fetch,
  url: string,
  init: RequestInit,
): Promise<{ result?: any; success?: boolean; errors?: { message: string }[] }> {
  const res = await cfFetch(url, init);
  const data = (await res.json().catch(() => ({}))) as {
    result?: unknown;
    success?: boolean;
    errors?: { message: string }[];
  };
  if (!res.ok || data.success === false) {
    const msg = data.errors?.map((e) => e.message).join('; ') || `HTTP ${res.status}`;
    throw new Error(`cloudflare: ${msg}`);
  }
  return data;
}
