export const prerender = false;

import {
  confirmReturnToTable,
  deskEditCharacter,
  refundFoundation,
  refundSkill,
  spendFoundation,
  spendSkill,
  spendWantingBatch,
  spendWordWanting,
  editUnlockedSheet,
  updateDraftConcept,
  type StEditCharacterPatch,
  type WantingMenuId,
} from '@kodranni/app';
import { openSqliteStore } from '@kodranni/store';
import { resolveStorePath } from '../../../lib/campaign-paths';
import { deskToolsOn } from '../../../lib/loopback';
import { resolveSheetEdit } from '../../../lib/sheet-auth';

type ActionBody =
  | {
      action: 'update-concept';
      name?: string;
      concept?: string;
      communityTie?: string;
      whoWeSee?: string;
    }
  | { action: 'spend-foundation'; foundation: string }
  | { action: 'spend-skill'; skill: string }
  | { action: 'refund-foundation'; foundation: string }
  | { action: 'refund-skill'; skill: string }
  | {
      action: 'spend-wanting';
      menu: WantingMenuId;
      foundation?: string;
      foundations?: [string, string];
      removeSkills?: { skill: string; ranks: number }[];
      addSkillPoints?: number;
      traitName?: string;
      traitNote?: string;
      negativeTrait?: { name: string; note?: string };
    }
  | {
      action: 'spend-wanting-batch';
      spends: {
        menu: WantingMenuId;
        foundation?: string;
        foundations?: [string, string];
        removeSkills?: { skill: string; ranks: number }[];
        addSkillPoints?: number;
        traitName?: string;
        traitNote?: string;
        negativeTrait?: { name: string; note?: string };
      }[];
    }
  | { action: 'confirm' }
  | {
      action: 'st-edit';
      patch: {
        concept?: string;
        communityTie?: string;
        whoWeSee?: string;
        traits?: { name: string; note?: string }[];
        echoes?: unknown[];
        inventoryItems?: { name: string; note?: string; tags?: string[]; icon?: string }[];
        foodDays?: number;
        waterDays?: number;
        armour?: { kind: 'none' | 'light' | 'heavy'; donned: boolean };
        foundations?: Record<string, number>;
        skills?: unknown[];
        name?: string;
      };
      pivotalFortune?: { key: string; level: number };
    };

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function capacities(ch: { exertion: { current: number; max: number }; echoCapacity: number; echoWeight: number }) {
  return {
    exertion: ch.exertion,
    echoCapacity: ch.echoCapacity,
    echoWeight: ch.echoWeight,
  };
}

/** GET /api/character/:slug — creation snapshot for live budget polling. */
export async function GET({
  params,
}: {
  params: { slug?: string };
}) {
  const slug = params.slug;
  if (!slug) return json({ error: 'Missing slug' }, 400);
  const storePath = resolveStorePath();
  if (!storePath) return json({ error: 'No live store configured' }, 503);
  const store = openSqliteStore(storePath);
  try {
    const ch = store.getCharacterBySlug(slug);
    if (!ch) return json({ error: 'Not found' }, 404);
    return json({
      ok: true,
      status: ch.status,
      creation: ch.creation ?? null,
      foundations: ch.foundations,
      skills: ch.skills,
      traits: ch.traits,
      echoes: ch.echoes,
      inventory: ch.inventory,
      armour: ch.armour,
      ...capacities(ch),
    });
  } finally {
    store.close();
  }
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

  const url = new URL(request.url);
  const auth = resolveSheetEdit(request, url, slug);
  const desk = deskToolsOn(request);
  if (!desk && !auth.canEdit) {
    return json(
      {
        error: auth.reason ?? 'edit token required',
        hint: 'Open the sheet from the table bot (/create or review link) so ?edit= is present.',
      },
      401,
    );
  }

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
        if (!auth.canEdit) return json({ error: 'edit token required' }, 401);
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
        if (!auth.canEdit) return json({ error: 'edit token required' }, 401);
        const ch = spendFoundation(store, {
          characterSlug: slug,
          foundation: body.foundation,
        });
        return json({
          ok: true,
          foundations: ch.foundations,
          creation: ch.creation,
          ...capacities(ch),
        });
      }
      case 'spend-skill': {
        if (!auth.canEdit) return json({ error: 'edit token required' }, 401);
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
      case 'refund-foundation': {
        if (!auth.canEdit) return json({ error: 'edit token required' }, 401);
        const ch = refundFoundation(store, {
          characterSlug: slug,
          foundation: body.foundation,
        });
        return json({
          ok: true,
          foundations: ch.foundations,
          creation: ch.creation,
          ...capacities(ch),
        });
      }
      case 'refund-skill': {
        if (!auth.canEdit) return json({ error: 'edit token required' }, 401);
        const ch = refundSkill(store, {
          characterSlug: slug,
          skill: body.skill,
        });
        return json({
          ok: true,
          skills: ch.skills,
          creation: ch.creation,
        });
      }
      case 'spend-wanting': {
        if (!auth.canEdit) return json({ error: 'edit token required' }, 401);
        const ch = spendWordWanting(store, {
          characterSlug: slug,
          menu: body.menu,
          foundation: body.foundation,
          foundations: body.foundations,
          removeSkills: body.removeSkills,
          addSkillPoints: body.addSkillPoints,
          traitName: body.traitName,
          traitNote: body.traitNote,
          negativeTrait: body.negativeTrait,
        });
        return json({
          ok: true,
          foundations: ch.foundations,
          skills: ch.skills,
          traits: ch.traits,
          creation: ch.creation,
          ...capacities(ch),
        });
      }
      case 'spend-wanting-batch': {
        if (!auth.canEdit) return json({ error: 'edit token required' }, 401);
        const ch = spendWantingBatch(store, {
          characterSlug: slug,
          spends: body.spends,
        });
        return json({
          ok: true,
          foundations: ch.foundations,
          skills: ch.skills,
          traits: ch.traits,
          creation: ch.creation,
          ...capacities(ch),
        });
      }
      case 'confirm': {
        if (!auth.canEdit) return json({ error: 'edit token required' }, 401);
        const r = confirmReturnToTable(store, { characterSlug: slug });
        return json({
          ok: true,
          status: r.character.status,
          mention: r.mention,
        });
      }
      case 'st-edit': {
        if (!desk && !auth.canEdit) return json({ error: 'edit token required' }, 401);
        const patch = body.patch as StEditCharacterPatch;
        const ch = desk
          ? deskEditCharacter(
              store,
              slug,
              patch,
              body.pivotalFortune?.key
                ? { key: body.pivotalFortune.key, level: Number(body.pivotalFortune.level) }
                : undefined,
            )
          : editUnlockedSheet(store, {
              characterSlug: slug,
              patch,
              actor: auth.claims?.accountId,
            });
        return json({
          ok: true,
          traits: ch.traits,
          echoes: ch.echoes,
          inventory: ch.inventory,
          armour: ch.armour,
          foundations: ch.foundations,
          skills: ch.skills,
          creation: ch.creation,
          ...capacities(ch),
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
