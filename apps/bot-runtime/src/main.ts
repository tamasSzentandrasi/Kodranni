/**
 * Kodranni bot-runtime — session chat loop (Discord first).
 * Calls packages/app in-process; never shells the CLI.
 *
 * Env:
 *   KODRANNI_STORE_PATH, KODRANNI_CAMPAIGN_SLUG
 *   DISCORD_BOT_TOKEN, DISCORD_GUILD_ID
 *   DISCORD_PLAY_CHANNEL_ID (optional — post live link on start)
 *   KODRANNI_LIVE_BASE_URL, KODRANNI_PUBLIC_BASE_URL (optional)
 */
import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createDiscordAdapter } from '@kodranni/adapter-discord';
import {
  DEMO_SLUG,
  defaultCampaignTomlPath,
  ensureCampaignRuntime,
  openSqliteStore,
  campaignRuntimeLogsDir,
  readCampaignConfig,
  readLiveUrl,
} from '@kodranni/store';
import { handleInteraction, type BotContext } from './router.js';

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
  const slug = process.env.KODRANNI_CAMPAIGN_SLUG ?? DEMO_SLUG;
  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!token || !guildId) {
    console.error(
      'bot-runtime requires DISCORD_BOT_TOKEN and DISCORD_GUILD_ID.\n' +
        '  Map users with /kod-map after start.',
    );
    process.exit(1);
  }

  let storePath = process.env.KODRANNI_STORE_PATH;
  let liveBase =
    process.env.KODRANNI_LIVE_BASE_URL ??
    readLiveUrl(slug) ??
    'http://127.0.0.1:8742';
  let archiveBase = process.env.KODRANNI_PUBLIC_BASE_URL;

  try {
    const cfg = await readCampaignConfig(defaultCampaignTomlPath(slug));
    storePath = storePath ?? cfg.storePath;
    archiveBase = archiveBase ?? cfg.publicBaseUrl;
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
  };

  port.onInteraction((i) => handleInteraction(ctx, i));

  ctx.log(`starting bot for campaign ${slug}`);
  await port.start();
  ctx.log(`discord ready · live=${liveBase}`);

  const play = process.env.DISCORD_PLAY_CHANNEL_ID;
  if (play) {
    try {
      await port.sendCard(play, {
        title: 'Kodranni session',
        description: 'Living record is online.',
        accent: 'blood',
        fields: [
          { name: 'Live', value: liveBase, inline: false },
          ...(archiveBase
            ? [{ name: 'Archive', value: archiveBase, inline: false }]
            : []),
        ],
        footer: 'ST: /kod-map · /kod-prompt · Players: Roll button or /kod-roll',
      });
      ctx.log(`posted access card to ${play}`);
    } catch (e) {
      ctx.log(`play channel post failed: ${e instanceof Error ? e.message : e}`);
    }
  }

  const shutdown = async () => {
    ctx.log('stopping');
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
