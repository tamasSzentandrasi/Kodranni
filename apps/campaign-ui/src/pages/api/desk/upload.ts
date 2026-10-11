export const prerender = false;

import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { deskLabelIcon, deskSetAxisLook, deskSetFortuneLook, deskSetRulerLook } from '@kodranni/app';
import { openSqliteStore } from '@kodranni/store';
import { resolveItemsDir, resolveStorePath } from '../../../lib/campaign-paths';
import { rejectUnlessDesk } from '../../../lib/loopback';

const ALLOWED = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const MAX_BYTES = 256 * 1024;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

function safeBase(name: string): string {
  const cleaned = name.replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 48);
  return cleaned || 'icon';
}

function stamp(): string {
  return `${Date.now().toString(36)}${Math.floor(Math.random() * 36).toString(36)}`;
}

function storedIcon(
  community: {
    fortuneLook?: Record<string, { icon?: string } | undefined>;
    axisLook?: Record<string, { icon?: string } | undefined>;
    rulerLook?: { icon?: string };
    labels?: { id: string; icon?: string }[];
  },
  kind: string,
  key: string,
): string | undefined {
  if (kind === 'fortune') return community.fortuneLook?.[key]?.icon;
  if (kind === 'axis') return community.axisLook?.[key]?.icon;
  if (kind === 'ruler') return community.rulerLook?.icon;
  return (community.labels ?? []).find((label) => label.id === key)?.icon;
}

function forgetIcon(dir: string, previous: string | undefined, nextName: string): void {
  if (!previous || previous === nextName) return;
  if (previous !== basename(previous) || previous.includes('..')) return;
  const full = join(dir, previous);
  if (existsSync(full)) unlinkSync(full);
}

/** POST /api/desk/upload — fortune or label icon into the campaign item folder. */
export async function POST({ request }: { request: Request }) {
  const denied = rejectUnlessDesk(request);
  if (denied) return denied;
  const storePath = resolveStorePath();
  const itemsDir = resolveItemsDir();
  if (!storePath || !itemsDir) return json({ error: 'no store' }, 503);
  const ct = request.headers.get('content-type') ?? '';
  if (!ct.includes('multipart/form-data')) return json({ error: 'Expected multipart' }, 400);
  const form = await request.formData();
  const kind = String(form.get('kind') ?? '');
  const key = String(form.get('key') ?? '');
  const file = form.get('file');
  if (!file || typeof file === 'string') return json({ error: 'Missing file' }, 400);
  if (kind !== 'fortune' && kind !== 'label' && kind !== 'axis' && kind !== 'ruler') {
    return json({ error: 'unknown kind' }, 400);
  }
  if (!key) return json({ error: 'key required' }, 400);
  const ext = extname((file as File).name || '').toLowerCase() || '.jpg';
  if (!ALLOWED.has(ext)) return json({ error: 'Allowed: jpg png webp' }, 400);
  const buf = Buffer.from(await (file as File).arrayBuffer());
  if (buf.byteLength > MAX_BYTES) return json({ error: 'Max 256KB' }, 400);
  const extNorm = ext === '.jpeg' ? '.jpg' : ext;
  const fileName = `${kind}-${safeBase(key)}-${stamp()}${extNorm}`;
  mkdirSync(itemsDir, { recursive: true });
  writeFileSync(join(itemsDir, fileName), buf);
  const store = openSqliteStore(storePath);
  try {
    const previous = storedIcon(store.getCommunity() as Parameters<typeof storedIcon>[0], kind, key);
    if (kind === 'fortune') deskSetFortuneLook(store, key, { icon: fileName });
    else if (kind === 'label') deskLabelIcon(store, key, fileName);
    else if (kind === 'axis') deskSetAxisLook(store, key, { icon: fileName });
    else deskSetRulerLook(store, { icon: fileName });
    forgetIcon(itemsDir, previous, fileName);
    return json({ ok: true, file: fileName });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: msg }, 400);
  } finally {
    store.close();
  }
}
