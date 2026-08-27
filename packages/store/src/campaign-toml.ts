import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { campaignDir, campaignRuntimeLogsDir, defaultStorePath } from './paths.js';

/** How mid-session public access is exposed when --tunnel is used. */
export type TunnelMode = 'quick' | 'named';

export interface CampaignConfig {
  schema: number;
  slug: string;
  name: string;
  storePath: string;
  liveBind: string;
  /**
   * URL players open mid-session when the tunnel is up.
   * Local default http://127.0.0.1:8742; for named tunnels set to https://your.subdomain.
   */
  liveBaseUrl: string;
  publicRepo?: string;
  publicBaseUrl?: string;
  /** Edge Function origin (one hostname). Snapshot PUT + session presence. */
  edgeUrl?: string;
  publishDebounceMs: number;
  platforms: string[];
  /**
   * `quick` = free trycloudflare.com word-URL (default).
   * `named` = Storyteller domain/subdomain via Cloudflare named tunnel.
   */
  tunnelMode?: TunnelMode;
  /**
   * Public HTTPS origin for named tunnels (e.g. https://live.example.com).
   * If omitted, `live_base_url` must already be https://… (not localhost).
   */
  tunnelHostname?: string;
  /**
   * Cloudflare tunnel run token (Zero Trust → Tunnels → Configure).
   * Prefer env KODRANNI_CF_TUNNEL_TOKEN if you do not want it in the file.
   */
  cloudflareTunnelToken?: string;
  /** Local tunnel name for `cloudflared tunnel run <name>` (after tunnel login/create). */
  cloudflareTunnelName?: string;
  /** Optional path to cloudflared config.yml */
  cloudflareTunnelConfig?: string;
  /**
   * Discord guild role ID whose holders are Storytellers (preferred over /map).
   * Snowflakes as strings.
   */
  discordStorytellerRoleId?: string;
  /** Fluxer server role ID for Storytellers (when Fluxer adapter is live). */
  fluxerStorytellerRoleId?: string;
}

const DEFAULTS = {
  schema: 1,
  liveBind: '127.0.0.1:8742',
  liveBaseUrl: 'http://127.0.0.1:8742',
  publishDebounceMs: 45000,
  platforms: [] as string[],
  tunnelMode: 'quick' as TunnelMode,
};

/** Minimal TOML writer/reader for our fixed keys (no third-party TOML dep). */
export function serializeCampaignToml(cfg: CampaignConfig): string {
  const lines = [
    `schema = ${cfg.schema}`,
    `slug = ${tomlString(cfg.slug)}`,
    `name = ${tomlString(cfg.name)}`,
    '',
    `store_path = ${tomlString(cfg.storePath)}`,
    `live_bind = ${tomlString(cfg.liveBind)}`,
    `live_base_url = ${tomlString(cfg.liveBaseUrl)}`,
  ];
  if (cfg.publicRepo) lines.push(`public_repo = ${tomlString(cfg.publicRepo)}`);
  if (cfg.publicBaseUrl) lines.push(`public_base_url = ${tomlString(cfg.publicBaseUrl)}`);
  if (cfg.edgeUrl) lines.push(`edge_url = ${tomlString(cfg.edgeUrl)}`);
  lines.push('', `publish_debounce_ms = ${cfg.publishDebounceMs}`);
  if (cfg.platforms.length) {
    lines.push(`platforms = [${cfg.platforms.map(tomlString).join(', ')}]`);
  }
  const mode = cfg.tunnelMode ?? DEFAULTS.tunnelMode;
  lines.push('', `# mid-session tunnel: quick (trycloudflare) | named (your domain)`);
  lines.push(`tunnel_mode = ${tomlString(mode)}`);
  if (cfg.tunnelHostname) lines.push(`tunnel_hostname = ${tomlString(cfg.tunnelHostname)}`);
  if (cfg.cloudflareTunnelToken) {
    lines.push(`cloudflare_tunnel_token = ${tomlString(cfg.cloudflareTunnelToken)}`);
  }
  if (cfg.cloudflareTunnelName) {
    lines.push(`cloudflare_tunnel_name = ${tomlString(cfg.cloudflareTunnelName)}`);
  }
  if (cfg.cloudflareTunnelConfig) {
    lines.push(`cloudflare_tunnel_config = ${tomlString(cfg.cloudflareTunnelConfig)}`);
  }
  if (cfg.discordStorytellerRoleId || cfg.fluxerStorytellerRoleId) {
    lines.push('', '# Storyteller recognition (platform role IDs)');
  }
  if (cfg.discordStorytellerRoleId) {
    lines.push(`discord_storyteller_role_id = ${tomlString(cfg.discordStorytellerRoleId)}`);
  }
  if (cfg.fluxerStorytellerRoleId) {
    lines.push(`fluxer_storyteller_role_id = ${tomlString(cfg.fluxerStorytellerRoleId)}`);
  }
  lines.push('');
  return lines.join('\n');
}

function tomlString(s: string): string {
  return JSON.stringify(s);
}

export function parseCampaignToml(text: string): CampaignConfig {
  const map = new Map<string, string>();
  for (const raw of text.split('\n')) {
    const line = raw.replace(/#.*$/, '').trim();
    if (!line || line.startsWith('[')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    map.set(key, value);
  }

  const slug = unquote(map.get('slug') ?? '');
  if (!slug) throw new Error('campaign.toml: missing slug');
  const name = unquote(map.get('name') ?? slug);
  const storePath = unquote(map.get('store_path') ?? defaultStorePath(slug));

  const modeRaw = unquote(map.get('tunnel_mode') ?? DEFAULTS.tunnelMode);
  const tunnelMode: TunnelMode = modeRaw === 'named' ? 'named' : 'quick';

  return {
    schema: Number(map.get('schema') ?? DEFAULTS.schema),
    slug,
    name,
    storePath,
    liveBind: unquote(map.get('live_bind') ?? DEFAULTS.liveBind),
    liveBaseUrl: unquote(map.get('live_base_url') ?? DEFAULTS.liveBaseUrl),
    publicRepo: map.has('public_repo') ? unquote(map.get('public_repo')!) : undefined,
    publicBaseUrl: map.has('public_base_url') ? unquote(map.get('public_base_url')!) : undefined,
    edgeUrl: map.has('edge_url') ? unquote(map.get('edge_url')!) : undefined,
    publishDebounceMs: Number(map.get('publish_debounce_ms') ?? DEFAULTS.publishDebounceMs),
    platforms: parseArray(map.get('platforms') ?? '[]'),
    tunnelMode,
    tunnelHostname: map.has('tunnel_hostname')
      ? unquote(map.get('tunnel_hostname')!)
      : undefined,
    cloudflareTunnelToken: map.has('cloudflare_tunnel_token')
      ? unquote(map.get('cloudflare_tunnel_token')!)
      : undefined,
    cloudflareTunnelName: map.has('cloudflare_tunnel_name')
      ? unquote(map.get('cloudflare_tunnel_name')!)
      : undefined,
    cloudflareTunnelConfig: map.has('cloudflare_tunnel_config')
      ? unquote(map.get('cloudflare_tunnel_config')!)
      : undefined,
    discordStorytellerRoleId: map.has('discord_storyteller_role_id')
      ? unquote(map.get('discord_storyteller_role_id')!)
      : undefined,
    fluxerStorytellerRoleId: map.has('fluxer_storyteller_role_id')
      ? unquote(map.get('fluxer_storyteller_role_id')!)
      : undefined,
  };
}

/** Resolve public share URL for a named tunnel (hostname or https live_base_url). */
export function resolveNamedTunnelPublicUrl(cfg: CampaignConfig): string {
  const raw = (cfg.tunnelHostname ?? cfg.liveBaseUrl).trim();
  if (!raw) {
    throw new Error(
      'named tunnel requires tunnel_hostname or live_base_url (https://your.subdomain)',
    );
  }
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    if (raw.includes('127.0.0.1') || raw.includes('localhost')) {
      throw new Error(
        'named tunnel: set tunnel_hostname or live_base_url to your public https:// hostname, not localhost',
      );
    }
    return raw.replace(/\/$/, '');
  }
  return `https://${raw.replace(/\/$/, '')}`;
}

export function resolveTunnelMode(
  cfg: CampaignConfig,
  env: NodeJS.ProcessEnv = process.env,
): TunnelMode {
  if (env.KODRANNI_TUNNEL_MODE === 'named' || env.KODRANNI_TUNNEL_MODE === 'quick') {
    return env.KODRANNI_TUNNEL_MODE;
  }
  if (cfg.tunnelMode === 'named') return 'named';
  // Implicit named if token/name provided
  if (
    cfg.cloudflareTunnelToken ||
    env.KODRANNI_CF_TUNNEL_TOKEN ||
    cfg.cloudflareTunnelName ||
    cfg.cloudflareTunnelConfig
  ) {
    return 'named';
  }
  return cfg.tunnelMode ?? 'quick';
}

function unquote(v: string): string {
  const t = v.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
}

function parseArray(v: string): string[] {
  const t = v.trim();
  if (!t.startsWith('[') || !t.endsWith(']')) return [];
  const inner = t.slice(1, -1).trim();
  if (!inner) return [];
  return inner.split(',').map((p) => unquote(p.trim())).filter(Boolean);
}

export async function writeCampaignConfig(
  cfg: CampaignConfig,
  path: string,
): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, serializeCampaignToml(cfg), 'utf8');
}

export async function readCampaignConfig(path: string): Promise<CampaignConfig> {
  const text = await readFile(path, 'utf8');
  return parseCampaignToml(text);
}

/**
 * Fill durable ST-machine prefs from env / ~/.kodranni/secrets without
 * writing secret tokens into campaign.toml (token stays in env/file).
 * Used on create and seed-demo --force so destroy/recreate is not a hassle.
 */
export function applyMachineDefaults(
  cfg: CampaignConfig,
  env: NodeJS.ProcessEnv = process.env,
): CampaignConfig {
  const out: CampaignConfig = { ...cfg };
  const tunnelToken = env.KODRANNI_CF_TUNNEL_TOKEN?.trim();
  const tunnelHost =
    env.KODRANNI_TUNNEL_HOSTNAME?.trim() ||
    env.KODRANNI_CF_TUNNEL_HOSTNAME?.trim();
  const stRole = env.DISCORD_STORYTELLER_ROLE_ID?.trim();
  const fluxerStRole = env.FLUXER_STORYTELLER_ROLE_ID?.trim();

  if (tunnelToken || tunnelHost || out.cloudflareTunnelName || out.cloudflareTunnelConfig) {
    out.tunnelMode = 'named';
  } else if (!out.tunnelMode) {
    out.tunnelMode = DEFAULTS.tunnelMode;
  }

  const edgeUrl = env.KODRANNI_EDGE_URL?.trim();
  if (edgeUrl) out.edgeUrl = edgeUrl.replace(/\/$/, '');

  if (tunnelHost) {
    out.tunnelHostname = tunnelHost.replace(/\/$/, '');
    // Named public URL players open mid-session
    const host = out.tunnelHostname.startsWith('http')
      ? out.tunnelHostname
      : `https://${out.tunnelHostname}`;
    out.liveBaseUrl = host;
  }

  // Never persist the Cloudflare run token into campaign.toml — env/secret file only.
  delete out.cloudflareTunnelToken;

  if (stRole) out.discordStorytellerRoleId = stRole;
  if (fluxerStRole) out.fluxerStorytellerRoleId = fluxerStRole;

  const platforms = new Set(out.platforms ?? []);
  if (env.DISCORD_BOT_TOKEN?.trim() && env.DISCORD_GUILD_ID?.trim()) {
    platforms.add('discord');
  }
  if (env.FLUXER_BOT_TOKEN?.trim() && env.FLUXER_GUILD_ID?.trim()) {
    platforms.add('fluxer');
  }
  out.platforms = [...platforms];

  return out;
}

export async function ensureCampaignLayout(slug: string, name: string): Promise<CampaignConfig> {
  const dir = campaignDir(slug);
  const storePath = defaultStorePath(slug);
  let cfg: CampaignConfig = {
    schema: DEFAULTS.schema,
    slug,
    name,
    storePath,
    liveBind: DEFAULTS.liveBind,
    liveBaseUrl: DEFAULTS.liveBaseUrl,
    publishDebounceMs: DEFAULTS.publishDebounceMs,
    platforms: [],
  };
  cfg = applyMachineDefaults(cfg, process.env);
  await mkdir(join(dir, 'data'), { recursive: true });
  await mkdir(join(dir, 'private'), { recursive: true });
  await mkdir(join(dir, 'media', 'avatars'), { recursive: true });
  await mkdir(campaignRuntimeLogsDir(slug), { recursive: true });
  await writeCampaignConfig(cfg, join(dir, 'campaign.toml'));
  return cfg;
}
