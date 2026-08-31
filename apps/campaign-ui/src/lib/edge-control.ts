import { createHmac } from 'node:crypto';
import { ensureEdgeDeviceKey, PRODUCT_EDGE_CONTROL_URL } from '@kodranni/store';

export async function edgeControl(
  path: string,
  body: unknown,
): Promise<{ ok: boolean; status: number; json: Record<string, unknown> }> {
  const edge = (
    process.env.KODRANNI_EDGE_CONTROL_URL?.trim() || PRODUCT_EDGE_CONTROL_URL
  ).replace(/\/$/, '');
  const campaign = process.env.KODRANNI_CAMPAIGN_SLUG?.trim();
  if (!campaign) {
    return { ok: false, status: 503, json: { error: 'no campaign' } };
  }
  const key = ensureEdgeDeviceKey();
  const raw = JSON.stringify(body ?? {});
  const sig = createHmac('sha256', key).update(raw).digest('hex');
  const url = `${edge}${path}?campaign=${encodeURIComponent(campaign)}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${campaign}:${sig}`,
      },
      body: raw,
      signal: AbortSignal.timeout(12_000),
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: res.ok, status: res.status, json };
  } catch (e) {
    return {
      ok: false,
      status: 502,
      json: { error: e instanceof Error ? e.message : String(e) },
    };
  }
}
