import { rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

/** ~/.kodranni on all platforms for now (XDG later if needed). */
export function kodranniHome(env: NodeJS.ProcessEnv = process.env): string {
  if (env.KODRANNI_HOME) return env.KODRANNI_HOME;
  return join(homedir(), '.kodranni');
}

export function campaignDir(slug: string, env?: NodeJS.ProcessEnv): string {
  return join(kodranniHome(env), 'campaigns', slug);
}

/** ST-machine secrets: one file per value. Never in the public campaign repo. */
export function secretsDir(env: NodeJS.ProcessEnv = process.env): string {
  if (env.KODRANNI_SECRETS_DIR) return env.KODRANNI_SECRETS_DIR;
  return join(kodranniHome(env), 'secrets');
}

export function defaultStorePath(slug: string, env?: NodeJS.ProcessEnv): string {
  return join(campaignDir(slug, env), 'data', 'community.sqlite');
}

export function defaultCampaignTomlPath(slug: string, env?: NodeJS.ProcessEnv): string {
  return join(campaignDir(slug, env), 'campaign.toml');
}

/** Uploaded portraits and other campaign media. */
export function campaignMediaDir(slug: string, env?: NodeJS.ProcessEnv): string {
  return join(campaignDir(slug, env), 'media');
}

export function campaignAvatarsDir(slug: string, env?: NodeJS.ProcessEnv): string {
  return join(campaignMediaDir(slug, env), 'avatars');
}

/** Session runtime: pids, live URL, logs (not public snapshot). */
export function campaignRuntimeDir(slug: string, env?: NodeJS.ProcessEnv): string {
  return join(campaignDir(slug, env), 'runtime');
}

export function campaignRuntimeLogsDir(slug: string, env?: NodeJS.ProcessEnv): string {
  return join(campaignRuntimeDir(slug, env), 'logs');
}

export function liveUrlPath(slug: string, env?: NodeJS.ProcessEnv): string {
  return join(campaignRuntimeDir(slug, env), 'live.url');
}

export function sessionStatePath(slug: string, env?: NodeJS.ProcessEnv): string {
  return join(campaignRuntimeDir(slug, env), 'session.json');
}

/** Redacted between-session archive (static HTML + snapshot.json). */
export function campaignArchiveDir(slug: string, env?: NodeJS.ProcessEnv): string {
  return join(campaignDir(slug, env), 'archive');
}

/** Fully remove a campaign directory (SoT + config). Reconstruct with seed-demo. */
export function destroyCampaignDir(slug: string, env?: NodeJS.ProcessEnv): void {
  rmSync(campaignDir(slug, env), { recursive: true, force: true });
}
