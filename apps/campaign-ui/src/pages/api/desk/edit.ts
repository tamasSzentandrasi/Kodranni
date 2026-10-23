export const prerender = false;

import {
  deskAddAxis,
  deskAddGroup,
  deskAddLabel,
  deskAddNpc,
  deskClaimEcho,
  deskExertion,
  deskFoundFortunes,
  deskFoundationStep,
  deskHarmStep,
  deskLabelHue,
  deskMarkDead,
  deskMembership,
  deskMoveLabel,
  deskOrderGroups,
  deskOrderLabels,
  deskPlace,
  deskRemoveAxis,
  deskRemoveCharacter,
  deskRemoveGroup,
  deskRemoveLabel,
  deskRenameAxis,
  deskRenameCommunity,
  deskRenameGroup,
  deskRenameLabel,
  deskReopenEcho,
  deskSetAxisLook,
  deskSetFortuneLevel,
  deskSetFortuneLook,
  deskSetMyths,
  deskSetRulerLook,
  deskConfirmDegrade,
  deskDismissDegrade,
  deskSetNotebook,
  deskSkillStep,
  deskStabilise,
  type DeskSeat,
} from '@kodranni/app';
import { openSqliteStore, type DegradeProposal, type FoundationMyth } from '@kodranni/store';
import { resolveStorePath } from '../../../lib/campaign-paths';
import { rejectUnlessDesk } from '../../../lib/loopback';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function num(v: unknown): number {
  return Math.round(Number(v));
}

function strs(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => String(x)) : [];
}

function sheetPayload(ch: {
  foundations: Record<string, number>;
  foundationsEffective?: Record<string, number>;
  harm: Record<string, number>;
  dying?: boolean;
  skills?: { name: string; rating: number; practice: number; threshold: number }[];
  exertion?: { current: number; max: number };
}) {
  return {
    ok: true as const,
    foundations: ch.foundations,
    foundationsEffective: ch.foundationsEffective ?? {},
    harm: ch.harm,
    dying: Boolean(ch.dying),
    skills: (ch.skills ?? []).map((s) => ({
      name: s.name,
      rating: s.rating,
      practice: s.practice,
      threshold: s.threshold,
    })),
    exertion: ch.exertion ?? { current: 0, max: 0 },
  };
}

function degradeView(proposal: DegradeProposal | undefined) {
  if (!proposal) return null;
  return {
    mode: proposal.mode,
    omen: proposal.omen,
    pool: proposal.pool,
    picked: proposal.picked,
  };
}

function sheetResult(
  store: { getDegradeProposal(slug: string): DegradeProposal | undefined },
  ch: Parameters<typeof sheetPayload>[0] & { slug: string },
) {
  return { ...sheetPayload(ch), degrade: degradeView(store.getDegradeProposal(ch.slug)) };
}

function optNum(v: unknown): number | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? n : undefined;
}

function lookPatch(body: Record<string, unknown>): { hue?: number; sat?: number; light?: number; icon?: string } {
  const look: { hue?: number; sat?: number; light?: number; icon?: string } = {};
  if (body.hue !== undefined) look.hue = num(body.hue);
  const sat = optNum(body.sat);
  const light = optNum(body.light);
  if (sat !== undefined) look.sat = sat;
  if (light !== undefined) look.light = light;
  if ('icon' in body) look.icon = str(body.icon);
  return look;
}

function seat(raw: unknown): DeskSeat {
  if (!raw || typeof raw !== 'object') throw new Error('seat required');
  const s = raw as { kind?: string; axis?: string; tier?: string };
  if (s.kind === 'unassigned' || s.kind === 'porch' || s.kind === 'ruler') return { kind: s.kind };
  if (s.kind === 'rung' && s.axis && s.tier) return { kind: 'rung', axis: s.axis, tier: s.tier };
  throw new Error('seat required');
}

/** POST /api/desk/edit — one gesture, stored as itself. */
export async function POST({ request }: { request: Request }) {
  const denied = rejectUnlessDesk(request);
  if (denied) return denied;
  const storePath = resolveStorePath();
  if (!storePath) return json({ error: 'no store' }, 503);
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'invalid json' }, 400);
  }
  const op = str(body.op);
  const store = openSqliteStore(storePath);
  try {
    let result: unknown = { ok: true };
    switch (op) {
      case 'rename':
        deskRenameCommunity(store, str(body.name));
        break;
      case 'fortune':
        deskSetFortuneLevel(store, str(body.key), num(body.level));
        break;
      case 'found':
        deskFoundFortunes(store);
        break;
      case 'fortuneLook':
        deskSetFortuneLook(store, str(body.key), lookPatch(body));
        break;
      case 'axisLook':
        deskSetAxisLook(store, str(body.name), lookPatch(body));
        break;
      case 'rulerLook':
        deskSetRulerLook(store, {
          ...lookPatch(body),
          title: body.title === undefined ? undefined : str(body.title),
        });
        break;
      case 'myths':
        deskSetMyths(store, (Array.isArray(body.myths) ? body.myths : []) as FoundationMyth[]);
        break;
      case 'place':
        deskPlace(store, {
          slug: str(body.slug) || undefined,
          name: str(body.name),
          from: seat(body.from),
          to: seat(body.to),
          copy: body.copy === true,
        });
        break;
      case 'axisAdd': {
        const community = deskAddAxis(store, str(body.name));
        const axis = community.hierarchyAxes[community.hierarchyAxes.length - 1] ?? '';
        result = { ok: true, axis, count: community.hierarchyAxes.length };
        break;
      }
      case 'axisRename':
        deskRenameAxis(store, str(body.from), str(body.to));
        break;
      case 'axisRemove':
        deskRemoveAxis(store, str(body.name));
        break;
      case 'npc': {
        const ch = deskAddNpc(store, str(body.name));
        return json({ ok: true, slug: ch.slug });
      }
      case 'groupAdd': {
        const community = deskAddGroup(store, str(body.name));
        const group = [...(community.labelGroups ?? [])].reverse().find((g) => g.kind === 'faction');
        result = group ? { ok: true, group: { id: group.id, name: group.name } } : { ok: true };
        break;
      }
      case 'groupRename':
        deskRenameGroup(store, str(body.id), str(body.name));
        break;
      case 'groupRemove':
        deskRemoveGroup(store, str(body.id));
        break;
      case 'groupOrder':
        deskOrderGroups(store, strs(body.ids));
        break;
      case 'labelAdd': {
        const community = deskAddLabel(store, str(body.groupId), str(body.name));
        const label = community.labels?.[community.labels.length - 1];
        result = {
          ok: true,
          label: label
            ? { id: label.id, groupId: label.groupId, name: label.name, hue: label.hue ?? null }
            : null,
        };
        break;
      }
      case 'labelRename':
        deskRenameLabel(store, str(body.id), str(body.name));
        break;
      case 'labelHue':
        deskLabelHue(store, str(body.id), num(body.hue), {
          sat: optNum(body.sat),
          light: optNum(body.light),
        });
        break;
      case 'labelRemove':
        deskRemoveLabel(store, str(body.id));
        break;
      case 'labelOrder':
        deskOrderLabels(store, str(body.groupId), strs(body.ids));
        break;
      case 'labelMove':
        deskMoveLabel(store, str(body.id), str(body.groupId), strs(body.ids));
        break;
      case 'membership':
        deskMembership(store, str(body.slug), str(body.labelId), body.on === true);
        break;
      case 'dead':
        deskMarkDead(store, str(body.slug));
        break;
      case 'remove':
        deskRemoveCharacter(store, str(body.slug), str(body.confirm));
        break;
      case 'foundation':
        result = sheetResult(store, deskFoundationStep(store, str(body.slug), str(body.name), num(body.delta)));
        break;
      case 'harm':
        result = sheetResult(store, deskHarmStep(store, str(body.slug), str(body.track), num(body.delta)));
        break;
      case 'stabilise':
        result = sheetResult(
          store,
          deskStabilise(store, str(body.slug), {
            name: str(body.traitName),
            note: str(body.traitNote),
          }),
        );
        break;
      case 'degrade-propose':
        throw new Error('The omen is thrown on the table.');
      case 'degrade-confirm':
        result = sheetResult(store, deskConfirmDegrade(store, str(body.slug)));
        break;
      case 'degrade-dismiss': {
        const person = str(body.slug);
        deskDismissDegrade(store, person);
        const left = store.getCharacterBySlug(person);
        if (!left) throw new Error(`unknown character: ${person}`);
        result = sheetResult(store, left);
        break;
      }
      case 'skill':
        result = sheetResult(
          store,
          deskSkillStep(
            store,
            str(body.slug),
            str(body.name),
            num(body.ratingDelta),
            num(body.practiceDelta),
          ),
        );
        break;
      case 'exertion':
        result = sheetResult(store, deskExertion(store, str(body.slug), num(body.current)));
        break;
      case 'claim':
        deskClaimEcho(store, str(body.fromSlug), str(body.title), str(body.toSlug));
        break;
      case 'reopen':
        deskReopenEcho(store, str(body.slug), str(body.title));
        break;
      case 'notebook':
        deskSetNotebook(store, str(body.text));
        break;
      default:
        return json({ error: 'unknown op' }, 400);
    }
    return json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: msg }, 400);
  } finally {
    store.close();
  }
}
