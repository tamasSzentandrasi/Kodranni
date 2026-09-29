import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  SCHEMA_VERSION,
  campaignArchiveDir,
  defaultCampaignTomlPath,
  platformCredentialStatus,
  productPublicEdgeUrl,
  readCampaignConfig,
  readSessionState,
} from '@kodranni/store';
import { loadCommunity } from '../data/load';
import { resolveCampaignSlug } from './campaign-paths';

export interface DeskDiscordBind {
  guild: string;
  channel: string;
  role: string;
}

export interface DeskStrip {
  phase: 'down' | 'desk' | 'live';
  publicUrl: string;
  discordBound: boolean;
  fluxerBound: boolean;
  tunnelUp: boolean;
  snapshotAt: string | null;
  snapshotSchema: number | null;
  productSchema: number;
  /** Extra scene lines beyond the standing 7 and 13. None are stored yet. */
  sceneLines: number;
  tideOpen: boolean;
  submissions: number;
  discord: DeskDiscordBind;
}

function tableOn(slug: string, origin: string): string {
  const host = origin.replace(/\/$/, '');
  if (slug === 'aspalath' || slug === 'demo' || slug === 'play') return `${host}/community/`;
  return `${host}/community/?campaign=${encodeURIComponent(slug)}`;
}

/** The table URL this binary serves. A bare tunnel origin still needs the hall path. */
function publicTableUrl(slug: string, liveUrl: string | undefined, tunnelUp: boolean): string {
  if (tunnelUp && liveUrl && /^https?:\/\//.test(liveUrl)) {
    try {
      const u = new URL(liveUrl);
      if (u.pathname && u.pathname !== '/') return liveUrl;
      return tableOn(slug, u.origin);
    } catch {
      /* use the product host */
    }
  }
  return tableOn(slug, productPublicEdgeUrl(slug));
}

async function discordBind(slug: string): Promise<DeskDiscordBind> {
  try {
    const toml = await readCampaignConfig(defaultCampaignTomlPath(slug));
    return {
      guild: toml.discordGuildId ?? process.env.DISCORD_GUILD_ID ?? '',
      channel: toml.discordPlayChannelId ?? process.env.DISCORD_PLAY_CHANNEL_ID ?? '',
      role: toml.discordStorytellerRoleId ?? process.env.DISCORD_STORYTELLER_ROLE_ID ?? '',
    };
  } catch {
    return {
      guild: process.env.DISCORD_GUILD_ID ?? '',
      channel: process.env.DISCORD_PLAY_CHANNEL_ID ?? '',
      role: process.env.DISCORD_STORYTELLER_ROLE_ID ?? '',
    };
  }
}

function snapshotFile(slug: string): { at: string | null; schema: number | null } {
  const path = join(campaignArchiveDir(slug), 'snapshot.json');
  if (!existsSync(path)) return { at: null, schema: null };
  try {
    const raw = JSON.parse(readFileSync(path, 'utf8')) as { generatedAt?: string; schemaVersion?: number };
    return {
      at: typeof raw.generatedAt === 'string' ? raw.generatedAt : null,
      schema: typeof raw.schemaVersion === 'number' ? raw.schemaVersion : null,
    };
  } catch {
    return { at: null, schema: null };
  }
}

/** Readiness for the desk strip. Tide and scene lines have no session store yet. */
export async function readDeskStrip(): Promise<DeskStrip | null> {
  const slug = resolveCampaignSlug();
  if (!slug) return null;
  const session = readSessionState(slug);
  const creds = platformCredentialStatus();
  const discord = await discordBind(slug);
  const snap = snapshotFile(slug);
  let submissions = 0;
  try {
    const c = loadCommunity();
    submissions = c.characters.filter((ch) => ch.status === 'pending_review').length;
  } catch {
    submissions = 0;
  }
  const tunnelUp = Boolean(session?.tunnel);
  const phase = !session?.startedAt ? 'down' : tunnelUp ? 'live' : 'desk';
  return {
    phase,
    publicUrl: publicTableUrl(slug, session?.liveUrl, tunnelUp),
    discordBound: Boolean(discord.guild && discord.channel && discord.role),
    fluxerBound: Boolean(creds.fluxer.guild && creds.fluxer.playChannel),
    tunnelUp,
    snapshotAt: snap.at,
    snapshotSchema: snap.schema,
    productSchema: SCHEMA_VERSION,
    sceneLines: 0,
    tideOpen: false,
    submissions,
    discord,
  };
}
