import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  ensureCampaignRuntime,
  readLiveUrl,
  readSessionState,
  writeLiveUrl,
  writeSessionState,
} from '../src/runtime.js';

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe('campaign runtime files', () => {
  it('writes and reads live.url under KODRANNI_HOME', () => {
    const home = mkdtempSync(join(tmpdir(), 'kod-home-'));
    dirs.push(home);
    const env = { ...process.env, KODRANNI_HOME: home };
    ensureCampaignRuntime('vardmark', env);
    writeLiveUrl('vardmark', 'https://example.trycloudflare.com', env);
    expect(readLiveUrl('vardmark', env)).toBe('https://example.trycloudflare.com');
    writeSessionState(
      'vardmark',
      { slug: 'vardmark', liveUrl: 'https://example.trycloudflare.com', tunnel: true },
      env,
    );
    expect(readSessionState('vardmark', env)?.tunnel).toBe(true);
  });
});
