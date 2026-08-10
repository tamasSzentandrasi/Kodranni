import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { campaignDir, defaultStorePath } from './paths.js';

export interface CampaignConfig {
  schema: number;
  slug: string;
  name: string;
  storePath: string;
  liveBind: string;
  liveBaseUrl: string;
  publicRepo?: string;
  publicBaseUrl?: string;
  publishDebounceMs: number;
  platforms: string[];
}

const DEFAULTS = {
  schema: 1,
  liveBind: '127.0.0.1:8742',
  liveBaseUrl: 'http://127.0.0.1:8742',
  publishDebounceMs: 45000,
  platforms: [] as string[],
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
  lines.push('', `publish_debounce_ms = ${cfg.publishDebounceMs}`);
  if (cfg.platforms.length) {
    lines.push(`platforms = [${cfg.platforms.map(tomlString).join(', ')}]`);
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

  return {
    schema: Number(map.get('schema') ?? DEFAULTS.schema),
    slug,
    name,
    storePath,
    liveBind: unquote(map.get('live_bind') ?? DEFAULTS.liveBind),
    liveBaseUrl: unquote(map.get('live_base_url') ?? DEFAULTS.liveBaseUrl),
    publicRepo: map.has('public_repo') ? unquote(map.get('public_repo')!) : undefined,
    publicBaseUrl: map.has('public_base_url') ? unquote(map.get('public_base_url')!) : undefined,
    publishDebounceMs: Number(map.get('publish_debounce_ms') ?? DEFAULTS.publishDebounceMs),
    platforms: parseArray(map.get('platforms') ?? '[]'),
  };
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

export async function ensureCampaignLayout(slug: string, name: string): Promise<CampaignConfig> {
  const dir = campaignDir(slug);
  const storePath = defaultStorePath(slug);
  const cfg: CampaignConfig = {
    schema: DEFAULTS.schema,
    slug,
    name,
    storePath,
    liveBind: DEFAULTS.liveBind,
    liveBaseUrl: DEFAULTS.liveBaseUrl,
    publishDebounceMs: DEFAULTS.publishDebounceMs,
    platforms: [],
  };
  await mkdir(join(dir, 'data'), { recursive: true });
  await mkdir(join(dir, 'private'), { recursive: true });
  await writeCampaignConfig(cfg, join(dir, 'campaign.toml'));
  return cfg;
}
