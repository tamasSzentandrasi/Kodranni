/**
 * Kodranni bot-runtime — session chat loop (Discord first).
 * Calls packages/app in-process; never shells the CLI.
 *
 * Env (also loaded from ~/.kodranni/secrets/ — existing env wins):
 *   KODRANNI_STORE_PATH, KODRANNI_CAMPAIGN_SLUG
 *   DISCORD_BOT_TOKEN, DISCORD_GUILD_ID
 *   DISCORD_PLAY_CHANNEL_ID (optional — post live link on start)
 *   FLUXER_BOT_TOKEN, FLUXER_GUILD_ID, FLUXER_PLAY_CHANNEL_ID (loaded; adapter pending)
 *   KODRANNI_LIVE_BASE_URL, KODRANNI_PUBLIC_BASE_URL (optional)
 *   KODRANNI_SHEET_TOKEN_SECRET (or secrets/sheet-token-secret) for sheet edit links
 */
import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createDiscordAdapter } from '@kodranni/adapter-discord';
import {
  DEMO_SLUG,
  defaultCampaignTomlPath,
  ensureCampaignRuntime,
  formatCredentialStatus,
  loadSecretsIntoEnv,
  openSqliteStore,
  platformCredentialStatus,
  campaignRuntimeLogsDir,
  readCampaignConfig,
  readLiveUrl,
} from '@kodranni/store';
import { issueSheetToken, sheetTokenSecret, withEditToken } from '@kodranni/app';
import {
  buildDraftReviewCard,
  handleInteraction,
  pruneAnnouncedReviews,
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

async function main(): Promise<void> {
  const loaded = loadSecretsIntoEnv();
  const slug = process.env.KODRANNI_CAMPAIGN_SLUG ?? DEMO_SLUG;
  const creds = platformCredentialStatus();
  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!token || !guildId) {
    console.error(
      'bot-runtime requires Discord token + guild.\n' +
        `  Expected files under ${loaded.dir}: discord-botToken, discord-serverID\n` +
        '  (or export DISCORD_BOT_TOKEN and DISCORD_GUILD_ID).',
    );
    process.exit(1);
  }

  let storePath = process.env.KODRANNI_STORE_PATH;
  let liveBase =
    process.env.KODRANNI_LIVE_BASE_URL ??
    readLiveUrl(slug) ??
    'http://127.0.0.1:8742';
  let archiveBase = process.env.KODRANNI_PUBLIC_BASE_URL;
  let discordStorytellerRoleId: string | undefined;
  let fluxerStorytellerRoleId: string | undefined;

  try {
    const cfg = await readCampaignConfig(defaultCampaignTomlPath(slug));
    storePath = storePath ?? cfg.storePath;
    archiveBase = archiveBase ?? cfg.publicBaseUrl;
    discordStorytellerRoleId =
      cfg.discordStorytellerRoleId ?? process.env.DISCORD_STORYTELLER_ROLE_ID?.trim();
    fluxerStorytellerRoleId =
      cfg.fluxerStorytellerRoleId ?? process.env.FLUXER_STORYTELLER_ROLE_ID?.trim();
    if (!process.env.KODRANNI_LIVE_BASE_URL) {
      liveBase = readLiveUrl(slug) ?? cfg.liveBaseUrl;
    }
  } catch {
    /* use env only */
  }

  if (!storePath) {
    console.error('No store path — set KODRANNI_STORE_PATH or campaign.toml');
    process.exit(1);
  }

  ensureCampaignRuntime(slug);
  const logPath = `${campaignRuntimeLogsDir(slug)}/bot.log`;
  mkdirSync(dirname(logPath), { recursive: true });

  const store = openSqliteStore(storePath);
  const port = createDiscordAdapter({
    token,
    guildId,
    playChannelId: process.env.DISCORD_PLAY_CHANNEL_ID,
  });

  const ctx: BotContext = {
    store,
    port,
    liveBaseUrl: liveBase,
    archiveBaseUrl: archiveBase,
    prompts: new Map(),
    log: (line) => logLine(logPath, line),
    discordStorytellerRoleId,
    fluxerStorytellerRoleId,
  };

  port.onInteraction((i) => handleInteraction(ctx, i));

  ctx.log(`starting bot for campaign ${slug}`);
  ctx.log(`creds ${formatCredentialStatus(creds)}`);
  if (discordStorytellerRoleId) {
    ctx.log(`ST Discord role id: ${discordStorytellerRoleId}`);
  } else {
    ctx.log('ST Discord role id: (unset — use /map role:storyteller or set discord_storyteller_role_id)');
  }
  if (loaded.loosened.length) {
    ctx.log(`tightened mode on: ${loaded.loosened.join(', ')}`);
  }
  if (creds.fluxer.ready) {
    ctx.log('fluxer credentials loaded — adapter not connected yet (no gateway)');
  }
  await port.start();
  ctx.log(`discord ready · live=${liveBase}`);

  const play = process.env.DISCORD_PLAY_CHANNEL_ID;
  if (play) {
    try {
      await port.sendCard(play, {
        title: 'Kodranni session',
        description: 'Living record is online. Character sheets are editable at the live URL.',
        accent: 'blood',
        fields: [
          { name: 'Live sheet', value: liveBase, inline: false },
          ...(archiveBase
            ? [{ name: 'Archive', value: archiveBase, inline: false }]
            : []),
        ],
        footer: 'Players: /create · /roll · ST: /intent · /award-word · Harm on roll cards',
      });
      ctx.log(`posted access card to ${play}`);
    } catch (e) {
      ctx.log(`play channel post failed: ${e instanceof Error ? e.message : e}`);
    }
  }

  const announcedReviews = new Set<string>();
  const sheetUrl = (
    characterSlug: string,
    edit?: { accountId: string; role?: 'player' | 'storyteller' },
  ) => {
    let url = `${liveBase.replace(/\/$/, '')}/characters/${characterSlug}/`;
    if (edit && sheetTokenSecret()) {
      try {
        url = withEditToken(
          url,
          issueSheetToken({
            platform: 'discord',
            accountId: edit.accountId,
            characterSlug,
            role: edit.role ?? 'player',
          }),
        );
      } catch {
        /* leave bare */
      }
    }
    return url;
  };
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
        const ownerId = ch.initiator?.accountId ?? '';
        await port.sendCard(
          play,
          buildDraftReviewCard({
            characterName: ch.name,
            characterSlug: ch.slug,
            mentionAccountId: ownerId,
            liveSheetUrl: ownerId
              ? sheetUrl(ch.slug, { accountId: ownerId, role: 'player' })
              : sheetUrl(ch.slug),
          }),
        );
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
    void announcePendingReviews();
  }, 2000);

  const shutdown = async () => {
    ctx.log('stopping');
    clearInterval(reviewTimer);
    await port.stop();
    store.close();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
