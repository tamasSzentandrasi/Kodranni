/**
 * Redacted public snapshot writer.
 * Primary artifact is snapshot.json. Static HTML under archive/ is the offline adapter only.
 */
import { createHmac, randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  assertPublicSnapshot,
  campaignArchiveDir,
  openSqliteStore,
  type CharacterRecord,
  type CommunityStorePort,
  type PublicSnapshot,
} from '@kodranni/store';

export interface PublishResult {
  dir: string;
  snapshotPath: string;
  indexPath: string;
  generatedAt: string;
  characterCount: number;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const CSS = `
:root { color-scheme: dark; --blood: #8a1515; --silver: #b8b3ab; --bright: #f2efe9; --dim: #8a8580; }
* { box-sizing: border-box; }
body { margin: 0; font-family: Georgia, 'Times New Roman', serif; background: #050505; color: var(--silver); line-height: 1.5; }
main { max-width: 42rem; margin: 0 auto; padding: 2rem 1.25rem 3rem; }
nav { display: flex; gap: 1rem; flex-wrap: wrap; margin: 0 0 1.25rem; font-size: 0.92rem; }
nav a { color: var(--bright); text-underline-offset: 0.15em; }
h1, h2 { color: var(--bright); font-weight: 400; letter-spacing: 0.03em; }
h1 { margin: 0 0 0.35rem; font-size: 1.75rem; }
h2 { margin: 1.5rem 0 0.5rem; font-size: 1.2rem; }
.kicker { font-size: 0.72rem; letter-spacing: 0.16em; text-transform: uppercase; color: var(--blood); margin: 0; }
.meta { font-size: 0.88rem; color: var(--dim); margin: 0 0 1.25rem; }
.panel { border-left: 3px solid var(--blood); background: #0c0a0a; padding: 1rem 1.1rem; margin: 1rem 0; }
ul { margin: 0.4rem 0 0; padding-left: 1.1rem; }
li { margin: 0.25rem 0; }
a { color: var(--bright); }
.grid { display: grid; gap: 0.55rem; }
.card { display: block; padding: 0.75rem 0.9rem; background: #0c0a0a; border: 1px solid #2a2222; text-decoration: none; color: inherit; }
.card:hover { border-color: var(--blood); }
.card strong { color: var(--bright); font-weight: 400; }
.roman { letter-spacing: 0.06em; }
table { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
td, th { text-align: left; padding: 0.35rem 0.5rem; border-bottom: 1px solid #1c1818; }
th { color: var(--dim); font-weight: 400; font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; }
`;

function shell(title: string, body: string, opts?: { publicHost?: string }): string {
  const host = opts?.publicHost?.replace(/\/$/, '') ?? '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>${CSS}</style>
</head>
<body>
  <main>
    <nav>
      <a href="/">Home</a>
      <a href="/community/">Community</a>
      <a href="/characters/">Characters</a>
    </nav>
    ${body}
    <p class="meta">${host ? escapeHtml(host) + ' · ' : ''}Archive face — live table is offline.</p>
  </main>
</body>
</html>
`;
}

function roman(n: number): string {
  return ['∅', 'I', 'II', 'III', 'IV'][n] ?? String(n);
}

export function renderArchiveHome(snap: PublicSnapshot, opts?: { publicHost?: string }): string {
  const c = snap.community;
  const body = `
    <p class="kicker">Kodranni · Archive</p>
    <h1>${escapeHtml(c.name)}</h1>
    <p class="meta">Snapshot ${escapeHtml(snap.generatedAt)}</p>
    <div class="panel">
      <p>The live table is offline. This is the last published face of the community — no private maps or edit tokens.</p>
      <p>Browse <a href="/community/">Community</a> and <a href="/characters/">Characters</a>. When the Storyteller opens a session again, this hostname returns to the living sheet.</p>
    </div>
    <h2>Roster</h2>
    <div class="grid">
      ${
        snap.characters
          .map(
            (ch) =>
              `<a class="card" href="/characters/${escapeHtml(ch.slug)}/"><strong>${escapeHtml(ch.name)}</strong> · ${escapeHtml(ch.status)}</a>`,
          )
          .join('\n') || '<p class="meta">None published.</p>'
      }
    </div>`;
  return shell(`${c.name} · Archive`, body, opts);
}

export function renderArchiveCommunity(snap: PublicSnapshot, opts?: { publicHost?: string }): string {
  const c = snap.community;
  const fortunes = Object.entries(c.fortunes ?? {})
    .map(([k, v]) => `<tr><th>${escapeHtml(k)}</th><td>${escapeHtml(String(v))}</td></tr>`)
    .join('');
  const body = `
    <p class="kicker">Community</p>
    <h1>${escapeHtml(c.name)}</h1>
    <p class="meta">Archive snapshot ${escapeHtml(snap.generatedAt)}</p>
    <h2>Fortunes</h2>
    <table>${fortunes || '<tr><td class="meta">None recorded.</td></tr>'}</table>
    <h2>Ruler</h2>
    <p>${c.ruler ? escapeHtml(String(c.ruler)) : '<span class="meta">None</span>'}</p>
    <h2>Characters</h2>
    <div class="grid">
      ${snap.characters
        .map(
          (ch) =>
            `<a class="card" href="/characters/${escapeHtml(ch.slug)}/"><strong>${escapeHtml(ch.name)}</strong></a>`,
        )
        .join('\n')}
    </div>`;
  return shell(`${c.name} · Community · Archive`, body, opts);
}

export function renderArchiveCharacters(snap: PublicSnapshot, opts?: { publicHost?: string }): string {
  const body = `
    <p class="kicker">Characters</p>
    <h1>Roster</h1>
    <p class="meta">${snap.characters.length} published · ${escapeHtml(snap.generatedAt)}</p>
    <div class="grid">
      ${
        snap.characters
          .map(
            (ch) =>
              `<a class="card" href="/characters/${escapeHtml(ch.slug)}/"><strong>${escapeHtml(ch.name)}</strong><br/><span class="meta">${escapeHtml(ch.status)}</span></a>`,
          )
          .join('\n') || '<p class="meta">None published.</p>'
      }
    </div>`;
  return shell(`${snap.community.name} · Characters · Archive`, body, opts);
}

export function renderArchiveCharacter(
  snap: PublicSnapshot,
  ch: CharacterRecord,
  opts?: { publicHost?: string },
): string {
  const founds = Object.entries(ch.foundations ?? {})
    .map(
      ([k, v]) =>
        `<tr><th>${escapeHtml(k)}</th><td class="roman">${escapeHtml(roman(Number(v)))}</td></tr>`,
    )
    .join('');
  const skills = (ch.skills ?? [])
    .filter((s) => (s.rating ?? 0) > 0)
    .map(
      (s) =>
        `<tr><th>${escapeHtml(s.name)}</th><td>${escapeHtml(String(s.rating))}</td></tr>`,
    )
    .join('');
  const traits = (ch.traits ?? [])
    .map((t) => `<li>${escapeHtml(t.name)}${t.note ? ` — ${escapeHtml(t.note)}` : ''}</li>`)
    .join('');
  const body = `
    <p class="kicker">Character · Archive</p>
    <h1>${escapeHtml(ch.name)}</h1>
    <p class="meta">${escapeHtml(ch.status)}${ch.whoWeSee ? ` · ${escapeHtml(ch.whoWeSee.slice(0, 160))}` : ''}</p>
    <h2>Foundations</h2>
    <table>${founds}</table>
    <h2>Skills</h2>
    <table>${skills || '<tr><td class="meta">None rated.</td></tr>'}</table>
    <h2>Traits</h2>
    <ul>${traits || '<li class="meta">None recorded.</li>'}</ul>`;
  return shell(`${ch.name} · Archive`, body, opts);
}

export function writeSnapshotFile(outDir: string, snap: PublicSnapshot): string {
  assertPublicSnapshot(snap);
  mkdirSync(outDir, { recursive: true });
  const snapshotPath = join(outDir, 'snapshot.json');
  writeFileSync(snapshotPath, JSON.stringify(snap, null, 2) + '\n', 'utf8');
  return snapshotPath;
}

export function writeArchiveFiles(
  outDir: string,
  snap: PublicSnapshot,
  opts?: { publicHost?: string },
): PublishResult {
  const snapshotPath = writeSnapshotFile(outDir, snap);
  mkdirSync(outDir, { recursive: true });
  mkdirSync(join(outDir, 'community'), { recursive: true });
  mkdirSync(join(outDir, 'characters'), { recursive: true });

  const indexPath = join(outDir, 'index.html');
  writeFileSync(indexPath, renderArchiveHome(snap, opts), 'utf8');
  writeFileSync(join(outDir, 'community', 'index.html'), renderArchiveCommunity(snap, opts), 'utf8');
  writeFileSync(join(outDir, 'characters', 'index.html'), renderArchiveCharacters(snap, opts), 'utf8');

  for (const ch of snap.characters) {
    const dir = join(outDir, 'characters', ch.slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), renderArchiveCharacter(snap, ch, opts), 'utf8');
  }

  return {
    dir: outDir,
    snapshotPath,
    indexPath,
    generatedAt: snap.generatedAt,
    characterCount: snap.characters.length,
  };
}

export function publishLocalArchive(opts: {
  slug: string;
  store: CommunityStorePort;
  publicHost?: string;
  env?: NodeJS.ProcessEnv;
}): PublishResult {
  const snap = opts.store.toPublicSnapshot();
  const dir = campaignArchiveDir(opts.slug, opts.env);
  return writeArchiveFiles(dir, snap, { publicHost: opts.publicHost });
}

export function publishCampaignArchive(opts: {
  slug: string;
  storePath: string;
  publicHost?: string;
  env?: NodeJS.ProcessEnv;
  /** When false, write snapshot.json only (no offline HTML tree). Default true. */
  offlineHtml?: boolean;
}): PublishResult {
  const store = openSqliteStore(opts.storePath);
  try {
    if (opts.offlineHtml === false) {
      const snap = store.toPublicSnapshot();
      assertPublicSnapshot(snap);
      const dir = campaignArchiveDir(opts.slug, opts.env);
      const snapshotPath = writeSnapshotFile(dir, snap);
      return {
        dir,
        snapshotPath,
        indexPath: snapshotPath,
        generatedAt: snap.generatedAt,
        characterCount: snap.characters.length,
      };
    }
    return publishLocalArchive({
      slug: opts.slug,
      store,
      publicHost: opts.publicHost,
      env: opts.env,
    });
  } finally {
    store.close();
  }
}

export function signSnapshotBody(deviceKey: string, body: string): string {
  return createHmac('sha256', deviceKey).update(body).digest('hex');
}

export function newDeviceKey(): string {
  return randomBytes(32).toString('hex');
}

export async function registerEdgeCampaign(opts: {
  edgeUrl: string;
  campaignId: string;
  deviceKey: string;
}): Promise<void> {
  const url = `${opts.edgeUrl.replace(/\/$/, '')}/control/register?campaign=${encodeURIComponent(opts.campaignId)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ deviceKey: opts.deviceKey }),
  });
  if (res.status === 409 || res.ok) return;
  const text = await res.text().catch(() => '');
  throw new Error(`edge register ${res.status}: ${text.slice(0, 240)}`);
}

export async function putSnapshotToEdge(opts: {
  edgeUrl: string;
  campaignId: string;
  deviceKey: string;
  snapshot: PublicSnapshot;
}): Promise<void> {
  assertPublicSnapshot(opts.snapshot);
  const body = JSON.stringify(opts.snapshot);
  const sig = signSnapshotBody(opts.deviceKey, body);
  const url = `${opts.edgeUrl.replace(/\/$/, '')}/api/snapshot?campaign=${encodeURIComponent(opts.campaignId)}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${opts.campaignId}:${sig}`,
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`edge snapshot PUT ${res.status}: ${text.slice(0, 240)}`);
  }
}

export function edgeOriginWouldLoop(edgeUrl: string, origin: string): boolean {
  try {
    const o = new URL(origin).hostname.replace(/\.$/, '').toLowerCase();
    if (
      o === 'kodranni.com' ||
      o === 'www.kodranni.com' ||
      o === 'demo.kodranni.com' ||
      o === 'play.kodranni.com' ||
      o.endsWith('.kodranni.com') ||
      o.endsWith('.workers.dev')
    ) {
      return true;
    }
    return o === new URL(edgeUrl).hostname.replace(/\.$/, '').toLowerCase();
  } catch {
    return true;
  }
}

export async function announceEdgeLive(opts: {
  edgeUrl: string;
  campaignId: string;
  deviceKey: string;
  origin: string;
}): Promise<void> {
  if (edgeOriginWouldLoop(opts.edgeUrl, opts.origin)) {
    throw new Error(
      'refusing to set edge origin: it matches the public hostname (proxy loop). Use a quick tunnel or a private tunnel hostname.',
    );
  }
  await registerEdgeCampaign({
    edgeUrl: opts.edgeUrl,
    campaignId: opts.campaignId,
    deviceKey: opts.deviceKey,
  });
  await setEdgeOrigin({
    edgeUrl: opts.edgeUrl,
    campaignId: opts.campaignId,
    deviceKey: opts.deviceKey,
    origin: opts.origin,
  });
}

export async function setEdgeOrigin(opts: {
  edgeUrl: string;
  campaignId: string;
  deviceKey: string;
  origin: string | null;
}): Promise<void> {
  const body = JSON.stringify({ origin: opts.origin });
  const sig = signSnapshotBody(opts.deviceKey, body);
  const url = `${opts.edgeUrl.replace(/\/$/, '')}/control/session?campaign=${encodeURIComponent(opts.campaignId)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${opts.campaignId}:${sig}`,
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`edge session POST ${res.status}: ${text.slice(0, 240)}`);
  }
}
