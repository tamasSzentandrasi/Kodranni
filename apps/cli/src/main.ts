import { type ChildProcess, spawn } from 'node:child_process';
import { createWriteStream, existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cryptoRng, mulberry32 } from '@kodranni/domain';
import { executePlayerRoll, executeStorytellerNpcRoll } from '@kodranni/app';
import {
  DEMO_NAME,
  DEMO_SLUG,
  campaignRuntimeLogsDir,
  defaultCampaignTomlPath,
  destroyCampaignDir,
  ensureCampaignLayout,
  ensureCampaignRuntime,
  openSqliteStore,
  readCampaignConfig,
  readLiveUrl,
  seedDemoCampaign,
  writeLiveUrl,
  writeSessionState,
  type CampaignConfig,
} from '@kodranni/store';
import { printEmissaryReport, runEmissary } from './emissary.js';
import { waitForHttp } from './http.js';
import {
  findCloudflared,
  localHttpUrlFromBind,
  startCloudflaredTunnel,
} from './tunnel.js';

function usage(code = 1): never {
  console.log(`kodranni — local automation CLI

Adapters and bots call application services in-process — not this CLI.
The CLI is for ST ops, session orchestration, and verification.

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
  kodranni live --slug <slug> [--tunnel]
      Live campaign-ui. --tunnel: Cloudflare quick tunnel → hashed HTTPS URL.
  kodranni emissary [--slug <slug>]
      Readiness + live/archive access (delivers what players should open).
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

function killChild(child: ChildProcess | undefined): void {
  if (!child || child.killed) return;
  try {
    child.kill('SIGTERM');
  } catch {
    /* ignore */
  }
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
    const store = openSqliteStore(cfg.storePath);
    seedDemoCampaign(store, cfg.slug, cfg.name);
    store.close();
    console.log(`Seeded demo: ${cfg.name} (${cfg.slug})`);
    console.log(`  store: ${cfg.storePath}`);
    console.log(`  characters: torvald, leifr`);
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

  if (cmd === 'emissary') {
    const slug = arg(args, '--slug') ?? DEMO_SLUG;
    const report = await runEmissary({ slug });
    printEmissaryReport(report, slug);
    process.exit(report.ok ? 0 : 1);
  }

  if (cmd === 'live') {
    const slug = arg(args, '--slug') ?? DEMO_SLUG;
    const useTunnel = has(args, '--tunnel');
    const cfg = await loadConfig(slug);
    const repoRoot = resolveRepoRoot();
    ensureCampaignRuntime(slug);
    const logsDir = campaignRuntimeLogsDir(slug);
    const localUrl = localHttpUrlFromBind(cfg.liveBind);
    const communityUrl = localUrl.replace(/\/$/, '') + '/community/';
    const startedAt = new Date().toISOString();

    // Local until tunnel proves itself — avoid advertising a dead public URL
    writeLiveUrl(slug, localUrl);
    writeSessionState(slug, {
      slug,
      startedAt,
      localUrl,
      liveUrl: localUrl,
      tunnel: false,
    });

    console.log(`Live campaign-ui for ${cfg.slug}`);
    console.log(`  store: ${cfg.storePath}`);
    console.log(`  local: ${localUrl}`);
    console.log(`  repo:  ${repoRoot}`);

    const liveLogPath = join(logsDir, 'live.log');
    const liveLog = createWriteStream(liveLogPath, { flags: 'a' });
    liveLog.write(`\n--- live start ${startedAt} ---\n`);

    // Start UI first (astro --force replaces a stale instance on 8742), then tunnel.
    const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const child = spawn(
      npmBin,
      ['run', 'dev', '-w', '@kodranni/campaign-ui'],
      {
        cwd: repoRoot,
        stdio: ['inherit', 'pipe', 'pipe'],
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

    let tunnelChild: ChildProcess | undefined;
    let uiReady = false;

    child.stdout?.on('data', (b: Buffer) => {
      process.stdout.write(b);
      liveLog.write(b);
    });
    child.stderr?.on('data', (b: Buffer) => {
      process.stderr.write(b);
      liveLog.write(b);
    });

    const shutdown = () => {
      killChild(tunnelChild);
      killChild(child);
    };
    process.on('SIGINT', () => {
      shutdown();
      process.exit(130);
    });
    process.on('SIGTERM', () => {
      shutdown();
      process.exit(143);
    });

    const uiExit = new Promise<number | null>((resolve, reject) => {
      child.on('exit', (code) => resolve(code));
      child.on('error', reject);
    });

    // Fail fast if UI dies before becoming ready
    const earlyDeath = uiExit.then((code) => {
      if (!uiReady) {
        throw new Error(`campaign-ui exited ${code} before becoming ready`);
      }
      return code;
    });

    try {
      console.log('  waiting for local UI…');
      await Promise.race([
        waitForHttp(communityUrl, { timeoutMs: 90_000 }),
        earlyDeath,
      ]);
      uiReady = true;
      console.log('  local UI ready');
    } catch (e) {
      killChild(tunnelChild);
      killChild(child);
      liveLog.write(`\n--- live failed: ${e instanceof Error ? e.message : e} ---\n`);
      liveLog.end();
      writeSessionState(slug, {
        slug,
        startedAt,
        localUrl,
        liveUrl: localUrl,
        tunnel: false,
        lastError: e instanceof Error ? e.message : String(e),
      });
      writeLiveUrl(slug, localUrl);
      console.error(e instanceof Error ? e.message : e);
      process.exit(1);
    }

    writeSessionState(slug, {
      slug,
      startedAt,
      localUrl,
      liveUrl: localUrl,
      tunnel: false,
      pids: { live: child.pid },
    });

    if (useTunnel) {
      const bin = await findCloudflared();
      if (!bin) {
        console.error(
          'cloudflared not found on PATH.\n' +
            '  Local UI is running; install cloudflared and re-run with --tunnel for a hashed URL.',
        );
      } else {
        const tunnelLog = join(logsDir, 'tunnel.log');
        console.log(`  tunnel: starting (${bin})…`);
        const tunnel = startCloudflaredTunnel({
          cloudflaredBin: bin,
          localUrl,
          logPath: tunnelLog,
        });
        tunnelChild = tunnel.child;
        try {
          const publicUrl = await Promise.race([
            tunnel.url,
            new Promise<string>((_, rej) =>
              setTimeout(
                () => rej(new Error('Timed out waiting for tunnel URL (45s)')),
                45_000,
              ),
            ),
          ]);
          writeLiveUrl(slug, publicUrl);
          writeSessionState(slug, {
            slug,
            startedAt,
            localUrl,
            liveUrl: publicUrl,
            tunnel: true,
            pids: { live: child.pid, tunnel: tunnelChild.pid },
          });
          console.log(`  public: ${publicUrl}`);
          console.log(
            '  (Cloudflare quick tunnel — random name, unguessable; share only while this process runs)',
          );
          console.log(
            '  (not for the public repo; custom hostnames need a named tunnel + your domain later)',
          );
          console.log(`  log:    ${tunnelLog}`);
        } catch (e) {
          killChild(tunnelChild);
          tunnelChild = undefined;
          writeSessionState(slug, {
            slug,
            startedAt,
            localUrl,
            liveUrl: localUrl,
            tunnel: false,
            pids: { live: child.pid },
            lastError: e instanceof Error ? e.message : String(e),
          });
          console.error(
            `  tunnel failed: ${e instanceof Error ? e.message : e}\n` +
              '  Local UI still running.',
          );
        }
      }
    }

    const code = await uiExit;
    killChild(tunnelChild);
    liveLog.write(`\n--- live exit code=${code} ---\n`);
    liveLog.end();
    writeLiveUrl(slug, localUrl);
    writeSessionState(slug, {
      slug,
      startedAt,
      localUrl,
      liveUrl: localUrl,
      tunnel: false,
      lastError: code && code !== 0 ? `campaign-ui exited ${code}` : undefined,
    });
    if (code !== 0 && code !== null) {
      throw new Error(`campaign-ui exited ${code}`);
    }
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
