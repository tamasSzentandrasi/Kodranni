import { existsSync, readFileSync } from 'node:fs';
import {
  campaignAvatarsDir,
  defaultCampaignTomlPath,
  parseCampaignToml,
} from '@kodranni/store';

/** Resolve campaign slug from env (live CLI sets these). */
export function resolveCampaignSlug(): string | null {
  if (process.env.KODRANNI_CAMPAIGN_SLUG) return process.env.KODRANNI_CAMPAIGN_SLUG;
  const storePath = process.env.KODRANNI_STORE_PATH;
  if (!storePath) return null;
  // .../campaigns/<slug>/data/community.sqlite
  const m = storePath.replace(/\\/g, '/').match(/\/campaigns\/([^/]+)\//);
  return m?.[1] ?? null;
}

export function resolveStorePath(): string | null {
  const storePath = process.env.KODRANNI_STORE_PATH;
  if (storePath && existsSync(storePath)) return storePath;
  const slug = process.env.KODRANNI_CAMPAIGN_SLUG;
  if (!slug) return null;
  try {
    const tomlPath = defaultCampaignTomlPath(slug);
    if (!existsSync(tomlPath)) return null;
    const cfg = parseCampaignToml(readFileSync(tomlPath, 'utf8'));
    return existsSync(cfg.storePath) ? cfg.storePath : null;
  } catch {
    return null;
  }
}

export function resolveAvatarsDir(): string | null {
  const slug = resolveCampaignSlug();
  if (!slug) return null;
  return campaignAvatarsDir(slug);
}
