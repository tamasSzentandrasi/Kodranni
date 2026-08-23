/**
 * Detached entry: node --import tsx archive-serve-main.ts --dir … --bind …
 */
import { serveArchiveDir } from './archive-server.js';

function arg(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  if (i < 0) return undefined;
  return args[i + 1];
}

const args = process.argv.slice(2);
const dir = arg(args, '--dir');
const bind = arg(args, '--bind') ?? '127.0.0.1:8742';
if (!dir) {
  console.error('Usage: archive-serve-main --dir <archiveDir> [--bind host:port]');
  process.exit(1);
}
const { url } = serveArchiveDir({ archiveDir: dir, bind });
console.log(`Archive serving ${url} from ${dir}`);
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
// keep alive
await new Promise(() => {});
