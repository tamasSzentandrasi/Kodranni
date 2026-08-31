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
