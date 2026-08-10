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

export function defaultStorePath(slug: string, env?: NodeJS.ProcessEnv): string {
  return join(campaignDir(slug, env), 'data', 'community.sqlite');
}

export function defaultCampaignTomlPath(slug: string, env?: NodeJS.ProcessEnv): string {
  return join(campaignDir(slug, env), 'campaign.toml');
}
