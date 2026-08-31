import { describe, expect, it } from 'vitest';
import {
  applyCampaignDiscordEnv,
  applyMachineDefaults,
  parseCampaignToml,
  PRODUCT_EDGE_CONTROL_URL,
  productPublicEdgeUrl,
  resolveNamedTunnelPublicUrl,
  resolveTunnelMode,
  serializeCampaignToml,
  type CampaignConfig,
} from '../src/campaign-toml.js';

const base: CampaignConfig = {
  schema: 1,
  slug: 'x',
  name: 'X',
  storePath: '/tmp/x.sqlite',
  liveBind: '127.0.0.1:8742',
  liveBaseUrl: 'http://127.0.0.1:8742',
  publishDebounceMs: 45000,
  platforms: [],
};

describe('resolveTunnelMode', () => {
  it('defaults to quick', () => {
    expect(resolveTunnelMode(base, {})).toBe('quick');
  });

  it('uses named when token present', () => {
    expect(
      resolveTunnelMode({ ...base, cloudflareTunnelToken: 't' }, {}),
    ).toBe('named');
  });

  it('honours env override', () => {
    expect(resolveTunnelMode(base, { KODRANNI_TUNNEL_MODE: 'named' })).toBe('named');
  });
});

describe('resolveNamedTunnelPublicUrl', () => {
  it('accepts host without scheme', () => {
    expect(
      resolveNamedTunnelPublicUrl({
        ...base,
        tunnelHostname: 'live.example.com',
      }),
    ).toBe('https://live.example.com');
  });

  it('rejects localhost live_base_url without tunnel_hostname', () => {
    expect(() => resolveNamedTunnelPublicUrl(base)).toThrow(/public https/);
  });
});

describe('parse tunnel_mode', () => {
  it('reads named from toml text', () => {
    const cfg = parseCampaignToml(`
slug = "x"
name = "X"
store_path = "/tmp/x.sqlite"
tunnel_mode = "named"
tunnel_hostname = "https://live.example.com"
`);
    expect(cfg.tunnelMode).toBe('named');
    expect(cfg.tunnelHostname).toBe('https://live.example.com');
  });
});

describe('applyMachineDefaults', () => {
  it('sets named tunnel + ST role from env without writing the token into toml', () => {
    const cfg = applyMachineDefaults(base, {
      KODRANNI_CF_TUNNEL_TOKEN: 'eyJsecret',
      KODRANNI_TUNNEL_HOSTNAME: 'live.example.com',
      DISCORD_STORYTELLER_ROLE_ID: '999888777',
      DISCORD_BOT_TOKEN: 't',
      DISCORD_GUILD_ID: 'g',
    });
    expect(cfg.tunnelMode).toBe('named');
    expect(cfg.tunnelHostname).toBe('live.example.com');
    expect(cfg.liveBaseUrl).toBe('https://live.example.com');
    expect(cfg.discordStorytellerRoleId).toBe('999888777');
    expect(cfg.platforms).toContain('discord');
    expect(cfg.cloudflareTunnelToken).toBeUndefined();
    expect(cfg.edgeControlUrl).toBe(PRODUCT_EDGE_CONTROL_URL);
    const text = serializeCampaignToml(cfg);
    expect(text).not.toContain('eyJsecret');
    expect(text).toContain('discord_storyteller_role_id');
    expect(text).toContain('discord_guild_id');
    expect(text).toContain('tunnel_mode = "named"');
  });

  it('round-trips Discord bind from the desk picker', () => {
    const text = serializeCampaignToml({
      ...base,
      discordGuildId: '111',
      discordPlayChannelId: '222',
      discordStorytellerRoleId: '333',
    });
    const cfg = parseCampaignToml(text);
    expect(cfg.discordGuildId).toBe('111');
    expect(cfg.discordPlayChannelId).toBe('222');
    expect(cfg.discordStorytellerRoleId).toBe('333');
    expect(text).not.toContain('botToken');
  });

  it('fills Discord env from campaign.toml when secret files are absent', () => {
    const env: NodeJS.ProcessEnv = {};
    applyCampaignDiscordEnv(
      {
        ...base,
        discordGuildId: 'g1',
        discordPlayChannelId: 'c1',
        discordStorytellerRoleId: 'r1',
      },
      env,
    );
    expect(env.DISCORD_GUILD_ID).toBe('g1');
    expect(env.DISCORD_PLAY_CHANNEL_ID).toBe('c1');
    expect(env.DISCORD_STORYTELLER_ROLE_ID).toBe('r1');
    applyCampaignDiscordEnv(
      {
        ...base,
        discordGuildId: 'other',
      },
      env,
    );
    expect(env.DISCORD_GUILD_ID).toBe('g1');
  });

  it('clears named tunnel leftover when secrets and named tunnel fields are gone', () => {
    const cfg = applyMachineDefaults(
      {
        ...base,
        tunnelMode: 'named',
        tunnelHostname: 'https://play.kodranni.com',
        liveBaseUrl: 'https://kodranni.com',
        edgeUrl: 'https://kodranni-edge.kodranni.workers.dev',
      },
      {},
    );
    expect(cfg.tunnelMode).toBe('quick');
    expect(cfg.tunnelHostname).toBeUndefined();
    expect(cfg.liveBaseUrl).toBe('http://127.0.0.1:8742');
    expect(cfg.edgeUrl).toBe('https://kodranni-edge.kodranni.workers.dev');
  });

  it('fills product edge URLs when toml/env omit them', () => {
    const cfg = applyMachineDefaults({ ...base, slug: 'vardmark' }, {});
    expect(cfg.edgeUrl).toBe(productPublicEdgeUrl('vardmark'));
    expect(cfg.edgeControlUrl).toBe(PRODUCT_EDGE_CONTROL_URL);
    expect(cfg.edgeUrl).toBe('https://demo.kodranni.com');
  });

  it('does not overwrite an explicit edge_url', () => {
    const cfg = applyMachineDefaults(
      { ...base, slug: 'ash-hill', edgeUrl: 'https://kodranni.com' },
      {},
    );
    expect(cfg.edgeUrl).toBe('https://kodranni.com');
    expect(cfg.edgeControlUrl).toBe(PRODUCT_EDGE_CONTROL_URL);
  });
});
