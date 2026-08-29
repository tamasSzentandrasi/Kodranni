import { createHmac } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ensureEdgeDeviceKey } from '@kodranni/store';
import { verifyDeviceHmac } from '../src/lib/device-hmac';

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe('verifyDeviceHmac', () => {
  it('accepts a matching campaign HMAC', () => {
    const home = mkdtempSync(join(tmpdir(), 'kod-hmac-'));
    dirs.push(home);
    const prevHome = process.env.KODRANNI_HOME;
    process.env.KODRANNI_HOME = home;
    delete process.env.KODRANNI_EDGE_DEVICE_KEY;
    const key = ensureEdgeDeviceKey();
    const body = '{"type":2}';
    const sig = createHmac('sha256', key).update(body).digest('hex');
    expect(verifyDeviceHmac('vardmark', body, `Bearer vardmark:${sig}`)).toBe(true);
    expect(verifyDeviceHmac('vardmark', body, `Bearer other:${sig}`)).toBe(false);
    expect(verifyDeviceHmac('vardmark', body, `Bearer vardmark:${'ab'.repeat(32)}`)).toBe(false);
    if (prevHome === undefined) delete process.env.KODRANNI_HOME;
    else process.env.KODRANNI_HOME = prevHome;
    delete process.env.KODRANNI_EDGE_DEVICE_KEY;
  });
});
