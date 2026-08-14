import { type ChildProcess, spawn } from 'node:child_process';
import { createWriteStream, existsSync } from 'node:fs';
import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { delimiter, join } from 'node:path';

/** Extract Cloudflare quick-tunnel HTTPS URL from cloudflared log lines. */
export function parseCloudflaredUrl(chunk: string): string | undefined {
  // https://<hash>.trycloudflare.com (optional trailing slash/path)
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
  /** Resolves when first public URL is seen (or rejects on early exit). */
  url: Promise<string>;
}

/**
 * Start Cloudflare quick tunnel to localUrl.
 * Free quick tunnels get a random *.trycloudflare.com name (Cloudflare-chosen words,
 * not a hex hash — that is their free product; custom hostnames need a named tunnel + domain).
 * --http-host-header keeps the origin Host as localhost for Vite/Astro.
 */
export function startCloudflaredTunnel(opts: {
  cloudflaredBin: string;
  localUrl: string;
  logPath: string;
  /** Host header sent to origin (default localhost) */
  httpHostHeader?: string;
}): TunnelHandle {
  const log = createWriteStream(opts.logPath, { flags: 'a' });
  const hostHeader = opts.httpHostHeader ?? 'localhost';
  const child = spawn(
    opts.cloudflaredBin,
    ['tunnel', '--url', opts.localUrl, '--http-host-header', hostHeader],
    {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    },
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

  return { child, url };
}

export function localHttpUrlFromBind(liveBind: string): string {
  // live_bind is host:port
  const host = liveBind.startsWith('127.0.0.1') || liveBind.startsWith('localhost')
    ? liveBind
    : liveBind.includes(':')
      ? liveBind
      : `127.0.0.1:${liveBind}`;
  return `http://${host}`;
}
