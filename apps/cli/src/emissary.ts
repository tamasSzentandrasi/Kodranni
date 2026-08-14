import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import {
  defaultCampaignTomlPath,
  defaultStorePath,
  liveUrlPath,
  openSqliteStore,
  readCampaignConfig,
  readLiveUrl,
  readSessionState,
  sessionStatePath,
  type CampaignConfig,
} from '@kodranni/store';
import { findCloudflared } from './tunnel.js';

export interface EmissaryReport {
  ok: boolean;
  checks: { name: string; ok: boolean; detail: string }[];
  liveUrl?: string;
  localUrl?: string;
  archiveUrl?: string;
}

function check(name: string, ok: boolean, detail: string) {
  return { name, ok, detail };
}

export async function runEmissary(opts: {
  slug: string;
  cfg?: CampaignConfig;
}): Promise<EmissaryReport> {
  const checks: EmissaryReport['checks'] = [];
  const nodeV = process.versions.node;
  checks.push(
    check('node', true, `v${nodeV} (experimental-sqlite required for store)`),
  );

  let cfg = opts.cfg;
  const tomlPath = defaultCampaignTomlPath(opts.slug);
  if (!cfg) {
    if (!existsSync(tomlPath)) {
      checks.push(check('campaign.toml', false, `missing ${tomlPath}`));
      return { ok: false, checks };
    }
    try {
      cfg = await readCampaignConfig(tomlPath);
      checks.push(check('campaign.toml', true, tomlPath));
    } catch (e) {
      checks.push(
        check('campaign.toml', false, e instanceof Error ? e.message : String(e)),
      );
      return { ok: false, checks };
    }
  } else {
    checks.push(check('campaign.toml', true, tomlPath));
  }

  const storePath = cfg.storePath || defaultStorePath(opts.slug);
  if (!existsSync(storePath)) {
    checks.push(check('store', false, `missing ${storePath}`));
  } else {
    try {
      const store = openSqliteStore(storePath);
      const c = store.getCommunity();
      store.close();
      checks.push(check('store', true, `${storePath} · community “${c.name}”`));
    } catch (e) {
      checks.push(
        check('store', false, e instanceof Error ? e.message : String(e)),
      );
    }
  }

  const cf = await findCloudflared();
  checks.push(
    check(
      'cloudflared',
      Boolean(cf),
      cf ? cf : 'not on PATH — install for hashed live URL (live --tunnel)',
    ),
  );

  let ghOk = false;
  let ghDetail = 'gh not found';
  try {
    const out = execFileSync('gh', ['auth', 'status'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    ghOk = true;
    ghDetail = out.split('\n')[0] ?? 'gh auth ok';
  } catch {
    try {
      execFileSync('git', ['--version'], { encoding: 'utf8' });
      ghDetail = 'git present; gh auth not confirmed (archive publish later)';
      ghOk = true; // soft: git alone is partial readiness
    } catch {
      ghDetail = 'neither gh auth nor git available';
    }
  }
  checks.push(check('git/gh', ghOk, ghDetail));

  const localUrl = cfg.liveBaseUrl;
  const hashed = readLiveUrl(opts.slug);
  const session = readSessionState(opts.slug);
  if (hashed) {
    checks.push(check('live.url', true, `${liveUrlPath(opts.slug)} → ${hashed}`));
  } else {
    checks.push(
      check(
        'live.url',
        true,
        `none yet — run: kodranni live --slug ${opts.slug} --tunnel`,
      ),
    );
  }

  if (session?.startedAt) {
    checks.push(
      check(
        'session',
        true,
        `state ${sessionStatePath(opts.slug)} · started ${session.startedAt}`,
      ),
    );
  } else {
    checks.push(check('session', true, 'no active session.json (ok if only live UI)'));
  }

  if (cfg.publicBaseUrl) {
    checks.push(check('archive', true, cfg.publicBaseUrl));
  } else {
    checks.push(
      check('archive', true, 'public_base_url unset — between-session Pages not configured'),
    );
  }

  // store+toml required; cloudflared optional for local-only
  const hardOk = checks
    .filter((c) => c.name === 'campaign.toml' || c.name === 'store' || c.name === 'node')
    .every((c) => c.ok);

  return {
    ok: hardOk,
    checks,
    liveUrl: hashed ?? localUrl,
    localUrl,
    archiveUrl: cfg.publicBaseUrl,
  };
}

export function printEmissaryReport(report: EmissaryReport, slug: string): void {
  console.log(`Emissary · campaign ${slug}`);
  console.log('');
  for (const c of report.checks) {
    const mark = c.ok ? 'ok' : '!!';
    console.log(`  [${mark}] ${c.name}: ${c.detail}`);
  }
  console.log('');
  if (report.localUrl) console.log(`  Local live:  ${report.localUrl}`);
  if (report.liveUrl && report.liveUrl !== report.localUrl) {
    console.log(`  Public live: ${report.liveUrl}  (hashed tunnel — mid-session)`);
  } else if (report.liveUrl) {
    console.log(`  Live:        ${report.liveUrl}`);
  }
  if (report.archiveUrl) console.log(`  Archive:     ${report.archiveUrl}`);
  console.log('');
  console.log(
    report.ok
      ? 'Access ready for local use. Share the public live URL only while the tunnel/session is up.'
      : 'Not ready — fix !! checks before inviting players.',
  );
}
