export const prerender = false;

import {
  confirmReturnToTable,
  spendFoundation,
  spendSkill,
  updateDraftConcept,
} from '@kodranni/app';
import { openSqliteStore } from '@kodranni/store';
import { resolveStorePath } from '../../../lib/campaign-paths';

type ActionBody =
  | { action: 'update-concept'; name?: string; concept?: string; communityTie?: string; whoWeSee?: string }
  | { action: 'spend-foundation'; foundation: string }
  | { action: 'spend-skill'; skill: string }
  | { action: 'confirm' };

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** POST /api/character/:slug — draft/unlock actions (live store only). */
export async function POST({
  params,
  request,
}: {
  params: { slug?: string };
  request: Request;
}) {
  const slug = params.slug;
  if (!slug) return json({ error: 'Missing slug' }, 400);

  const storePath = resolveStorePath();
  if (!storePath) return json({ error: 'No live store configured' }, 503);

  let body: ActionBody;
  try {
    body = (await request.json()) as ActionBody;
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const store = openSqliteStore(storePath);
  try {
    switch (body.action) {
      case 'update-concept': {
        const ch = updateDraftConcept(store, {
          characterSlug: slug,
          name: body.name,
          concept: body.concept,
          communityTie: body.communityTie,
          whoWeSee: body.whoWeSee,
        });
        return json({
          ok: true,
          name: ch.name,
          concept: ch.concept,
          communityTie: ch.communityTie,
          whoWeSee: ch.whoWeSee,
        });
      }
      case 'spend-foundation': {
        const ch = spendFoundation(store, {
          characterSlug: slug,
          foundation: body.foundation,
        });
        return json({
          ok: true,
          foundations: ch.foundations,
          creation: ch.creation,
        });
      }
      case 'spend-skill': {
        const ch = spendSkill(store, {
          characterSlug: slug,
          skill: body.skill,
        });
        return json({
          ok: true,
          skills: ch.skills,
          creation: ch.creation,
        });
      }
      case 'confirm': {
        const r = confirmReturnToTable(store, { characterSlug: slug });
        return json({
          ok: true,
          status: r.character.status,
          mention: r.mention,
        });
      }
      default:
        return json({ error: 'Unknown action' }, 400);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: msg }, 400);
  } finally {
    store.close();
  }
}
