import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(import.meta.dirname, '../../..');

function typescriptFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...typescriptFiles(full));
    else if (name.endsWith('.ts')) out.push(full);
  }
  return out;
}

describe('worker stays off Node', () => {
  it('does not import node or the store barrel from the sources it bundles', () => {
    const files = [
      ...typescriptFiles(join(root, 'apps/edge/src')),
      join(root, 'packages/store/src/demo-icons.ts'),
      join(root, 'packages/store/src/relation-map.ts'),
      join(root, 'packages/store/src/labels.ts'),
      join(root, 'packages/store/src/table.ts'),
    ];
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      expect(text.includes('node:fs'), file).toBe(false);
      expect(text.includes('node:sqlite'), file).toBe(false);
      expect(text.includes("from '@kodranni/store'"), file).toBe(false);
      expect(text.includes('from "@kodranni/store"'), file).toBe(false);
    }
  });

  it('keeps the free worker shape', () => {
    const toml = readFileSync(join(root, 'apps/edge/wrangler.toml'), 'utf8');
    expect(toml.includes('workers_dev = true')).toBe(true);
    expect(/^\s*custom_domain\s*=/m.test(toml)).toBe(false);
    expect(toml.includes('nodejs_compat')).toBe(false);
  });
});
