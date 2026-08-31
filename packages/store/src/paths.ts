import { existsSync, readdirSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

function homeDir(env: NodeJS.ProcessEnv): string {
  return env.HOME || env.USERPROFILE || homedir();
}

function legacyRoot(env: NodeJS.ProcessEnv): string | undefined {
  if (env.KODRANNI_HOME) return undefined;
  const p = join(homeDir(env), '.kodranni');
  return existsSync(p) ? p : undefined;
}

export function kodranniDataHome(env: NodeJS.ProcessEnv = process.env): string {
  if (env.KODRANNI_HOME) return env.KODRANNI_HOME;
  const legacy = legacyRoot(env);
  if (legacy) return legacy;
  return join(env.XDG_DATA_HOME || join(homeDir(env), '.local/share'), 'kodranni');
}

export function kodranniConfigHome(env: NodeJS.ProcessEnv = process.env): string {
  if (env.KODRANNI_HOME) return env.KODRANNI_HOME;
  const legacy = legacyRoot(env);
  if (legacy) return legacy;
  return join(env.XDG_CONFIG_HOME || join(homeDir(env), '.config'), 'kodranni');
}

export function kodranniStateHome(env: NodeJS.ProcessEnv = process.env): string {
  if (env.KODRANNI_HOME) return env.KODRANNI_HOME;
  const legacy = legacyRoot(env);
  if (legacy) return legacy;
  return join(env.XDG_STATE_HOME || join(homeDir(env), '.local/state'), 'kodranni');
}

/** Data root. KODRANNI_HOME and existing ~/.kodranni win over XDG. */
export function kodranniHome(env: NodeJS.ProcessEnv = process.env): string {
  return kodranniDataHome(env);
}

export function campaignDir(slug: string, env?: NodeJS.ProcessEnv): string {
  return join(kodranniDataHome(env), 'campaigns', slug);
}

export function campaignsRoot(env?: NodeJS.ProcessEnv): string {
  return join(kodranniDataHome(env), 'campaigns');
}

export function listCampaignSlugs(env?: NodeJS.ProcessEnv): string[] {
  const root = campaignsRoot(env);
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(root, d.name, 'campaign.toml')))
    .map((d) => d.name)
    .sort();
}

/** ST-machine secrets: libsecret first, 0600 files under config. */
export function secretsDir(env: NodeJS.ProcessEnv = process.env): string {
  if (env.KODRANNI_SECRETS_DIR) return env.KODRANNI_SECRETS_DIR;
  return join(kodranniConfigHome(env), 'secrets');
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
  return join(kodranniStateHome(env), 'campaigns', slug, 'runtime');
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
  rmSync(campaignRuntimeDir(slug, env), { recursive: true, force: true });
}
