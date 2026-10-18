import { existsSync, readFileSync } from 'node:fs';
import { publishSnapshotToEdge } from './edge-publish.js';
import {
  applyMachineDefaults,
  applyPublicSnapshot,
  campaignPublicUrl,
  defaultCampaignTomlPath,
  emptyCommunity,
  ensureCampaignLayout,
  openSqliteStore,
  parsePublicSnapshot,
  readCampaignConfig,
  refusedCampaignSlug,
  slugFromCampaignName,
  type CampaignConfig,
} from '@kodranni/store';

export type FoundPublish = (slug: string, cfg: CampaignConfig) => Promise<void>;

/**
 * Found a campaign, or open one that is already on this machine.
 * A reserved slug is refused before any directory is written.
 * The first write registers and publishes. A later `--name` leaves the store
 * and publishes nothing. `--from` restores, then registers and publishes.
 * An edge failure is logged. The caller still opens the desk.
 */
export async function foundCampaign(opts: {
  name: string;
  snapshotPath?: string;
  publish?: FoundPublish;
}): Promise<string> {
  const slug = slugFromCampaignName(opts.name);
  if (refusedCampaignSlug(slug)) {
    throw new Error(
      `“${slug}” is reserved. www, demo, and play stay on the product, and a name cannot start with origin-.`,
    );
  }
  const publish = opts.publish ?? publishSnapshotToEdge;
  const tomlPath = defaultCampaignTomlPath(slug);
  const existed = existsSync(tomlPath);
  const cfg = existed
    ? applyMachineDefaults(await readCampaignConfig(tomlPath))
    : await ensureCampaignLayout(slug, opts.name);

  const store = openSqliteStore(cfg.storePath);
  try {
    if (opts.snapshotPath) {
      const raw = readFileSync(opts.snapshotPath, 'utf8');
      applyPublicSnapshot(store, parsePublicSnapshot(raw), slug);
      console.log(`Restored campaign “${opts.name}” (${slug}) from snapshot`);
    } else if (!existed) {
      store.putCommunity(emptyCommunity(slug, opts.name));
      console.log(`Found campaign “${opts.name}” (${slug})`);
    } else {
      console.log(`Campaign “${cfg.name}” (${slug}) is already on this machine`);
    }
  } finally {
    store.close();
  }

  console.log(`  public: ${campaignPublicUrl(slug)}`);
  console.log(`  store:  ${cfg.storePath}`);

  if (!existed || opts.snapshotPath) {
    try {
      await publish(slug, cfg);
    } catch (e) {
      console.error(`  edge: ${e instanceof Error ? e.message : e}`);
    }
  }
  return slug;
}
