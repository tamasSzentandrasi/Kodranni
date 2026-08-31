#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const dest = join(root, 'apps/edge/public');
rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
const pub = join(root, 'apps/campaign-ui/public');
if (existsSync(pub)) cpSync(pub, dest, { recursive: true });
const client = join(root, 'apps/campaign-ui/dist/client');
if (existsSync(client)) cpSync(client, dest, { recursive: true });
mkdirSync(join(dest, 'design'), { recursive: true });
cpSync(join(root, 'packages/design'), join(dest, 'design'), { recursive: true });
console.log('edge public synced');
