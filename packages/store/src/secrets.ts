/**
 * Load ~/.kodranni/secrets/<name> into process env.
 * Existing env vars win. Values are never logged.
 */
import { chmodSync, existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { secretsDir } from './paths.js';

/** Filename on disk → env var. Names match the ST's self-descriptive files. */
export const SECRET_FILE_TO_ENV = {
  'discord-botToken': 'DISCORD_BOT_TOKEN',
  'discord-serverID': 'DISCORD_GUILD_ID',
  'discord-playChannelID': 'DISCORD_PLAY_CHANNEL_ID',
  'discord-appID': 'DISCORD_APP_ID',
  'discord-publicKey': 'DISCORD_PUBLIC_KEY',
  'fluxer-botToken': 'FLUXER_BOT_TOKEN',
  'fluxer-serverID': 'FLUXER_GUILD_ID',
  'fluxer-playChannelID': 'FLUXER_PLAY_CHANNEL_ID',
  'fluxer-appID': 'FLUXER_APP_ID',
  'fluxer-clientSecret': 'FLUXER_CLIENT_SECRET',
  'cf-tunnel-token': 'KODRANNI_CF_TUNNEL_TOKEN',
} as const;

export type SecretFileName = keyof typeof SECRET_FILE_TO_ENV;
export type SecretEnvName = (typeof SECRET_FILE_TO_ENV)[SecretFileName];

export interface LoadedSecrets {
  dir: string;
  /** Env names populated from files this call. */
  setFromFiles: SecretEnvName[];
  /** Env names that have a non-empty value after load (file or pre-set). */
  present: SecretEnvName[];
  /** Secret files that were group/world-readable before we tightened them. */
  loosened: string[];
}

function readSecretValue(path: string): string | undefined {
  if (!existsSync(path)) return undefined;
  const raw = readFileSync(path, 'utf8').replace(/^\uFEFF/, '').trim();
  return raw || undefined;
}

function tightenMode(path: string): boolean {
  try {
    const mode = statSync(path).mode & 0o777;
    const loose = (mode & 0o077) !== 0;
    if (mode !== 0o600) chmodSync(path, 0o600);
    return loose;
  } catch {
    return false;
  }
}

/** Read a single secret file; never throws on missing. */
export function readSecretFile(
  name: SecretFileName,
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  return readSecretValue(join(secretsDir(env), name));
}

/**
 * Copy secret files into `env` when the corresponding variable is unset.
 * Tightens file modes to 0600. Does not print or return values.
 */
export function loadSecretsIntoEnv(env: NodeJS.ProcessEnv = process.env): LoadedSecrets {
  const dir = secretsDir(env);
  const setFromFiles: SecretEnvName[] = [];
  const present: SecretEnvName[] = [];
  const loosened: string[] = [];

  if (existsSync(dir)) {
    try {
      chmodSync(dir, 0o700);
    } catch {
      /* ignore */
    }
  }

  for (const [file, key] of Object.entries(SECRET_FILE_TO_ENV) as [
    SecretFileName,
    SecretEnvName,
  ][]) {
    const path = join(dir, file);
    if (existsSync(path) && tightenMode(path)) loosened.push(file);

    if (env[key]?.trim()) {
      present.push(key);
      continue;
    }
    const value = readSecretValue(path);
    if (value) {
      env[key] = value;
      setFromFiles.push(key);
      present.push(key);
    }
  }

  return { dir, setFromFiles, present, loosened };
}

export interface PlatformCreds {
  token: boolean;
  guild: boolean;
  playChannel: boolean;
  ready: boolean;
}

export interface CredentialStatus {
  discord: PlatformCreds;
  fluxer: PlatformCreds;
  tunnelToken: boolean;
}

function flag(env: NodeJS.ProcessEnv, key: string): boolean {
  return Boolean(env[key]?.trim());
}

export function platformCredentialStatus(
  env: NodeJS.ProcessEnv = process.env,
): CredentialStatus {
  const discord = {
    token: flag(env, 'DISCORD_BOT_TOKEN'),
    guild: flag(env, 'DISCORD_GUILD_ID'),
    playChannel: flag(env, 'DISCORD_PLAY_CHANNEL_ID'),
    ready: false,
  };
  discord.ready = discord.token && discord.guild;
  const fluxer = {
    token: flag(env, 'FLUXER_BOT_TOKEN'),
    guild: flag(env, 'FLUXER_GUILD_ID'),
    playChannel: flag(env, 'FLUXER_PLAY_CHANNEL_ID'),
    ready: false,
  };
  fluxer.ready = fluxer.token && fluxer.guild;
  return {
    discord,
    fluxer,
    tunnelToken: flag(env, 'KODRANNI_CF_TUNNEL_TOKEN'),
  };
}

function bits(p: PlatformCreds): string {
  const parts = [
    p.token ? 'token' : null,
    p.guild ? 'guild' : null,
    p.playChannel ? 'play-channel' : null,
  ].filter(Boolean);
  return parts.length ? parts.join('+') : 'none';
}

/** Human status line — names only, never values. */
export function formatCredentialStatus(s: CredentialStatus): string {
  return [
    `discord ${bits(s.discord)}${s.discord.ready ? ' (ready)' : ''}`,
    `fluxer ${bits(s.fluxer)}${s.fluxer.ready ? ' (creds; adapter pending)' : ''}`,
    `tunnel-token ${s.tunnelToken ? 'set' : 'unset'}`,
  ].join(' · ');
}
