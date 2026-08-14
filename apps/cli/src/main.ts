import { spawn } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cryptoRng, mulberry32 } from '@kodranni/domain';
import { executePlayerRoll, executeStorytellerNpcRoll } from '@kodranni/app';
import {
  DEMO_NAME,
  DEMO_SLUG,
  defaultCampaignTomlPath,
  destroyCampaignDir,
  ensureCampaignLayout,
  openSqliteStore,
  readCampaignConfig,
  seedDemoCampaign,
  type CampaignConfig,
} from '@kodranni/store';

function usage(code = 1): never {
  console.log(`kodranni — local automation CLI

Usage:
  kodranni campaign init --slug <slug> --name <name>
  kodranni campaign seed-demo [--slug ${DEMO_SLUG}] [--force]
      Fresh demo (Guidebook: The Vardmark at Kelarn’s Bend). --force destroys first.
  kodranni campaign destroy --slug <slug> [--yes]
      Delete ~/.kodranni/campaigns/<slug> entirely (reconstruct with seed-demo).
  kodranni campaign export-json --slug <slug> [--out path]
  kodranni roll --slug <slug> --character <slug> --foundation <Name> [--skill <Name>]
                [--tier 6|8|12] [--exertion 0|1|2] [--echo] [--debug-seed N]
  kodranni st-roll --slug <slug> --label <name> --foundation <n> --skill <n>
                [--tier 6|8|12] [--exertion 0|1] [--debug-seed N]
  kodranni live --slug <slug>
  kodranni help

RNG: production rolls use crypto. --debug-seed is for verification only.
`);
  process.exit(code);
}

function arg(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  if (i < 0) return undefined;
  return args[i + 1];
}

function has(args: string[], name: string): boolean {
  return args.includes(name);
}

/** Prefer monorepo root so npm workspaces resolve. */
function resolveRepoRoot(): string {
  if (process.env.KODRANNI_REPO && existsSync(join(process.env.KODRANNI_REPO, 'package.json'))) {
    return process.env.KODRANNI_REPO;
  }
  // apps/cli/src → monorepo root
  const fromCli = join(dirname(fileURLToPath(import.meta.url)), '../../..');
  if (existsSync(join(fromCli, 'package.json'))) return fromCli;
  // cwd if it is the repo
  if (existsSync(join(process.cwd(), 'package.json'))) return process.cwd();
  console.error(
    'Could not locate the Kodranni package root (package.json).\n' +
      '  Set KODRANNI_REPO, or run via npm from the repository that contains this project.',
  );
  process.exit(1);
}

async function loadConfig(slug: string): Promise<CampaignConfig> {
  return readCampaignConfig(defaultCampaignTomlPath(slug));
}

function rngFromArgs(args: string[]) {
  const debug = arg(args, '--debug-seed') ?? arg(args, '--seed');
  if (debug != null) {
    console.warn(`(debug RNG seed ${debug} — not for real play)`);
    return mulberry32(Number(debug));
  }
  return cryptoRng();
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const cmd = args[0];
  if (!cmd || cmd === 'help' || cmd === '-h' || cmd === '--help') usage(0);

  if (cmd === 'campaign' && args[1] === 'init') {
    const slug = arg(args, '--slug');
    const name = arg(args, '--name') ?? slug;
    if (!slug) usage();
    const cfg = await ensureCampaignLayout(slug, name!);
    const store = openSqliteStore(cfg.storePath);
    store.putCommunity({
      slug: cfg.slug,
      name: cfg.name,
      fortunes: { vitality: 2, cohesion: 2, surplus: 2, standing: 2, tradition: 2 },
      myths: [],
      hierarchyAxes: ['Arms', 'Faith', 'Coin', 'Blood'],
      ruler: null,
      placements: [],
      outsiders: [],
    });
    store.close();
    console.log(`Campaign initialised: ${cfg.slug}`);
    console.log(`  config: ${defaultCampaignTomlPath(cfg.slug)}`);
    console.log(`  store:  ${cfg.storePath}`);
    return;
  }

  if (cmd === 'campaign' && args[1] === 'destroy') {
    const slug = arg(args, '--slug');
    if (!slug) usage();
    if (!has(args, '--yes')) {
      console.error(`Refusing to destroy without --yes (would remove campaign "${slug}")`);
      process.exit(1);
    }
    destroyCampaignDir(slug);
    console.log(`Destroyed campaign directory for ${slug}`);
    return;
  }

  if (cmd === 'campaign' && args[1] === 'seed-demo') {
    const slug = arg(args, '--slug') ?? DEMO_SLUG;
    const name = arg(args, '--name') ?? DEMO_NAME;
    if (has(args, '--force') || has(args, '--reset')) {
      destroyCampaignDir(slug);
      console.log(`Removed previous data for ${slug}`);
    }
    const cfg = await ensureCampaignLayout(slug, name);
    // Always re-open store and re-seed (idempotent overwrite of demo content)
    const store = openSqliteStore(cfg.storePath);
    seedDemoCampaign(store, cfg.slug, cfg.name);
    store.close();
    console.log(`Seeded demo: ${cfg.name} (${cfg.slug})`);
    console.log(`  store: ${cfg.storePath}`);
    console.log(`  characters: tomas, leif`);
    console.log(`  recreate: npm run kodranni -- campaign seed-demo --slug ${slug} --force`);
    return;
  }

  if (cmd === 'campaign' && args[1] === 'export-json') {
    const slug = arg(args, '--slug');
    if (!slug) usage();
    const cfg = await loadConfig(slug);
    const store = openSqliteStore(cfg.storePath);
    const snap = store.toPublicSnapshot();
    store.close();
    const out = arg(args, '--out') ?? join(process.cwd(), `${slug}-public.json`);
    writeFileSync(out, JSON.stringify(snap, null, 2));
    console.log(`Wrote ${out}`);
    return;
  }

  if (cmd === 'live') {
    const slug = arg(args, '--slug') ?? DEMO_SLUG;
    const cfg = await loadConfig(slug);
    const repoRoot = resolveRepoRoot();
    console.log(`Live campaign-ui for ${cfg.slug}`);
    console.log(`  store: ${cfg.storePath}`);
    console.log(`  url:   ${cfg.liveBaseUrl}`);
    console.log(`  repo:  ${repoRoot}`);
    // shell:false avoids DEP0190 (args not escaped when shell concatenates)
    const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const child = spawn(
      npmBin,
      ['run', 'dev', '-w', '@kodranni/campaign-ui'],
      {
        cwd: repoRoot,
        stdio: 'inherit',
        env: {
          ...process.env,
          KODRANNI_STORE_PATH: cfg.storePath,
          KODRANNI_CAMPAIGN_SLUG: cfg.slug,
          NODE_OPTIONS: [process.env.NODE_OPTIONS, '--experimental-sqlite']
            .filter(Boolean)
            .join(' '),
        },
        shell: false,
      },
    );
    await new Promise<void>((resolve, reject) => {
      child.on('exit', (code) => {
        if (code === 0 || code === null) resolve();
        else reject(new Error(`campaign-ui exited ${code}`));
      });
      child.on('error', reject);
    });
    return;
  }

  if (cmd === 'roll') {
    const slug = arg(args, '--slug');
    const character = arg(args, '--character');
    const foundation = arg(args, '--foundation');
    if (!slug || !character || !foundation) usage();
    const cfg = await loadConfig(slug);
    const store = openSqliteStore(cfg.storePath);
    const tier = Number(arg(args, '--tier') ?? 8) as 6 | 8 | 12;
    const exertion = Number(arg(args, '--exertion') ?? 0);
    const r = executePlayerRoll(store, {
      characterSlug: character,
      foundation,
      skill: arg(args, '--skill'),
      dieTier: tier,
      exertionDice: exertion,
      echoInvoked: has(args, '--echo'),
      primitive: !arg(args, '--skill'),
      rng: rngFromArgs(args),
    });
    store.close();
    console.log(`${r.poolFormula}`);
    console.log(
      `Marks ${r.marks}  faces [${r.faces.join(', ')}]  Omen ${r.omen}${r.omenHit ? ` (${r.omenHit})` : ''}`,
    );
    if (r.practiceGained) console.log(`Practice +${r.practiceGained}`);
    console.log(r.whyPool);
    console.log(`rollId ${r.rollId}`);
    return;
  }

  if (cmd === 'st-roll') {
    const slug = arg(args, '--slug');
    const label = arg(args, '--label') ?? 'NPC';
    const foundation = Number(arg(args, '--foundation'));
    const skill = Number(arg(args, '--skill'));
    if (!slug || Number.isNaN(foundation) || Number.isNaN(skill)) usage();
    const cfg = await loadConfig(slug);
    const store = openSqliteStore(cfg.storePath);
    const r = executeStorytellerNpcRoll(store, {
      label,
      foundation,
      skill,
      dieTier: Number(arg(args, '--tier') ?? 8) as 6 | 8 | 12,
      exertionDice: Number(arg(args, '--exertion') ?? 0),
      rng: rngFromArgs(args),
    });
    store.close();
    console.log(`${label}: ${r.poolSize}d${r.dieTier}`);
    console.log(`Marks ${r.marks}  faces [${r.faces.join(', ')}]  Omen ${r.omen}`);
    console.log(`rollId ${r.rollId}`);
    return;
  }

  usage();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
