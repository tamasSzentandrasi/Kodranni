import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { campaignUiEnv, parseBind } from '../src/kernel.js';

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
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
