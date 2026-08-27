#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const dest = join(root, 'apps/edge/public');
rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
const client = join(root, 'apps/campaign-ui/dist/client');
if (existsSync(client)) cpSync(client, dest, { recursive: true });
mkdirSync(join(dest, 'design'), { recursive: true });
cpSync(join(root, 'packages/design'), join(dest, 'design'), { recursive: true });
cpSync(join(root, 'apps/campaign-ui/public/brand'), join(dest, 'brand'), { recursive: true });
for (const f of ['hall-client.js', 'favicon.ico', 'favicon-32x32.png']) {
  cpSync(join(root, 'apps/campaign-ui/public', f), join(dest, f));
}
console.log('edge public synced');
