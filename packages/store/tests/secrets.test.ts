import { chmodSync, mkdirSync, writeFileSync, statSync, rmSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  formatCredentialStatus,
  loadSecretsIntoEnv,
  platformCredentialStatus,
} from '../src/secrets.js';

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

function homeWith(files: Record<string, string>, mode = 0o644): string {
  const home = mkdtempSync(join(tmpdir(), 'kod-sec-'));
  dirs.push(home);
  const dir = join(home, 'secrets');
  mkdirSync(dir, { recursive: true });
  for (const [name, value] of Object.entries(files)) {
    const p = join(dir, name);
    writeFileSync(p, `${value}\n`);
    chmodSync(p, mode);
  }
  return home;
}

describe('loadSecretsIntoEnv', () => {
  it('maps self-descriptive files onto env vars and tightens modes', () => {
    const home = homeWith({
      'discord-botToken': 'disc-token',
      'discord-serverID': '111',
      'discord-playChannelID': '222',
      'fluxer-botToken': 'flux-token',
      'fluxer-serverID': '333',
      'cf-tunnel-token': 'cf-token',
    });
    const env: NodeJS.ProcessEnv = { KODRANNI_HOME: home };
    const loaded = loadSecretsIntoEnv(env);
    expect(env.DISCORD_BOT_TOKEN).toBe('disc-token');
    expect(env.DISCORD_GUILD_ID).toBe('111');
    expect(env.DISCORD_PLAY_CHANNEL_ID).toBe('222');
    expect(env.FLUXER_BOT_TOKEN).toBe('flux-token');
    expect(env.FLUXER_GUILD_ID).toBe('333');
    expect(env.KODRANNI_CF_TUNNEL_TOKEN).toBe('cf-token');
    expect(loaded.setFromFiles).toContain('DISCORD_BOT_TOKEN');
    expect(loaded.loosened).toContain('discord-botToken');
    const mode = statSync(join(home, 'secrets', 'discord-botToken')).mode & 0o777;
    expect(mode).toBe(0o600);
  });

  it('does not overwrite an already-set env var', () => {
    const home = homeWith({ 'discord-botToken': 'from-file' });
    const env: NodeJS.ProcessEnv = {
      KODRANNI_HOME: home,
      DISCORD_BOT_TOKEN: 'from-env',
    };
    loadSecretsIntoEnv(env);
    expect(env.DISCORD_BOT_TOKEN).toBe('from-env');
  });

  it('summarises presence without values', () => {
    const s = platformCredentialStatus({
      DISCORD_BOT_TOKEN: 'disc-secret-value',
      DISCORD_GUILD_ID: 'guild-id-value',
      FLUXER_BOT_TOKEN: 'flux-secret-value',
    });
    expect(s.discord.ready).toBe(true);
    expect(s.fluxer.ready).toBe(false);
    const line = formatCredentialStatus(s);
    expect(line).toMatch(/discord token\+guild \(ready\)/);
    expect(line).not.toContain('disc-secret-value');
    expect(line).not.toContain('guild-id-value');
    expect(line).not.toContain('flux-secret-value');
  });
});
