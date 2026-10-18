export const prerender = false;

import { currentNightHandler, type NightOp } from '@kodranni/store';
import { isLocalDeskRequest } from '../../../lib/loopback';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

function loopbackHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === '127.0.0.1' || host === 'localhost' || host === '::1';
}

function back(request: Request): string {
  const ref = request.headers.get('referer');
  if (!ref) return '/community/';
  try {
    const url = new URL(ref);
    if (!loopbackHost(url.hostname)) return '/community/';
    if (!url.pathname.startsWith('/') || url.pathname.startsWith('//')) return '/community/';
    return url.pathname + url.search;
  } catch {
    return '/community/';
  }
}

async function readOp(request: Request): Promise<NightOp | null> {
  const ct = request.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    const body = (await request.json()) as { op?: unknown };
    return body.op === 'live' || body.op === 'end' ? body.op : null;
  }
  const op = String((await request.formData()).get('op') ?? '');
  return op === 'live' || op === 'end' ? op : null;
}

/** POST /api/desk/night — Go Live or End Session. Loopback only. The hall stays up. */
export async function POST({ request }: { request: Request }): Promise<Response> {
  if (!isLocalDeskRequest(request)) return new Response('Not found', { status: 404 });
  const asJson = (request.headers.get('content-type') ?? '').includes('application/json');
  let op: NightOp | null;
  try {
    op = await readOp(request);
  } catch {
    return json({ error: 'invalid body' }, 400);
  }
  if (!op) return json({ error: 'need op' }, 400);
  const handler = currentNightHandler();
  if (!handler) return json({ error: 'night control is not running' }, 503);
  try {
    const result = await handler(op);
    if (asJson) return json(result);
    return new Response(null, {
      status: 303,
      headers: { location: back(request), 'cache-control': 'no-store' },
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
}
