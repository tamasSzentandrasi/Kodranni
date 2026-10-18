import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import {
  campaignRuntimeDir,
  campaignRuntimeLogsDir,
  liveUrlPath,
  sessionStatePath,
} from './paths.js';

export interface SessionState {
  slug: string;
  startedAt?: string;
  liveUrl?: string;
  localUrl?: string;
  tunnel?: boolean;
  pids?: {
    live?: number;
    tunnel?: number;
    bot?: number;
    /** Static archive server parking the public hostname between sessions. */
    archive?: number;
  };
  /** True when public hostname is serving archive instead of live UI. */
  parked?: boolean;
  lastError?: string;
}

export function ensureCampaignRuntime(slug: string, env?: NodeJS.ProcessEnv): void {
  mkdirSync(campaignRuntimeLogsDir(slug, env), { recursive: true });
}

export function writeLiveUrl(slug: string, url: string, env?: NodeJS.ProcessEnv): void {
  ensureCampaignRuntime(slug, env);
  writeFileSync(liveUrlPath(slug, env), `${url.trim()}\n`, 'utf8');
}

export function readLiveUrl(slug: string, env?: NodeJS.ProcessEnv): string | undefined {
  const p = liveUrlPath(slug, env);
  if (!existsSync(p)) return undefined;
  const t = readFileSync(p, 'utf8').trim();
  return t || undefined;
}

export function writeSessionState(
  slug: string,
  state: SessionState,
  env?: NodeJS.ProcessEnv,
): void {
  ensureCampaignRuntime(slug, env);
  writeFileSync(sessionStatePath(slug, env), JSON.stringify(state, null, 2) + '\n', 'utf8');
}

export function readSessionState(
  slug: string,
  env?: NodeJS.ProcessEnv,
): SessionState | undefined {
  const p = sessionStatePath(slug, env);
  if (!existsSync(p)) return undefined;
  try {
    return JSON.parse(readFileSync(p, 'utf8')) as SessionState;
  } catch {
    return undefined;
  }
}

export function runtimeDirExists(slug: string, env?: NodeJS.ProcessEnv): boolean {
  return existsSync(campaignRuntimeDir(slug, env));
}

export type NightOp = 'live' | 'end';

export interface NightResult {
  ok: true;
  already?: boolean;
}

/** Runs in the hall process. The desk route calls it; it does not live in the bundle. */
export type NightHandler = (op: NightOp) => Promise<NightResult>;

const NIGHT = Symbol.for('kodranni.night');

export function installNightHandler(handler: NightHandler | undefined): void {
  const bag = globalThis as Record<symbol, unknown>;
  if (handler) bag[NIGHT] = handler;
  else delete bag[NIGHT];
}

export function currentNightHandler(): NightHandler | undefined {
  const handler = (globalThis as Record<symbol, unknown>)[NIGHT];
  return typeof handler === 'function' ? (handler as NightHandler) : undefined;
}
