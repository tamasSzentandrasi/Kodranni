import {
  putSnapshotToEdge,
  registerEdgeCampaign,
  setEdgeOrigin,
} from '@kodranni/publish';
import {
  ensureEdgeDeviceKey,
  openSqliteStore,
  type CampaignConfig,
} from '@kodranni/store';

export function resolveEdgeUrl(cfg: CampaignConfig): string | undefined {
  const raw = cfg.edgeUrl ?? process.env.KODRANNI_EDGE_URL?.trim();
  return raw ? raw.replace(/\/$/, '') : undefined;
}

/** URL the ST machine must be able to resolve (usually workers.dev). */
export function resolveEdgeControlUrl(cfg: CampaignConfig): string | undefined {
  const raw =
    cfg.edgeControlUrl ??
    process.env.KODRANNI_EDGE_CONTROL_URL?.trim() ??
    resolveEdgeUrl(cfg);
  return raw ? raw.replace(/\/$/, '') : undefined;
}

export async function publishSnapshotToEdge(slug: string, cfg: CampaignConfig): Promise<void> {
  const edgeUrl = resolveEdgeControlUrl(cfg);
  if (!edgeUrl) {
    console.log('  edge: skipped (no edge_url / KODRANNI_EDGE_URL)');
    return;
  }
  const key = ensureEdgeDeviceKey();
  const store = openSqliteStore(cfg.storePath);
  try {
    const snap = store.toPublicSnapshot();
    await registerEdgeCampaign({ edgeUrl, campaignId: slug, deviceKey: key });
    await putSnapshotToEdge({ edgeUrl, campaignId: slug, deviceKey: key, snapshot: snap });
    console.log(`  edge: snapshot published (${edgeUrl})`);
  } finally {
    store.close();
  }
}

export async function clearEdgeOrigin(slug: string, cfg: CampaignConfig): Promise<void> {
  const edgeUrl = resolveEdgeControlUrl(cfg);
  if (!edgeUrl) return;
  await setEdgeOrigin({
    edgeUrl,
    campaignId: slug,
    deviceKey: ensureEdgeDeviceKey(),
    origin: null,
  });
  console.log('  edge: origin cleared');
}

export async function captureArchiveToEdge(
  slug: string,
  cfg: CampaignConfig,
  localUrl: string,
): Promise<void> {
  const edgeUrl = resolveEdgeControlUrl(cfg);
  if (!edgeUrl) return;
  const { signSnapshotBody } = await import('@kodranni/publish');
  const store = openSqliteStore(cfg.storePath);
  let paths: string[];
  try {
    const snap = store.toPublicSnapshot();
    paths = [
      '/',
      '/community/',
      '/characters/',
      ...snap.characters.map((ch) => `/characters/${ch.slug}/`),
    ];
  } finally {
    store.close();
  }
  const pages: Record<string, string> = {};
  const base = localUrl.replace(/\/$/, '');
  for (const path of paths) {
    try {
      const res = await fetch(`${base}${path}`, {
        headers: { 'x-kodranni-archive': '1' },
        signal: AbortSignal.timeout(15_000),
      });
      if (res.ok) pages[path] = await res.text();
    } catch {
      /* skip */
    }
  }
  if (!Object.keys(pages).length) {
    console.log('  edge: no archive HTML captured (is live UI up?)');
    return;
  }
  const key = ensureEdgeDeviceKey();
  const body = JSON.stringify(pages);
  const sig = signSnapshotBody(key, body);
  const url = `${edgeUrl}/api/pages?campaign=${encodeURIComponent(slug)}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${slug}:${sig}`,
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`edge pages PUT ${res.status}: ${text.slice(0, 240)}`);
  }
  console.log(`  edge: archive HTML ${Object.keys(pages).length} pages`);
}

export async function publishEdgeArchive(
  slug: string,
  cfg: CampaignConfig,
  localUrl?: string,
): Promise<void> {
  await publishSnapshotToEdge(slug, cfg);
  if (localUrl) await captureArchiveToEdge(slug, cfg, localUrl);
  await clearEdgeOrigin(slug, cfg);
}
