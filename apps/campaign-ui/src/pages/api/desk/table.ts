export const prerender = false;

import {
  applyRest,
  clearScene,
  clearSceneFace,
  nudgeExertion,
  openTide,
  readTable,
  restoreRest,
  saveRestGroups,
  saveSceneFaces,
  setExertion,
  setSupply,
  stReviewCharacter,
  type RestoreRow,
  type RestKind,
} from '@kodranni/app';
import type { TideFooting, TideSkirmishScale } from '@kodranni/domain';
import { sessionReading, type SessionTideView } from '@kodranni/hall-render';
import {
  defaultCampaignTomlPath,
  openSqliteStore,
  readCampaignConfig,
  readSessionState,
  type SceneTone,
} from '@kodranni/store';
import { resolveCampaignSlug, resolveStorePath } from '../../../lib/campaign-paths';
import { edgeControl } from '../../../lib/edge-control';
import { rejectUnlessDesk } from '../../../lib/loopback';
import { restPerson } from '../../../lib/session-desk';

const PLAY_CHANNEL = /^\d{17,20}$/;
const TIDE_NOT_LIVE =
  'The Tide is open on this table. It posts to the play channel when the table is live.';
const TIDE_NO_CHANNEL = 'The Tide is open here. Set the play channel in Table chat to post it.';
const TIDE_REJECTED = 'The Tide is open here. The panel did not reach the play channel.';

async function playChannelId(slug: string): Promise<string> {
  let raw = '';
  try {
    const toml = await readCampaignConfig(defaultCampaignTomlPath(slug));
    raw = toml.discordPlayChannelId ?? process.env.DISCORD_PLAY_CHANNEL_ID ?? '';
  } catch {
    raw = process.env.DISCORD_PLAY_CHANNEL_ID ?? '';
  }
  const id = raw.trim();
  return PLAY_CHANNEL.test(id) ? id : '';
}

function tideEmbed(tide: SessionTideView): Record<string, unknown> {
  return {
    embeds: [
      {
        title: 'The Tide',
        description: tide.marker,
        color: 0x8a8580,
        fields: [
          { name: tide.sideA, value: '0', inline: true },
          { name: 'Marker', value: `${tide.position} of ${tide.length}`, inline: true },
          { name: tide.sideB, value: String(tide.length), inline: true },
          { name: 'Size', value: tide.sizeLabel, inline: true },
          { name: 'Footing', value: tide.footingLabel, inline: false },
        ],
      },
    ],
  };
}

/** Posts only when the desk asked, the table is live, and a play channel is configured. */
async function postTidePanel(tide: SessionTideView | null): Promise<{ posted: boolean; postError?: string }> {
  if (!tide) return { posted: false, postError: TIDE_REJECTED };
  const slug = resolveCampaignSlug();
  if (!slug || !readSessionState(slug)?.tunnel) return { posted: false, postError: TIDE_NOT_LIVE };
  const channelId = await playChannelId(slug);
  if (!channelId) return { posted: false, postError: TIDE_NO_CHANNEL };
  const sent = await edgeControl('/control/discord/rest', {
    op: 'send',
    channelId,
    payload: tideEmbed(tide),
  });
  if (!sent.ok) return { posted: false, postError: TIDE_REJECTED };
  return { posted: true };
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function toneOf(raw: unknown): SceneTone | undefined {
  return raw === 'positive' || raw === 'negative' || raw === 'mixed' ? raw : undefined;
}

function faces(raw: unknown): { face: number; effect: string; tone?: SceneTone; hidden?: boolean }[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => {
    const rec = row as { face?: unknown; effect?: unknown; tone?: unknown; hidden?: unknown };
    return {
      face: Math.round(Number(rec.face)),
      effect: typeof rec.effect === 'string' ? rec.effect : '',
      tone: toneOf(rec.tone),
      hidden: rec.hidden === true,
    };
  });
}

function groups(raw: unknown): { id: string; name: string; members: string[] }[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => {
    const rec = row as { id?: unknown; name?: unknown; members?: unknown };
    const members = Array.isArray(rec.members)
      ? rec.members.filter((slug): slug is string => typeof slug === 'string')
      : [];
    return { id: str(rec.id), name: str(rec.name), members };
  });
}

function slugs(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((slug): slug is string => typeof slug === 'string' && slug.length > 0);
}

function restRows(raw: unknown): RestoreRow[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => {
    const rec = row as {
      characterSlug?: unknown;
      spendFood?: unknown;
      spendWater?: unknown;
      exertion?: unknown;
    };
    const out: RestoreRow = { characterSlug: str(rec.characterSlug) };
    if (rec.spendFood === true) out.spendFood = true;
    if (rec.spendWater === true) out.spendWater = true;
    if (rec.exertion !== undefined && rec.exertion !== null && rec.exertion !== '') {
      out.exertion = Math.round(Number(rec.exertion));
    }
    return out;
  });
}

/** GET /api/desk/table — whispers, the inbox count, and who is in play. Loopback only. */
export async function GET({ request }: { request: Request }) {
  const denied = rejectUnlessDesk(request);
  if (denied) return denied;
  const storePath = resolveStorePath();
  if (!storePath) return json({ whispers: [], pending: 0, tide: null, people: [] });
  const store = openSqliteStore(storePath);
  try {
    const state = readTable(store);
    const reading = sessionReading(state);
    const characters = store.listCharacters();
    return json({
      whispers: state.whispers.map((row) => ({ face: row.face, effect: row.effect })),
      pending: characters.filter((ch) => ch.status === 'pending_review').length,
      tide: reading.tide,
      people: characters.filter((ch) => ch.status === 'active').map(restPerson),
    });
  } finally {
    store.close();
  }
}

/** POST /api/desk/table — scene, inbox, Restore, and opening the Tide. */
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
  const store = openSqliteStore(storePath);
  try {
    const op = str(body.op);
    let person: ReturnType<typeof restPerson> | null = null;
    let people: ReturnType<typeof restPerson>[] | null = null;
    if (op === 'scene') {
      saveSceneFaces(store, faces(body.faces), 'desk');
    } else if (op === 'sceneClear') {
      clearSceneFace(store, Math.round(Number(body.face)), 'desk');
    } else if (op === 'sceneClearAll') {
      clearScene(store, 'desk');
    } else if (op === 'review') {
      const decision = str(body.decision);
      if (decision !== 'approve' && decision !== 'request_changes') {
        return json({ error: 'unknown decision' }, 400);
      }
      const ch = stReviewCharacter(store, {
        characterSlug: str(body.slug),
        decision,
        actor: 'desk',
      });
      person = ch.status === 'active' ? restPerson(ch) : null;
    } else if (op === 'restore') {
      restoreRest(store, { rows: restRows(body.rows), actor: 'desk' });
    } else if (op === 'supplies') {
      const change = setSupply(store, {
        characterSlug: str(body.characterSlug),
        foodDays: body.foodDays == null ? undefined : Math.round(Number(body.foodDays)),
        waterDays: body.waterDays == null ? undefined : Math.round(Number(body.waterDays)),
        actor: 'desk',
      });
      const ch = store.getCharacterBySlug(change.characterSlug);
      person = ch ? restPerson(ch) : null;
    } else if (op === 'exertion') {
      if (body.delta != null && body.delta !== '') {
        const delta = Math.round(Number(body.delta));
        const changes = nudgeExertion(store, { slugs: slugs(body.slugs), delta, actor: 'desk' });
        people = changes
          .map((change) => store.getCharacterBySlug(change.characterSlug))
          .filter((ch): ch is NonNullable<typeof ch> => Boolean(ch))
          .map(restPerson);
      } else {
        const change = setExertion(store, {
          characterSlug: str(body.characterSlug),
          current: Math.round(Number(body.current)),
          actor: 'desk',
        });
        const ch = store.getCharacterBySlug(change.characterSlug);
        person = ch ? restPerson(ch) : null;
      }
    } else if (op === 'rest') {
      const kind = str(body.kind);
      if (kind !== 'short' && kind !== 'long') return json({ error: 'unknown rest' }, 400);
      const changes = applyRest(store, {
        slugs: slugs(body.slugs),
        kind: kind as RestKind,
        ampleFood: body.ampleFood === true,
        ampleWater: body.ampleWater === true,
        actor: 'desk',
      });
      people = changes
        .map((change) => store.getCharacterBySlug(change.characterSlug))
        .filter((ch): ch is NonNullable<typeof ch> => Boolean(ch))
        .map(restPerson);
    } else if (op === 'groups') {
      saveRestGroups(store, groups(body.groups), 'desk');
    } else if (op === 'whisperClear') {
      const prev = readTable(store);
      store.putTableState({ ...prev, whispers: [] });
    } else if (op === 'tideOpen') {
      openTide(store, {
        size: str(body.size) as TideSkirmishScale,
        footing: str(body.footing) as TideFooting,
        sideA: str(body.sideA),
        sideB: str(body.sideB),
        dyeA: str(body.dyeA),
        dyeB: str(body.dyeB),
        actor: 'desk',
      });
      const reading = sessionReading(readTable(store));
      let posted = false;
      let postError: string | undefined;
      if (body.post === true) {
        try {
          const panel = await postTidePanel(reading.tide);
          posted = panel.posted;
          postError = panel.postError;
        } catch {
          postError = TIDE_REJECTED;
        }
      }
      return json({ ok: true, reading, person, people, posted, postError });
    } else {
      return json({ error: 'unknown op' }, 400);
    }
    const reading = sessionReading(readTable(store));
    return json({ ok: true, reading, person, people });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: msg }, 400);
  } finally {
    store.close();
  }
}
