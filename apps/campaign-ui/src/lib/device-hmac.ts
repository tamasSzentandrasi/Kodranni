import { createHmac, timingSafeEqual } from 'node:crypto';
import { ensureEdgeDeviceKey } from '@kodranni/store';

export function verifyDeviceHmac(
  campaign: string,
  body: string,
  header: string | null,
): boolean {
  const m = /^Bearer\s+([^:]+):([0-9a-f]+)$/i.exec(header ?? '');
  if (!m) return false;
  if (m[1] !== campaign) return false;
  const key = ensureEdgeDeviceKey();
  const expected = createHmac('sha256', key).update(body).digest('hex');
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(m[2]!, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
