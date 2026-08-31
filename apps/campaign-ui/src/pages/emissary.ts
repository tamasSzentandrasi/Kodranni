export const prerender = false;

import { existsSync } from 'node:fs';
import {
  defaultStorePath,
  loadSecretsIntoEnv,
  openSqliteStore,
  platformCredentialStatus,
  readSessionState,
} from '@kodranni/store';
import { isLocalDeskRequest } from '../lib/loopback';
import { resolveCampaignSlug, resolveStorePath } from '../lib/campaign-paths';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

/** GET /emissary — localhost desk only. */
export async function GET({ request }: { request: Request }) {
  if (!isLocalDeskRequest(request)) {
    return new Response('Not found', { status: 404 });
  }
  const slug = resolveCampaignSlug() ?? process.env.KODRANNI_CAMPAIGN_SLUG ?? '';
  const secrets = loadSecretsIntoEnv();
  const creds = platformCredentialStatus();
  const storePath = resolveStorePath() ?? (slug ? defaultStorePath(slug) : null);
  const session = slug ? readSessionState(slug) : undefined;
  const checks: { name: string; ok: boolean; detail: string }[] = [];

  checks.push({
    name: 'kernel',
    ok: true,
    detail: `campaign-ui pid ${process.pid}`,
  });

  if (!storePath || !existsSync(storePath)) {
    checks.push({ name: 'store', ok: false, detail: storePath ? `missing ${storePath}` : 'no store' });
  } else {
    try {
      const store = openSqliteStore(storePath);
      const c = store.getCommunity();
      store.close();
      checks.push({ name: 'store', ok: true, detail: `${storePath} · “${c.name}”` });
    } catch (e) {
      checks.push({
        name: 'store',
        ok: false,
        detail: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const device = Boolean(process.env.KODRANNI_EDGE_DEVICE_KEY?.trim());
  checks.push({
    name: 'device-key',
    ok: device,
    detail: device ? `present · ${secrets.dir}` : `missing under ${secrets.dir}`,
  });

  checks.push({
    name: 'discord',
    ok: Boolean(creds.discord.guild && creds.discord.playChannel),
    detail:
      creds.discord.guild && creds.discord.playChannel
        ? `guild+play-channel bound${creds.discord.token ? ' · token hatch' : ''}`
        : 'not bound — invite and pick guild/channel/role on /operator',
  });

  checks.push({
    name: 'session',
    ok: true,
    detail: session?.startedAt
      ? `started ${session.startedAt}${session.tunnel ? ' · tunnel' : ''}`
      : 'no session.json',
  });

  const ok = checks.filter((c) => c.name === 'store').every((c) => c.ok);
  return json({ ok, slug, checks, liveUrl: session?.liveUrl, localUrl: session?.localUrl });
}
