export const prerender = false;

import {
  applyRest,
  clearScene,
  clearSceneFace,
  closeTide,
  nudgeExertion,
  openTide,
  readTable,
  rememberChannelMessage,
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
import { sessionReading, tidePicturePath, type SessionReading, type SessionTideView } from '@kodranni/hall-render';
import {
  defaultCampaignTomlPath,
  openSqliteStore,
  readCampaignConfig,
  readLiveUrl,
  readSessionState,
  type CommunityStorePort,
  type SceneTone,
  type TableMessageRef,
} from '@kodranni/store';
import { resolveCampaignSlug, resolveStorePath } from '../../../lib/campaign-paths';
import { edgeControl } from '../../../lib/edge-control';
import { rejectUnlessDesk } from '../../../lib/loopback';
import { inboxSentBy, restPerson } from '../../../lib/session-desk';

const PLAY_CHANNEL = /^\d{17,20}$/;
const TIDE_NOT_LIVE =
  'The Tide is open on this table. It posts to the play channel when the table is live.';
const TIDE_NO_CHANNEL = 'The Tide is open here. Set the play channel in Table chat to post it.';
const TIDE_REJECTED = 'The Tide is open here. The panel did not reach the play channel.';
const TIDE_CLOSED_QUIET =
  'The Tide is closed on this table. The channel card updates when the table is live.';
const OMENS_NOT_LIVE =
  'The omens are on this table. They post to the play channel when the table is live.';
const OMENS_NO_CHANNEL = 'The omens are here. Set the play channel in Table chat to post them.';
const OMENS_REJECTED = 'The omens are here. The board did not reach the play channel.';

/** Same host check as dieImageUrl in @kodranni/chat-ui. A chat client cannot fetch loopback. */
function fetchableOrigin(base: string | undefined): string | undefined {
  if (!base) return undefined;
  try {
    const url = new URL(base);
    const host = url.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]') {
      return undefined;
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
}

function hallOrigin(): string | undefined {
  const slug = resolveCampaignSlug();
  if (!slug) return undefined;
  return fetchableOrigin(readLiveUrl(slug));
}

function sceneStamp(reading: SessionReading): string {
  let hash = 5381;
  for (const row of reading.die) {
    const raw = `${row.face}:${row.tone}:${row.effect}`;
    for (let i = 0; i < raw.length; i++) hash = Math.imul(hash, 33) ^ raw.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

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

function tideMarker(tide: {
  sideA: string;
  sideB: string;
  position: number;
  length: number;
}): string {
  if (tide.position <= 0) return `${tide.sideA} has collapsed.`;
  if (tide.position >= tide.length) return `${tide.sideB} has collapsed.`;
  return `The marker stands at ${tide.position} of ${tide.length}.`;
}

function tideSizeLabel(size: string): string {
  if (size === 'small') return 'Small skirmish';
  if (size === 'battle') return 'Battle';
  return 'Skirmish';
}

function tideFootingLabel(footing: string, sideA: string, sideB: string): string {
  if (footing === 'slightA') return `${sideA} at a slight disadvantage`;
  if (footing === 'slightB') return `${sideB} at a slight disadvantage`;
  if (footing === 'severeA') return `${sideA} at a severe disadvantage`;
  if (footing === 'severeB') return `${sideB} at a severe disadvantage`;
  return 'Equal footing';
}

function tideView(tide: {
  sideA: string;
  sideB: string;
  size: SessionTideView['size'];
  footing: SessionTideView['footing'];
  position: number;
  length: number;
  dyeA: string;
  dyeB: string;
}): SessionTideView {
  return {
    sideA: tide.sideA,
    sideB: tide.sideB,
    size: tide.size,
    sizeLabel: tideSizeLabel(tide.size),
    footing: tide.footing,
    footingLabel: tideFootingLabel(tide.footing, tide.sideA, tide.sideB),
    position: tide.position,
    length: tide.length,
    marker: tideMarker(tide),
    dyeA: tide.dyeA,
    dyeB: tide.dyeB,
  };
}

function tideEmbed(tide: SessionTideView, closed = false): Record<string, unknown> {
  const origin = hallOrigin();
  const image = origin ? `${origin}${tidePicturePath(tide)}` : undefined;
  const embed: Record<string, unknown> = {
    title: 'The Tide',
    description: closed ? `Closed. ${tide.marker}` : tide.marker,
    color: 0x8a8580,
    fields: [
      { name: tide.sideA, value: '0', inline: true },
      { name: 'Marker', value: `${tide.position} of ${tide.length}`, inline: true },
      { name: tide.sideB, value: String(tide.length), inline: true },
      { name: 'Size', value: tide.sizeLabel, inline: true },
      { name: 'Footing', value: tide.footingLabel, inline: false },
    ],
  };
  if (image) embed.image = { url: image };
  return {
    embeds: [embed],
    components: closed
      ? []
      : [
          {
            type: 1,
            components: [
              { type: 2, style: 1, custom_id: 'tide-roll', label: 'Roll' },
              { type: 2, style: 2, custom_id: 'tide-close', label: 'Close' },
            ],
          },
        ],
  };
}

function omenEmbed(reading: SessionReading): Record<string, unknown> {
  const origin = hallOrigin();
  const image = origin ? `${origin}/session/omens.png?v=${sceneStamp(reading)}` : undefined;
  const lines = reading.scene.map((row) => `${row.face}. ${row.effect}`).join('\n');
  const embed: Record<string, unknown> = {
    title: 'Omens',
    description: (lines || 'No public lines yet.').slice(0, 4000),
    color: 0x8a8580,
  };
  if (image) embed.image = { url: image };
  return { embeds: [embed] };
}

function messageRef(channelId: string, json: Record<string, unknown>): TableMessageRef | undefined {
  const messageId = typeof json.id === 'string' ? json.id : '';
  if (!/^\d{17,20}$/.test(messageId)) return undefined;
  return { platform: 'discord', channelId, messageId };
}

/** Posts or edits only when the table is live and a play channel is configured. */
async function deliverPanel(
  store: CommunityStorePort,
  kind: 'tide' | 'scene',
  payload: Record<string, unknown>,
  copy: { notLive: string; noChannel: string; rejected: string },
  existing?: TableMessageRef,
): Promise<{ posted: boolean; postError?: string }> {
  const slug = resolveCampaignSlug();
  if (!slug || !readSessionState(slug)?.tunnel) return { posted: false, postError: copy.notLive };
  const channelId = await playChannelId(slug);
  if (!channelId) return { posted: false, postError: copy.noChannel };
  if (existing) {
    const edited = await edgeControl('/control/discord/rest', {
      op: 'edit',
      channelId: existing.channelId,
      messageId: existing.messageId,
      payload,
    });
    if (!edited.ok) return { posted: false, postError: copy.rejected };
    return { posted: true };
  }
  const sent = await edgeControl('/control/discord/rest', {
    op: 'send',
    channelId,
    payload,
  });
  if (!sent.ok) return { posted: false, postError: copy.rejected };
  const ref = messageRef(channelId, sent.json);
  if (ref) rememberChannelMessage(store, kind, ref);
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
  if (!storePath) return json({ whispers: [], pending: 0, inbox: [], tide: null, people: [] });
  const store = openSqliteStore(storePath);
  try {
    const state = readTable(store);
    const reading = sessionReading(state);
    const characters = store.listCharacters();
    const inbox = characters
      .filter((ch) => ch.status === 'pending_review')
      .map((ch) => ({ slug: ch.slug, name: ch.name, sentBy: inboxSentBy(ch) }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return json({
      whispers: state.whispers.map((row) => ({ face: row.face, effect: row.effect })),
      pending: inbox.length,
      inbox,
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
      if (body.post === true && reading.tide) {
        try {
          const panel = await deliverPanel(
            store,
            'tide',
            tideEmbed(reading.tide),
            { notLive: TIDE_NOT_LIVE, noChannel: TIDE_NO_CHANNEL, rejected: TIDE_REJECTED },
          );
          posted = panel.posted;
          postError = panel.postError;
        } catch {
          postError = TIDE_REJECTED;
        }
      }
      return json({ ok: true, reading, person, people, posted, postError });
    } else if (op === 'tideClose') {
      const open = readTable(store).tide;
      if (!open) return json({ error: 'no Tide is open' }, 400);
      const ref = open.messageRef;
      closeTide(store, 'desk');
      let posted = false;
      let postError: string | undefined;
      if (ref?.platform === 'discord') {
        try {
          const panel = await deliverPanel(
            store,
            'tide',
            tideEmbed(tideView(open), true),
            {
              notLive: TIDE_CLOSED_QUIET,
              noChannel: TIDE_CLOSED_QUIET,
              rejected: 'The Tide is closed here. The channel card did not update.',
            },
            ref,
          );
          posted = panel.posted;
          postError = panel.postError;
        } catch {
          postError = 'The Tide is closed here. The channel card did not update.';
        }
      }
      const reading = sessionReading(readTable(store));
      return json({ ok: true, reading, person, people, posted, postError });
    } else if (op === 'scenePost') {
      const state = readTable(store);
      const reading = sessionReading(state);
      let posted = false;
      let postError: string | undefined;
      try {
        const panel = await deliverPanel(
          store,
          'scene',
          omenEmbed(reading),
          { notLive: OMENS_NOT_LIVE, noChannel: OMENS_NO_CHANNEL, rejected: OMENS_REJECTED },
          state.sceneBoardRef,
        );
        posted = panel.posted;
        postError = panel.postError;
      } catch {
        postError = OMENS_REJECTED;
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
