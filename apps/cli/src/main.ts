import { spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cryptoRng, mulberry32 } from '@kodranni/domain';
import { executePlayerRoll, executeStorytellerNpcRoll } from '@kodranni/app';
import {
  DEMO_NAME,
  DEMO_SLUG,
  defaultCampaignTomlPath,
  destroyCampaignDir,
  applyCampaignDiscordEnv,
  applyMachineDefaults,
  applyPublicSnapshot,
  emptyCommunity,
  ensureCampaignLayout,
  ensureCampaignRuntime,
  formatCredentialStatus,
  listCampaignSlugs,
  loadSecretsIntoEnv,
  openSqliteStore,
  parsePublicSnapshot,
  platformCredentialStatus,
  productPublicEdgeUrl,
  readCampaignConfig,
  readLiveUrl,
  seedDemoCampaign,
  demoCharactersPresent,
  slugFromCampaignName,
  writeCampaignConfig,
  type CampaignConfig,
} from '@kodranni/store';
import { printEmissaryReport, runEmissary } from './emissary.js';
import { runLiveKernel } from './kernel.js';
import { printSessionStatus, sessionEnd, sessionStart } from './session.js';

function usage(code = 1): never {
  console.log(`kodranni — Storyteller host

  kodranni [--name <campaign name>] [--from snapshot.json]
      Desk (Found if needed). No public tunnel.
  kodranni start [--slug <id>]
      Open the table. Players use kodranni.com/?campaign=<id>
  kodranni stop [--slug <id>]
      Publish archive and stop.
  kodranni status [--slug <id>]
  kodranni emissary [--slug <id>]

Found:
  kodranni --name "The Ash Hill"
  kodranni --name "The Ash Hill" --from ./snapshot.json

Dev (same binary): campaign init|destroy|export-json|publish|seed-demo, session *, live, roll.

No npm at the table. Bot token stays on the Worker.
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
  const fromCli = join(dirname(fileURLToPath(import.meta.url)), '../../..');
  if (existsSync(join(fromCli, 'package.json'))) return fromCli;
  if (existsSync(join(process.cwd(), 'package.json'))) return process.cwd();
  console.error(
    'Could not locate the Kodranni package root (package.json).\n' +
      '  Set KODRANNI_REPO, or run via npm from the repository that contains this project.',
  );
  process.exit(1);
}

async function loadConfig(slug: string): Promise<CampaignConfig> {
  loadSecretsIntoEnv();
  const cfg = applyMachineDefaults(await readCampaignConfig(defaultCampaignTomlPath(slug)));
  applyCampaignDiscordEnv(cfg);
  return cfg;
}

function publicTableUrl(slug: string): string {
  const host = productPublicEdgeUrl(slug).replace(/\/$/, '');
  if (slug === 'vardmark' || slug === 'demo' || slug === 'play') return `${host}/community/`;
  return `${host}/community/?campaign=${encodeURIComponent(slug)}`;
}

function resolveSlug(args: string[]): string {
  const s = arg(args, '--slug');
  if (s) return s;
  const all = listCampaignSlugs();
  if (all.length === 1) return all[0]!;
  if (all.includes(DEMO_SLUG)) return DEMO_SLUG;
  if (all.length === 0) {
    console.error('No campaign yet. Found one: kodranni --name "Your campaign"');
    process.exit(1);
  }
  console.error(`Several campaigns (${all.join(', ')}). Pass --slug.`);
  process.exit(1);
}

async function foundCampaign(name: string, snapshotPath?: string): Promise<string> {
  const slug = slugFromCampaignName(name);
  const cfg = await ensureCampaignLayout(slug, name);
  const store = openSqliteStore(cfg.storePath);
  if (snapshotPath) {
    const raw = readFileSync(snapshotPath, 'utf8');
    applyPublicSnapshot(store, parsePublicSnapshot(raw), slug);
    console.log(`Restored campaign “${name}” (${slug}) from snapshot`);
  } else {
    store.putCommunity(emptyCommunity(slug, name));
    console.log(`Found campaign “${name}” (${slug})`);
  }
  store.close();
  console.log(`  public: ${publicTableUrl(slug)}`);
  console.log(`  store:  ${cfg.storePath}`);
  return slug;
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
  loadSecretsIntoEnv();
  const args = process.argv.slice(2);
  const cmd = args[0];
  if (cmd === 'help' || cmd === '-h' || cmd === '--help') usage(0);

  if (!cmd || cmd === 'desk' || cmd.startsWith('-')) {
    const name = arg(args, '--name');
    const from = arg(args, '--from');
    let slug = arg(args, '--slug');
    if (!slug && name) slug = await foundCampaign(name, from);
    else if (!slug) slug = resolveSlug(args);
    else if (from) {
      const cfg = await loadConfig(slug);
      const store = openSqliteStore(cfg.storePath);
      applyPublicSnapshot(store, parsePublicSnapshot(readFileSync(from, 'utf8')), slug);
      store.close();
      console.log(`Restored ${slug} from snapshot`);
    }
    const cfg = await loadConfig(slug);
    await runLiveKernel({
      slug,
      cfg,
      repoRoot: resolveRepoRoot(),
      tunnel: false,
      bot: false,
      desk: true,
    });
    return;
  }

  if (cmd === 'start') {
    const slug = resolveSlug(args);
    const cfg = await loadConfig(slug);
    await runLiveKernel({
      slug,
      cfg,
      repoRoot: resolveRepoRoot(),
      tunnel: !has(args, '--no-tunnel'),
      bot: !has(args, '--no-bot'),
      desk: false,
    });
    return;
  }

  if (cmd === 'stop') {
    const slug = resolveSlug(args);
    const cfg = await loadConfig(slug);
    await sessionEnd(slug, cfg, { parkHostname: false });
    return;
  }

  if (cmd === 'status') {
    const slug = resolveSlug(args);
    const cfg = await loadConfig(slug);
    await printSessionStatus(slug, cfg);
    return;
  }

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
    const store = openSqliteStore(cfg.storePath);
    if (demoCharactersPresent(store)) {
      store.close();
      console.log(`Demo already present for ${slug} (torvald, leifr).`);
      console.log(`  store: ${cfg.storePath}`);
      console.log(
        `  Recreate (destroys the campaign directory): kodranni campaign seed-demo --slug ${slug} --force`,
      );
      return;
    }
    seedDemoCampaign(store, cfg.slug, cfg.name);
    store.close();
    console.log(`Seeded demo: ${cfg.name} (${cfg.slug})`);
    console.log(`  store: ${cfg.storePath}`);
    console.log(`  characters: torvald, leifr`);
    console.log(
      `  tunnel: ${cfg.tunnelMode ?? 'quick'}` +
        (cfg.tunnelHostname ? ` · ${cfg.tunnelHostname}` : '') +
        (process.env.KODRANNI_CF_TUNNEL_TOKEN ? ' · token from secrets/env' : ''),
    );
    console.log(
      `  ST role: ${cfg.discordStorytellerRoleId ? 'set' : 'unset — pick on the operator desk'}`,
    );
    console.log(`  recreate: kodranni campaign seed-demo --slug ${slug} --force`);
    return;
  }

  if (cmd === 'campaign' && args[1] === 'sync-defaults') {
    const slug = arg(args, '--slug') ?? DEMO_SLUG;
    const path = defaultCampaignTomlPath(slug);
    const cfg = applyMachineDefaults(await readCampaignConfig(path));
    await writeCampaignConfig(cfg, path);
    console.log(`Synced machine defaults into ${path}`);
    console.log(
      `  tunnel_mode=${cfg.tunnelMode ?? 'quick'}` +
        (cfg.tunnelHostname ? ` tunnel_hostname=${cfg.tunnelHostname}` : ''),
    );
    console.log(
      `  discord_storyteller_role_id=${cfg.discordStorytellerRoleId ? '(set)' : '(still unset)'}`,
    );
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

  if (cmd === 'campaign' && args[1] === 'restore') {
    const from = arg(args, '--from');
    if (!from) {
      console.error('Need --from snapshot.json');
      process.exit(1);
    }
    const name = arg(args, '--name');
    let slug = arg(args, '--slug');
    const raw = readFileSync(from, 'utf8');
    const snap = parsePublicSnapshot(raw);
    if (!slug) {
      if (name) slug = slugFromCampaignName(name);
      else slug = slugFromCampaignName(String(snap.community.name ?? snap.community.slug ?? ''));
    }
    const campaignName = name ?? String(snap.community.name ?? slug);
    const cfg = await ensureCampaignLayout(slug, campaignName);
    const store = openSqliteStore(cfg.storePath);
    applyPublicSnapshot(store, snap, slug);
    store.close();
    console.log(`Restored campaign “${campaignName}” (${slug})`);
    console.log(`  public: ${publicTableUrl(slug)}`);
    return;
  }

  if (cmd === 'emissary') {
    const slug = arg(args, '--slug') ?? DEMO_SLUG;
    const report = await runEmissary({ slug });
    printEmissaryReport(report, slug);
    process.exit(report.ok ? 0 : 1);
  }

  if (cmd === 'bot') {
    const slug = arg(args, '--slug') ?? DEMO_SLUG;
    const cfg = await loadConfig(slug);
    const repoRoot = resolveRepoRoot();
    ensureCampaignRuntime(slug);
    const liveUrl = readLiveUrl(slug) ?? cfg.liveBaseUrl;
    const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    if (process.env.KODRANNI_DISCORD_GATEWAY !== '1') {
      console.log(`Discord HTTP is served by campaign-ui (kodranni live --slug ${slug} --bot).`);
      console.log('  The official bot token stays on the Worker.');
      console.log('  Gateway hatch: KODRANNI_DISCORD_GATEWAY=1 kodranni bot --slug ' + slug);
      return;
    }
    console.log(`Bot-runtime gateway hatch for ${slug}`);
    console.log(`  store: ${cfg.storePath}`);
    console.log(`  live:  ${liveUrl}`);
    console.log(`  creds: ${formatCredentialStatus(platformCredentialStatus())}`);
    if (!process.env.DISCORD_BOT_TOKEN || !process.env.DISCORD_GUILD_ID) {
      console.error(
        'Gateway hatch needs discord-botToken + discord-serverID under the secrets dir\n' +
          '  (or DISCORD_BOT_TOKEN and DISCORD_GUILD_ID). Default play uses live --bot instead.',
      );
      process.exit(1);
    }
    const child = spawn(
      npmBin,
      ['run', 'start', '-w', '@kodranni/bot-runtime'],
      {
        cwd: repoRoot,
        stdio: 'inherit',
        env: {
          ...process.env,
          KODRANNI_STORE_PATH: cfg.storePath,
          KODRANNI_CAMPAIGN_SLUG: cfg.slug,
          KODRANNI_LIVE_BASE_URL: liveUrl,
          KODRANNI_PUBLIC_BASE_URL: cfg.publicBaseUrl ?? '',
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
        else reject(new Error(`bot-runtime exited ${code}`));
      });
      child.on('error', reject);
    });
    return;
  }

  if (cmd === 'session' && args[1] === 'status') {
    const slug = arg(args, '--slug') ?? DEMO_SLUG;
    const cfg = await loadConfig(slug);
    await printSessionStatus(slug, cfg);
    return;
  }

  if (cmd === 'session' && args[1] === 'end') {
    const slug = arg(args, '--slug') ?? DEMO_SLUG;
    const cfg = await loadConfig(slug);
    const parkHostname = has(args, '--park-hostname');
    await sessionEnd(slug, cfg, { parkHostname });
    return;
  }

  if (cmd === 'campaign' && args[1] === 'publish') {
    const slug = arg(args, '--slug') ?? DEMO_SLUG;
    const cfg = await loadConfig(slug);
    const { publishCampaignArchive } = await import('@kodranni/publish');
    const r = publishCampaignArchive({
      slug,
      storePath: cfg.storePath,
      publicHost: cfg.edgeUrl ?? cfg.tunnelHostname ?? cfg.liveBaseUrl,
    });
    console.log(`Published archive → ${r.dir}`);
    console.log(`  ${r.characterCount} characters · ${r.generatedAt}`);
    const { publishSnapshotToEdge } = await import('./edge-publish.js');
    try {
      await publishSnapshotToEdge(slug, cfg);
    } catch (e) {
      console.error(`  edge: ${e instanceof Error ? e.message : e}`);
    }
    return;
  }

  if (cmd === 'session' && args[1] === 'start') {
    const slug = arg(args, '--slug') ?? DEMO_SLUG;
    const cfg = await loadConfig(slug);
    const mode = await sessionStart({
      slug,
      cfg,
      tunnel: has(args, '--tunnel'),
      bot: has(args, '--bot'),
      detach: has(args, '--detach'),
      force: has(args, '--force'),
    });
    if (mode === 'detached') return;
  }

  if (
    cmd === 'live' ||
    (cmd === 'session' && args[1] === 'start' && !has(args, '--detach'))
  ) {
    const slug = arg(args, '--slug') ?? DEMO_SLUG;
    const cfg = await loadConfig(slug);
    await runLiveKernel({
      slug,
      cfg,
      repoRoot: resolveRepoRoot(),
      tunnel: has(args, '--tunnel'),
      bot: has(args, '--bot'),
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
