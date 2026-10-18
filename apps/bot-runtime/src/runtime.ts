/**
 * Discord bot loop — HTTP ChatPort in campaign-ui (default), gateway hatch optional.
 */
import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createDiscordAdapter, createDiscordHttpAdapter } from '@kodranni/adapter-discord';
import { createFluxerAdapter, type FluxerSocket } from '@kodranni/adapter-fluxer';
import {
  DEMO_SLUG,
  applyCampaignFluxerEnv,
  defaultCampaignTomlPath,
  ensureCampaignRuntime,
  ensureEdgeDeviceKey,
  formatCredentialStatus,
  loadSecretsIntoEnv,
  openSqliteStore,
  platformCredentialStatus,
  campaignRuntimeLogsDir,
  readCampaignConfig,
  readLiveUrl,
} from '@kodranni/store';
import {
  handleInteraction,
  pruneAnnouncedReviews,
  sessionInboxNotice,
  slugsNeedingReviewCard,
  type BotContext,
} from './router.js';

function logLine(logPath: string, line: string): void {
  const stamp = new Date().toISOString();
  const msg = `${stamp} ${line}\n`;
  try {
    appendFileSync(logPath, msg);
  } catch {
    /* ignore */
  }
  console.log(line);
}

export type BotMode = 'http' | 'gateway';

export interface BotHandle {
  stop: () => Promise<void>;
  receiveInteraction: (raw: unknown) => Promise<void>;
}

export function resolveBotMode(env: NodeJS.ProcessEnv = process.env): BotMode {
  return env.KODRANNI_DISCORD_GATEWAY === '1' ? 'gateway' : 'http';
}

export async function startBotRuntime(opts?: { mode?: BotMode }): Promise<BotHandle> {
  const loaded = loadSecretsIntoEnv();
  const slug = process.env.KODRANNI_CAMPAIGN_SLUG ?? DEMO_SLUG;
  const mode = opts?.mode ?? resolveBotMode();
  const token = process.env.DISCORD_BOT_TOKEN;

  let storePath = process.env.KODRANNI_STORE_PATH;
  let liveBase =
    process.env.KODRANNI_LIVE_BASE_URL ?? readLiveUrl(slug) ?? 'http://127.0.0.1:8742';
  let publicUrl = process.env.KODRANNI_PUBLIC_BASE_URL;
  let discordStorytellerRoleId: string | undefined;
  let fluxerStorytellerRoleId: string | undefined;
  let edgeUrl =
    process.env.KODRANNI_EDGE_CONTROL_URL?.trim() || process.env.KODRANNI_EDGE_URL?.trim();

  try {
    const cfg = await readCampaignConfig(defaultCampaignTomlPath(slug));
    applyCampaignFluxerEnv(cfg);
    storePath = storePath ?? cfg.storePath;
    publicUrl = publicUrl ?? cfg.edgeUrl ?? cfg.publicBaseUrl;
    discordStorytellerRoleId =
      cfg.discordStorytellerRoleId ?? process.env.DISCORD_STORYTELLER_ROLE_ID?.trim();
    fluxerStorytellerRoleId =
      cfg.fluxerStorytellerRoleId ?? process.env.FLUXER_STORYTELLER_ROLE_ID?.trim();
    edgeUrl = edgeUrl ?? cfg.edgeControlUrl ?? cfg.edgeUrl;
    if (!process.env.KODRANNI_LIVE_BASE_URL) {
      liveBase = readLiveUrl(slug) ?? cfg.liveBaseUrl;
    }
  } catch {
    /* use env only */
  }

  const creds = platformCredentialStatus();
  const guildId = process.env.DISCORD_GUILD_ID;
  if (mode === 'gateway' && (!token || !guildId)) {
    throw new Error(
      `bot-runtime gateway requires Discord token + guild (files under ${loaded.dir}: discord-botToken, discord-serverID)`,
    );
  }

  if (!storePath) {
    throw new Error('No store path — set KODRANNI_STORE_PATH or campaign.toml');
  }

  ensureCampaignRuntime(slug);
  const logPath = `${campaignRuntimeLogsDir(slug)}/bot.log`;
  mkdirSync(dirname(logPath), { recursive: true });

  const store = openSqliteStore(storePath);
  const httpPort =
    mode === 'http'
      ? createDiscordHttpAdapter({
          campaignId: slug,
          edgeUrl,
          deviceKey: ensureEdgeDeviceKey(),
          applicationId: process.env.DISCORD_APP_ID,
        })
      : null;
  const port =
    httpPort ??
    createDiscordAdapter({
      token: token!,
      guildId: guildId!,
      playChannelId: process.env.DISCORD_PLAY_CHANNEL_ID,
    });

  const shareUrl = (publicUrl || liveBase).replace(/\/$/, '');

  const ctx: BotContext = {
    store,
    port,
    liveBaseUrl: shareUrl,
    archiveBaseUrl: shareUrl,
    prompts: new Map(),
    log: (line) => logLine(logPath, line),
    discordStorytellerRoleId,
    fluxerStorytellerRoleId,
  };

  port.onInteraction((i) => handleInteraction(ctx, i));

  ctx.log(`starting bot for campaign ${slug} (${mode})`);
  ctx.log(`creds ${formatCredentialStatus(creds)}`);
  if (discordStorytellerRoleId) {
    ctx.log(`ST Discord role id: ${discordStorytellerRoleId}`);
  } else {
    ctx.log('ST Discord role id: (unset — set discord_storyteller_role_id)');
  }
  if (loaded.loosened.length) {
    ctx.log(`tightened mode on: ${loaded.loosened.join(', ')}`);
  }
  if (creds.fluxer.ready) {
    ctx.log('fluxer credentials loaded');
  }
  await port.start();
  ctx.log(`discord ready · url=${shareUrl}`);

  const play = process.env.DISCORD_PLAY_CHANNEL_ID;
  if (play) {
    try {
      await port.sendCard(play, {
        title: 'Kodranni session',
        description: 'Living record is online. Open the community URL for sheets.',
        accent: 'blood',
        fields: [{ name: 'Community', value: shareUrl, inline: false }],
        footer: 'Players: /create · /roll · ST: /intent · /award-word · Harm on roll cards',
      });
      ctx.log(`posted access card to ${play}`);
    } catch (e) {
      ctx.log(`play channel post failed: ${e instanceof Error ? e.message : e}`);
    }
  }

  const announcedReviews = new Set<string>();
  const announcePendingReviews = async () => {
    if (!play) return;
    const pending = store.listCharacters().filter((c) => c.status === 'pending_review');
    const slugs = slugsNeedingReviewCard(
      pending.map((c) => c.slug),
      announcedReviews,
    );
    for (const characterSlug of slugs) {
      const ch = pending.find((c) => c.slug === characterSlug);
      if (!ch) continue;
      try {
        await port.sendCard(play, sessionInboxNotice(ch.name));
        announcedReviews.add(ch.slug);
        ctx.log(`posted review card for ${ch.slug}`);
      } catch (e) {
        ctx.log(
          `review card failed for ${ch.slug}: ${e instanceof Error ? e.message : e}`,
        );
      }
    }
    pruneAnnouncedReviews(
      pending.map((c) => c.slug),
      announcedReviews,
    );
  };
  const reviewTimer = setInterval(() => {
    if (stopped) return;
    void announcePendingReviews();
  }, 2000);

  let stopped = false;
  return {
    receiveInteraction: async (raw: unknown) => {
      if (httpPort) await httpPort.receive(raw);
    },
    stop: async () => {
      if (stopped) return;
      stopped = true;
      ctx.log('stopping');
      clearInterval(reviewTimer);
      await port.stop();
      store.close();
    },
  };
}

/** Host gateway for the Fluxer play channel. The desk calls this. Tests do not. */
export async function startFluxerRuntime(): Promise<BotHandle> {
  const loaded = loadSecretsIntoEnv();
  const slug = process.env.KODRANNI_CAMPAIGN_SLUG ?? DEMO_SLUG;
  let storePath = process.env.KODRANNI_STORE_PATH;
  let liveBase =
    process.env.KODRANNI_LIVE_BASE_URL ?? readLiveUrl(slug) ?? 'http://127.0.0.1:8742';
  let publicUrl = process.env.KODRANNI_PUBLIC_BASE_URL;
  let fluxerStorytellerRoleId: string | undefined;
  try {
    const cfg = await readCampaignConfig(defaultCampaignTomlPath(slug));
    applyCampaignFluxerEnv(cfg);
    storePath = storePath ?? cfg.storePath;
    publicUrl = publicUrl ?? cfg.edgeUrl ?? cfg.publicBaseUrl;
    fluxerStorytellerRoleId =
      cfg.fluxerStorytellerRoleId ?? process.env.FLUXER_STORYTELLER_ROLE_ID?.trim();
    if (!process.env.KODRANNI_LIVE_BASE_URL) {
      liveBase = readLiveUrl(slug) ?? cfg.liveBaseUrl;
    }
  } catch {
    /* use env only */
  }

  const token = process.env.FLUXER_BOT_TOKEN?.trim() ?? '';
  const guildId = process.env.FLUXER_GUILD_ID?.trim() ?? '';
  const playChannelId = process.env.FLUXER_PLAY_CHANNEL_ID?.trim() ?? '';
  if (!guildId || !playChannelId) {
    throw new Error('Set the Fluxer server and play channel first.');
  }
  if (!token) throw new Error('fluxer token is missing');
  if (!storePath) throw new Error('No store path — set KODRANNI_STORE_PATH or campaign.toml');
  const Socket = globalThis.WebSocket;
  if (typeof Socket !== 'function') throw new Error('fluxer gateway is unavailable');

  ensureCampaignRuntime(slug);
  const logPath = `${campaignRuntimeLogsDir(slug)}/bot.log`;
  mkdirSync(dirname(logPath), { recursive: true });
  const store = openSqliteStore(storePath);
  const port = createFluxerAdapter({
    token,
    guildId,
    playChannelId,
    gateway: { WebSocket: Socket as unknown as new (url: string) => FluxerSocket },
  });
  const shareUrl = (publicUrl || liveBase).replace(/\/$/, '');
  const ctx: BotContext = {
    store,
    port,
    liveBaseUrl: shareUrl,
    archiveBaseUrl: shareUrl,
    prompts: new Map(),
    log: (line) => logLine(logPath, line),
    fluxerStorytellerRoleId,
  };
  port.onInteraction((i) => handleInteraction(ctx, i));
  ctx.log(`starting fluxer for campaign ${slug}`);
  if (loaded.loosened.length) ctx.log(`tightened mode on: ${loaded.loosened.join(', ')}`);

  let stopped = false;
  try {
    await port.start();
  } catch (err) {
    store.close();
    throw err;
  }
  ctx.log('fluxer ready');
  try {
    await port.sendCard(playChannelId, {
      title: 'Kodranni session',
      description: 'Living record is on Fluxer. Commands start with !.',
      accent: 'blood',
      fields: [{ name: 'Community', value: shareUrl, inline: false }],
    });
    ctx.log('posted the fluxer session card');
  } catch (err) {
    ctx.log(`fluxer session card failed: ${err instanceof Error ? err.message : err}`);
  }

  return {
    receiveInteraction: async () => {},
    stop: async () => {
      if (stopped) return;
      stopped = true;
      ctx.log('stopping fluxer');
      await port.stop();
      store.close();
    },
  };
}
