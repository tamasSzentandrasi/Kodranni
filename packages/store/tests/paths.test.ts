import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  campaignDir,
  campaignRuntimeDir,
  kodranniConfigHome,
  kodranniDataHome,
  kodranniHome,
  kodranniStateHome,
  secretsDir,
} from '../src/paths.js';

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe('XDG paths', () => {
  it('uses KODRANNI_HOME as a single root when set', () => {
    const home = mkdtempSync(join(tmpdir(), 'kod-home-'));
    dirs.push(home);
    const env = { KODRANNI_HOME: home };
    expect(kodranniHome(env)).toBe(home);
    expect(kodranniConfigHome(env)).toBe(home);
    expect(kodranniStateHome(env)).toBe(home);
    expect(secretsDir(env)).toBe(join(home, 'secrets'));
    expect(campaignDir('vardmark', env)).toBe(join(home, 'campaigns', 'vardmark'));
    expect(campaignRuntimeDir('vardmark', env)).toBe(
      join(home, 'campaigns', 'vardmark', 'runtime'),
    );
  });

  it('keeps existing ~/.kodranni as the root', () => {
    const home = mkdtempSync(join(tmpdir(), 'kod-user-'));
    dirs.push(home);
    mkdirSync(join(home, '.kodranni'));
    const env = { HOME: home };
    expect(kodranniDataHome(env)).toBe(join(home, '.kodranni'));
    expect(secretsDir(env)).toBe(join(home, '.kodranni', 'secrets'));
  });

  it('splits data/config/state under XDG when there is no legacy root', () => {
    const home = mkdtempSync(join(tmpdir(), 'kod-xdg-'));
    dirs.push(home);
    const env = {
      HOME: home,
      XDG_DATA_HOME: join(home, 'data'),
      XDG_CONFIG_HOME: join(home, 'cfg'),
      XDG_STATE_HOME: join(home, 'st'),
    };
    expect(kodranniDataHome(env)).toBe(join(home, 'data', 'kodranni'));
    expect(kodranniConfigHome(env)).toBe(join(home, 'cfg', 'kodranni'));
    expect(kodranniStateHome(env)).toBe(join(home, 'st', 'kodranni'));
    expect(secretsDir(env)).toBe(join(home, 'cfg', 'kodranni', 'secrets'));
    expect(campaignRuntimeDir('vardmark', env)).toBe(
      join(home, 'st', 'kodranni', 'campaigns', 'vardmark', 'runtime'),
    );
  });
});
