export const prerender = false;

import { addCommunityFaction, addHallNpc, addHallOutsider } from '@kodranni/app';
import { openSqliteStore } from '@kodranni/store';
import { resolveStorePath } from '../../../lib/campaign-paths';
import { foundingOriginOk } from '../../../lib/origin';
import { resolveSetup } from '../../../lib/setup-auth';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** POST /api/community/figures — add an NPC or outsider, or a faction. */
export async function POST({
  request,
  url,
}: {
  request: Request;
  url?: URL;
}) {
  const publicUrl = url ?? new URL(request.url);
  if (!foundingOriginOk(request, publicUrl)) return json({ error: 'Invalid origin' }, 403);

  const storePath = resolveStorePath();
  if (!storePath) return json({ error: 'No live store configured' }, 503);

  let body: {
    kind?: string;
    name?: string;
    outsider?: boolean;
    faction?: string;
    hue?: number;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const store = openSqliteStore(storePath);
  try {
    const live = store.getCommunity();
    const auth = resolveSetup(request, publicUrl, live.slug);
    if (!auth.canEdit) return json({ error: auth.reason ?? 'Unauthorized' }, 401);

    if (body.kind === 'faction') {
      const community = addCommunityFaction(store, {
        name: String(body.name ?? ''),
        hue: Number(body.hue ?? 0),
      });
      return json({
        ok: true,
        factions: community.factions,
        labels: community.labels,
        labelGroups: community.labelGroups,
      });
    }
    const name = String(body.name ?? '');
    if (body.outsider) {
      const community = addHallOutsider(store, { name, faction: body.faction });
      return json({ ok: true, outsiders: community.outsiders });
    }
    const ch = addHallNpc(store, { name });
    return json({ ok: true, slug: ch.slug, name: ch.name });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: msg }, 400);
  } finally {
    store.close();
  }
}
