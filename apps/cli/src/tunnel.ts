import { type ChildProcess, spawn } from 'node:child_process';
import { createWriteStream, existsSync } from 'node:fs';
import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { delimiter, join } from 'node:path';
import type { CampaignConfig, TunnelMode } from '@kodranni/store';
import {
  resolveNamedTunnelPublicUrl,
  resolveTunnelMode,
} from '@kodranni/store';

/** Extract Cloudflare quick-tunnel HTTPS URL from cloudflared log lines. */
export function parseCloudflaredUrl(chunk: string): string | undefined {
  const m = chunk.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com\/?/i);
  if (!m?.[0]) return undefined;
  return m[0].replace(/\/$/, '');
}

export async function findCloudflared(): Promise<string | undefined> {
  const names =
    process.platform === 'win32' ? ['cloudflared.exe', 'cloudflared'] : ['cloudflared'];
  const pathEnv = process.env.PATH ?? '';
  for (const dir of pathEnv.split(delimiter)) {
    for (const name of names) {
      const full = join(dir, name);
      try {
        await access(full, constants.X_OK);
        return full;
      } catch {
        /* try next */
      }
      if (existsSync(full)) return full;
    }
  }
  return undefined;
}

export interface TunnelHandle {
  child: ChildProcess;
  mode: TunnelMode;
  /** Resolves when the public URL is known (quick: parsed from logs; named: config). */
  url: Promise<string>;
}

function spawnCloudflared(
  bin: string,
  args: string[],
  logPath: string,
): { child: ChildProcess; log: ReturnType<typeof createWriteStream> } {
  const log = createWriteStream(logPath, { flags: 'a' });
  log.write(`\n--- ${new Date().toISOString()} cloudflared ${args.join(' ')} ---\n`);
  const child = spawn(bin, args, {
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
  });
  return { child, log };
}

/**
 * Free quick tunnel → random *.trycloudflare.com (Cloudflare word names).
 * --http-host-header keeps origin Host as localhost for Vite/Astro.
 */
export function startCloudflaredQuickTunnel(opts: {
  cloudflaredBin: string;
  localUrl: string;
  logPath: string;
  httpHostHeader?: string;
}): TunnelHandle {
  const hostHeader = opts.httpHostHeader ?? 'localhost';
  const { child, log } = spawnCloudflared(
    opts.cloudflaredBin,
    ['tunnel', '--url', opts.localUrl, '--http-host-header', hostHeader],
    opts.logPath,
  );

  let settled = false;
  let resolveUrl!: (u: string) => void;
  let rejectUrl!: (e: Error) => void;
  const url = new Promise<string>((resolve, reject) => {
    resolveUrl = resolve;
    rejectUrl = reject;
  });

  const onData = (buf: Buffer) => {
    const text = buf.toString('utf8');
    log.write(text);
    if (settled) return;
    const found = parseCloudflaredUrl(text);
    if (found) {
      settled = true;
      resolveUrl(found);
    }
  };

  child.stdout?.on('data', onData);
  child.stderr?.on('data', onData);
  child.on('error', (err) => {
    log.write(`\n[error] ${err.message}\n`);
    if (!settled) {
      settled = true;
      rejectUrl(err);
    }
  });
  child.on('exit', (code) => {
    log.write(`\n[exit] code=${code}\n`);
    log.end();
    if (!settled) {
      settled = true;
      rejectUrl(new Error(`cloudflared exited before publishing a URL (code ${code})`));
    }
  });

  return { child, mode: 'quick', url };
}

/**
 * Named tunnel bound to the Storyteller’s domain/subdomain (Cloudflare DNS).
 * Public URL comes from campaign config, not from trycloudflare.com.
 *
 * Prefer token (dashboard install command): cloudflared tunnel run --token …
 * Or: cloudflared tunnel run <name>  /  --config path run
 */
export function startCloudflaredNamedTunnel(opts: {
  cloudflaredBin: string;
  logPath: string;
  publicUrl: string;
  token?: string;
  tunnelName?: string;
  configPath?: string;
}): TunnelHandle {
  const args: string[] = ['tunnel'];
  if (opts.configPath) {
    args.push('--config', opts.configPath, 'run');
  } else if (opts.token) {
    args.push('run', '--token', opts.token);
  } else if (opts.tunnelName) {
    args.push('run', opts.tunnelName);
  } else {
    throw new Error(
      'named tunnel needs cloudflare_tunnel_token, cloudflare_tunnel_name, or cloudflare_tunnel_config',
    );
  }

  const { child, log } = spawnCloudflared(opts.cloudflaredBin, args, opts.logPath);

  let settled = false;
  let resolveUrl!: (u: string) => void;
  let rejectUrl!: (e: Error) => void;
  const url = new Promise<string>((resolve, reject) => {
    resolveUrl = resolve;
    rejectUrl = reject;
  });

  // Named tunnel URL is known a priori; resolve after process stays up briefly.
  // Also stream logs; fail if process exits immediately.
  const settleOk = () => {
    if (settled) return;
    settled = true;
    resolveUrl(opts.publicUrl.replace(/\/$/, ''));
  };
  const timer = setTimeout(settleOk, 1500);

  const onData = (buf: Buffer) => {
    log.write(buf.toString('utf8'));
  };
  child.stdout?.on('data', onData);
  child.stderr?.on('data', onData);
  child.on('error', (err) => {
    clearTimeout(timer);
    log.write(`\n[error] ${err.message}\n`);
    if (!settled) {
      settled = true;
      rejectUrl(err);
    }
  });
  child.on('exit', (code) => {
    clearTimeout(timer);
    log.write(`\n[exit] code=${code}\n`);
    log.end();
    if (!settled) {
      settled = true;
      rejectUrl(
        new Error(
          `named cloudflared exited early (code ${code}). Check DNS route, tunnel credentials, and ingress → ${opts.publicUrl}`,
        ),
      );
    }
  });

  return { child, mode: 'named', url };
}

/** @deprecated use startCloudflaredQuickTunnel */
export function startCloudflaredTunnel(opts: {
  cloudflaredBin: string;
  localUrl: string;
  logPath: string;
  httpHostHeader?: string;
}): TunnelHandle {
  return startCloudflaredQuickTunnel(opts);
}

export function localHttpUrlFromBind(liveBind: string): string {
  const host =
    liveBind.startsWith('127.0.0.1') || liveBind.startsWith('localhost')
      ? liveBind
      : liveBind.includes(':')
        ? liveBind
        : `127.0.0.1:${liveBind}`;
  return `http://${host}`;
}

export function tunnelCredentialsFromConfig(
  cfg: CampaignConfig,
  env: NodeJS.ProcessEnv = process.env,
): {
  mode: TunnelMode;
  token?: string;
  tunnelName?: string;
  configPath?: string;
  publicUrl?: string;
} {
  const mode = resolveTunnelMode(cfg, env);
  const token = env.KODRANNI_CF_TUNNEL_TOKEN ?? cfg.cloudflareTunnelToken;
  const tunnelName = cfg.cloudflareTunnelName;
  const configPath = cfg.cloudflareTunnelConfig;
  let publicUrl: string | undefined;
  if (mode === 'named') {
    publicUrl = resolveNamedTunnelPublicUrl(cfg);
  }
  return { mode, token, tunnelName, configPath, publicUrl };
}
