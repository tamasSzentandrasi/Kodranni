/** Product-edge caps so the $0 Worker stays inside free KV. */

export const MAX_SNAPSHOT_BYTES = 1_000_000;
export const MAX_CAMPAIGNS_PER_DEVICE = 3;
export const MAX_REGISTERS_PER_IP_DAY = 5;
export const INACTIVE_MS = 90 * 24 * 60 * 60 * 1000;
export const GC_BATCH = 50;

export async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function utcDayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function deviceCampaignsKey(deviceKeyHash: string): string {
  return `idx:device:${deviceKeyHash}`;
}

export const CAMPAIGN_INDEX_KEY = 'idx:campaigns';

export function parseIdList(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}
