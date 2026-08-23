import { describe, expect, it } from 'vitest';
import {
  applyMachineDefaults,
  parseCampaignToml,
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
    const text = serializeCampaignToml(cfg);
    expect(text).not.toContain('eyJsecret');
    expect(text).toContain('discord_storyteller_role_id');
    expect(text).toContain('tunnel_mode = "named"');
  });
});
