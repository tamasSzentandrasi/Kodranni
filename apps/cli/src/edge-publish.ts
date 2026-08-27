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
  const edgeUrl = resolveEdgeUrl(cfg);
  if (!edgeUrl) return;
  await setEdgeOrigin({
    edgeUrl,
    campaignId: slug,
    deviceKey: ensureEdgeDeviceKey(),
    origin: null,
  });
  console.log('  edge: origin cleared');
}
