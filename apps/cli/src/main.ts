import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mulberry32 } from '@kodranni/domain';
import { executePlayerRoll, executeStorytellerNpcRoll } from '@kodranni/app';
import {
  defaultCampaignTomlPath,
  ensureCampaignLayout,
  openSqliteStore,
  readCampaignConfig,
  seedDemoCampaign,
  type CampaignConfig,
} from '@kodranni/store';

function usage(): never {
  console.log(`kodranni — local automation CLI

Usage:
  kodranni campaign init --slug <slug> --name <name>
  kodranni campaign seed-demo --slug <slug>
  kodranni campaign export-json --slug <slug> [--out path]
  kodranni roll --slug <slug> --character <slug> --foundation <Name> [--skill <Name>]
                [--tier 6|8|12] [--exertion 0|1|2] [--echo] [--seed N]
  kodranni st-roll --slug <slug> --label <name> --foundation <n> --skill <n>
                [--tier 6|8|12] [--exertion 0|1] [--seed N]
  kodranni live --slug <slug>   # SSR campaign-ui from local store (port 8742)
  kodranni help
`);
  process.exit(1);
}

function arg(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  if (i < 0) return undefined;
  return args[i + 1];
}

function has(args: string[], name: string): boolean {
  return args.includes(name);
}

async function loadConfig(slug: string): Promise<CampaignConfig> {
  return readCampaignConfig(defaultCampaignTomlPath(slug));
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const cmd = args[0];
  if (!cmd || cmd === 'help' || cmd === '-h' || cmd === '--help') usage();

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
    });
    store.close();
    console.log(`Campaign initialised: ${cfg.slug}`);
    console.log(`  config: ${defaultCampaignTomlPath(cfg.slug)}`);
    console.log(`  store:  ${cfg.storePath}`);
    return;
  }

  if (cmd === 'campaign' && args[1] === 'seed-demo') {
    const slug = arg(args, '--slug');
    if (!slug) usage();
    let cfg: CampaignConfig;
    try {
      cfg = await loadConfig(slug);
    } catch {
      cfg = await ensureCampaignLayout(slug, arg(args, '--name') ?? 'Demo community');
    }
    const store = openSqliteStore(cfg.storePath);
    seedDemoCampaign(store, cfg.slug, cfg.name);
    store.close();
    console.log(`Seeded demo community + Eira for ${cfg.slug}`);
    console.log(`  store: ${cfg.storePath}`);
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

  if (cmd === 'roll') {
    const slug = arg(args, '--slug');
    const character = arg(args, '--character');
    const foundation = arg(args, '--foundation');
    if (!slug || !character || !foundation) usage();
    const cfg = await loadConfig(slug);
    const store = openSqliteStore(cfg.storePath);
    const seed = arg(args, '--seed');
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
      rng: seed != null ? mulberry32(Number(seed)) : undefined,
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

  if (cmd === 'live') {
    const slug = arg(args, '--slug');
    if (!slug) usage();
    const cfg = await loadConfig(slug);
    const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
    console.log(`Live campaign-ui for ${cfg.slug}`);
    console.log(`  store: ${cfg.storePath}`);
    console.log(`  url:   ${cfg.liveBaseUrl}`);
    console.log('  (read-only SSR; re-reads SQLite each request)');
    const child = spawn(
      'npm',
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
        shell: true,
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

  if (cmd === 'st-roll') {
    const slug = arg(args, '--slug');
    const label = arg(args, '--label') ?? 'NPC';
    const foundation = Number(arg(args, '--foundation'));
    const skill = Number(arg(args, '--skill'));
    if (!slug || Number.isNaN(foundation) || Number.isNaN(skill)) usage();
    const cfg = await loadConfig(slug);
    const store = openSqliteStore(cfg.storePath);
    const seed = arg(args, '--seed');
    const r = executeStorytellerNpcRoll(store, {
      label,
      foundation,
      skill,
      dieTier: Number(arg(args, '--tier') ?? 8) as 6 | 8 | 12,
      exertionDice: Number(arg(args, '--exertion') ?? 0),
      rng: seed != null ? mulberry32(Number(seed)) : undefined,
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
