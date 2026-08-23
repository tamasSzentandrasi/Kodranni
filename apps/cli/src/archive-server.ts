/**
 * Tiny static server for parked archive on the live bind port
 * so the same public hostname can keep serving between sessions.
 */
import { type ChildProcess, spawn } from 'node:child_process';
import { createWriteStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

export function parseBind(bind: string): { host: string; port: number } {
  const [host, portStr] = bind.split(':');
  return { host: host || '127.0.0.1', port: Number(portStr || 8742) };
}

/** Foreground static serve of archiveDir on bind. Resolves never until close. */
export function serveArchiveDir(opts: {
  archiveDir: string;
  bind: string;
}): { close: () => void; url: string } {
  const { host, port } = parseBind(opts.bind);
  const root = opts.archiveDir;
  const server = createServer((req, res) => {
    try {
      let path = decodeURIComponent((req.url ?? '/').split('?')[0] || '/');
      if (path.endsWith('/')) path += 'index.html';
      else if (!extname(path)) path += '/index.html';
      if (path === '/index.html' || path === '/') path = '/index.html';
      const file = normalize(join(root, path.replace(/^\//, '')));
      if (!file.startsWith(normalize(root))) {
        res.writeHead(403).end('Forbidden');
        return;
      }
      if (!existsSync(file) || !statSync(file).isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found in archive. Try /community/ or /characters/.');
        return;
      }
      const body = readFileSync(file);
      res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
      res.end(body);
    } catch (e) {
      res.writeHead(500).end(e instanceof Error ? e.message : 'error');
    }
  });
  server.listen(port, host);
  return {
    url: `http://${host}:${port}/`,
    close: () => server.close(),
  };
}

/** Background archive server via detached node child (for session end --park-hostname). */
export function spawnArchiveServer(opts: {
  archiveDir: string;
  bind: string;
  logPath: string;
  nodeScriptPath: string;
}): ChildProcess {
  const log = createWriteStream(opts.logPath, { flags: 'a' });
  log.write(`\n--- archive server ${new Date().toISOString()} ---\n`);
  const child = spawn(
    process.execPath,
    [
      '--import',
      'tsx',
      opts.nodeScriptPath,
      '--dir',
      opts.archiveDir,
      '--bind',
      opts.bind,
    ],
    {
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    },
  );
  child.stdout?.on('data', (b) => log.write(b));
  child.stderr?.on('data', (b) => log.write(b));
  child.unref();
  return child;
}
