#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const main = join(here, '../src/main.ts');
const result = spawnSync(
  process.execPath,
  ['--experimental-sqlite', '--import', 'tsx', main, ...process.argv.slice(2)],
  { stdio: 'inherit', env: process.env },
);
process.exit(result.status ?? 1);
