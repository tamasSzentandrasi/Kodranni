import { spawn } from 'node:child_process';
import dgram from 'node:dgram';

/** systemd Type=notify — no-op unless NOTIFY_SOCKET is set. */
export function notifySystemd(state: string): void {
  const path = process.env.NOTIFY_SOCKET;
  if (!path) return;
  try {
    const sock = dgram.createSocket('unix_dgram');
    const dest = path.startsWith('@') ? `\0${path.slice(1)}` : path;
    sock.send(Buffer.from(state), dest, () => {
      try {
        sock.close();
      } catch {
        /* ignore */
      }
    });
    return;
  } catch {
    /* fall through */
  }
  try {
    const args: string[] = [];
    if (/\bREADY=1\b/.test(state)) args.push('--ready');
    args.push(`--pid=${process.pid}`);
    spawn('systemd-notify', args, { stdio: 'ignore' }).unref();
  } catch {
    /* no systemd */
  }
}
