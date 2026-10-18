import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { campaignUiBuildStale, campaignUiEnv, parseBind } from '../src/kernel.js';

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe('campaignUiBuildStale', () => {
  function touch(path: string, ms: number) {
    const t = new Date(ms);
    utimesSync(path, t, t);
  }

  it('rebuilds a checkout whose sources are newer than dist', () => {
    const root = mkdtempSync(join(tmpdir(), 'kod-ui-stale-'));
    dirs.push(root);
    const src = join(root, 'apps/campaign-ui/src');
    const entry = join(root, 'apps/campaign-ui/dist/server/entry.mjs');
    mkdirSync(join(root, 'apps/campaign-ui/dist/server'), { recursive: true });
    mkdirSync(src, { recursive: true });
    writeFileSync(entry, 'old');
    writeFileSync(join(src, 'page.astro'), 'new');
    touch(entry, 1_000);
    touch(join(src, 'page.astro'), 2_000);
    expect(campaignUiBuildStale(root)).toBe(true);
    touch(join(src, 'page.astro'), 500);
    expect(campaignUiBuildStale(root)).toBe(false);
  });

  it('rebuilds when the bundled Fluxer adapter is newer than dist', () => {
    const root = mkdtempSync(join(tmpdir(), 'kod-ui-fluxer-'));
    dirs.push(root);
    const src = join(root, 'apps/campaign-ui/src');
    const entry = join(root, 'apps/campaign-ui/dist/server/entry.mjs');
    const adapter = join(root, 'adapters/fluxer/src/index.ts');
    mkdirSync(join(root, 'apps/campaign-ui/dist/server'), { recursive: true });
    mkdirSync(src, { recursive: true });
    mkdirSync(join(root, 'adapters/fluxer/src'), { recursive: true });
    writeFileSync(entry, 'old');
    writeFileSync(adapter, 'new');
    touch(entry, 1_000);
    touch(adapter, 2_000);
    expect(campaignUiBuildStale(root)).toBe(true);
  });

  it('keeps a packaged dist that has no campaign-ui sources', () => {
    const root = mkdtempSync(join(tmpdir(), 'kod-ui-pkg-'));
    dirs.push(root);
    const entry = join(root, 'apps/campaign-ui/dist/server/entry.mjs');
    mkdirSync(join(root, 'apps/campaign-ui/dist/server'), { recursive: true });
    writeFileSync(entry, 'built');
    expect(campaignUiBuildStale(root)).toBe(false);
  });
});

describe('parseBind', () => {
  it('splits host:port', () => {
    expect(parseBind('127.0.0.1:8742')).toEqual({ host: '127.0.0.1', port: 8742 });
  });

  it('forces loopback when bind is all-interfaces', () => {
    expect(parseBind('0.0.0.0:9000')).toEqual({ host: '127.0.0.1', port: 9000 });
  });
});

describe('campaignUiEnv', () => {
  it('strips the Discord bot token for the default HTTP path', () => {
    const home = mkdtempSync(join(tmpdir(), 'kod-ui-env-'));
    dirs.push(home);
    const env = campaignUiEnv(
      {
        DISCORD_BOT_TOKEN: 'secret-token',
        DISCORD_GUILD_ID: '1',
        KODRANNI_HOME: home,
      },
      {
        host: '127.0.0.1',
        port: 8742,
        storePath: '/tmp/x.sqlite',
        slug: 'vardmark',
        bot: true,
        edgeControlUrl: 'https://edge.test',
      },
    );
    expect(env.KODRANNI_DISCORD_HTTP).toBe('1');
    expect(env.DISCORD_BOT_TOKEN).toBeUndefined();
    expect(env.DISCORD_GUILD_ID).toBe('1');
    expect(env.KODRANNI_EDGE_CONTROL_URL).toBe('https://edge.test');
    expect(env.KODRANNI_EDGE_DEVICE_KEY).toBeTruthy();
  });

  it('mints a device key for the desk even when Discord HTTP is off', () => {
    const home = mkdtempSync(join(tmpdir(), 'kod-ui-env-'));
    dirs.push(home);
    const env = campaignUiEnv(
      { KODRANNI_HOME: home },
      {
        host: '127.0.0.1',
        port: 8742,
        storePath: '/tmp/x.sqlite',
        slug: 'vardmark',
        bot: false,
        edgeControlUrl: 'https://edge.test',
      },
    );
    expect(env.KODRANNI_EDGE_DEVICE_KEY).toBeTruthy();
    expect(env.KODRANNI_DISCORD_HTTP).toBeUndefined();
  });

  it('keeps the token for the gateway hatch', () => {
    const home = mkdtempSync(join(tmpdir(), 'kod-ui-env-'));
    dirs.push(home);
    const env = campaignUiEnv(
      {
        DISCORD_BOT_TOKEN: 'secret-token',
        KODRANNI_DISCORD_GATEWAY: '1',
        KODRANNI_HOME: home,
      },
      {
        host: '127.0.0.1',
        port: 8742,
        storePath: '/tmp/x.sqlite',
        slug: 'vardmark',
        bot: true,
      },
    );
    expect(env.KODRANNI_DISCORD_GATEWAY).toBe('1');
    expect(env.DISCORD_BOT_TOKEN).toBe('secret-token');
    expect(env.KODRANNI_DISCORD_HTTP).toBeUndefined();
  });
});
