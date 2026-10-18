import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  confirmReturnToTable,
  deskEditCharacter,
  startCreateFromBot,
  updateDraftConcept,
} from '@kodranni/app';
import { sessionReading, storytellerDie } from '@kodranni/hall-render';
import { defaultCampaignTomlPath, emptyTableState, openSqliteStore, seedDemoCampaign } from '@kodranni/store';
import { POST as discordPost } from '../src/pages/api/desk/discord';
import { POST as fluxerPost } from '../src/pages/api/desk/fluxer';
import { GET as tableGet, POST as tablePost } from '../src/pages/api/desk/table';
import { GET as sessionGet } from '../src/pages/api/session';
import { GET as omensGet } from '../src/pages/session/omens.png';
import { assembleSession, sessionDeskHtml, sessionNightLine, sessionPageHtml } from '../src/lib/session-desk';

const dirs: string[] = [];
const prevStore = process.env.KODRANNI_STORE_PATH;
const prevSlug = process.env.KODRANNI_CAMPAIGN_SLUG;
const prevHome = process.env.KODRANNI_HOME;
const prevGuild = process.env.DISCORD_GUILD_ID;
const prevChannel = process.env.DISCORD_PLAY_CHANNEL_ID;
const prevRole = process.env.DISCORD_STORYTELLER_ROLE_ID;
const prevFluxGuild = process.env.FLUXER_GUILD_ID;
const prevFluxChannel = process.env.FLUXER_PLAY_CHANNEL_ID;
const prevFluxRole = process.env.FLUXER_STORYTELLER_ROLE_ID;

afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
  if (prevStore === undefined) delete process.env.KODRANNI_STORE_PATH;
  else process.env.KODRANNI_STORE_PATH = prevStore;
  if (prevSlug === undefined) delete process.env.KODRANNI_CAMPAIGN_SLUG;
  else process.env.KODRANNI_CAMPAIGN_SLUG = prevSlug;
  if (prevHome === undefined) delete process.env.KODRANNI_HOME;
  else process.env.KODRANNI_HOME = prevHome;
  if (prevGuild === undefined) delete process.env.DISCORD_GUILD_ID;
  else process.env.DISCORD_GUILD_ID = prevGuild;
  if (prevChannel === undefined) delete process.env.DISCORD_PLAY_CHANNEL_ID;
  else process.env.DISCORD_PLAY_CHANNEL_ID = prevChannel;
  if (prevRole === undefined) delete process.env.DISCORD_STORYTELLER_ROLE_ID;
  else process.env.DISCORD_STORYTELLER_ROLE_ID = prevRole;
  if (prevFluxGuild === undefined) delete process.env.FLUXER_GUILD_ID;
  else process.env.FLUXER_GUILD_ID = prevFluxGuild;
  if (prevFluxChannel === undefined) delete process.env.FLUXER_PLAY_CHANNEL_ID;
  else process.env.FLUXER_PLAY_CHANNEL_ID = prevFluxChannel;
  if (prevFluxRole === undefined) delete process.env.FLUXER_STORYTELLER_ROLE_ID;
  else process.env.FLUXER_STORYTELLER_ROLE_ID = prevFluxRole;
});

function liveStore() {
  const dir = mkdtempSync(join(tmpdir(), 'kod-session-'));
  dirs.push(dir);
  const path = join(dir, 'c.sqlite');
  const store = openSqliteStore(path);
  seedDemoCampaign(store);
  store.close();
  process.env.KODRANNI_STORE_PATH = path;
  process.env.KODRANNI_CAMPAIGN_SLUG = 'session-fixture';
  return path;
}

function deskRequest(url: string, body: unknown, extra?: Record<string, string>) {
  const headers = new Headers({ 'content-type': 'application/json', host: '127.0.0.1' });
  for (const [key, value] of Object.entries(extra ?? {})) headers.set(key, value);
  return new Request(url, { method: 'POST', headers, body: JSON.stringify(body) });
}

describe('session page', () => {
  it('shows the scene to the live hall and the five desk blocks on loopback', () => {
    const state = {
      ...emptyTableState(),
      sceneFaces: [
        { face: 4, effect: 'The mill bell', tone: 'mixed' as const, hidden: false },
        { face: 9, effect: 'The sealed bell', tone: 'negative' as const, hidden: true },
      ],
    };
    const reading = sessionReading(state);
    const live = sessionPageHtml({ between: false, reading, desk: null });
    expect(live).toContain('Positive Consequence');
    expect(live).toContain('The mill bell');
    expect(live).toContain('class="omen-die"');
    expect(live).toContain('<h2>Omens</h2>');
    expect(live).toContain('omen-mark');
    expect(live).not.toContain('This scene');
    expect(live).not.toContain('The sealed bell');
    expect(live).toContain('No Tide is open.');
    expect(live).not.toContain('Approvals');
    expect(live).not.toContain('data-session-inbox');
    expect(live).not.toContain('adapter pending');
    expect(live).not.toContain('Post the omens');

    const desk = sessionDeskHtml({
      die: storytellerDie(state),
      whispers: [{ face: 9, effect: 'The sealed bell' }],
      pending: [{ slug: 'mara', name: 'Mara Reed', sentBy: 'Mara' }],
      pcs: [
        { slug: 'tomaso', name: 'Tomaso Fero', kind: 'pc', foodDays: 2, waterDays: 1, exertion: 1, exertionMax: 6 },
      ],
      npcs: [],
      groups: [],
      tide: null,
      discord: { guildId: '', channelId: '', roleId: '' },
      fluxer: { guildId: '100000000000000044', channelId: '', roleId: '' },
      bound: [{ name: 'Tomaso Fero', displayName: 'Mara' }],
    });
    expect(desk).toContain('data-omen-edit');
    expect(desk).toContain('The mill bell');
    expect(desk).toContain('The sealed bell');
    expect(desk).toContain('Whisper');
    expect(desk).toContain('<h2>Omens</h2>');
    expect(desk).toContain('data-omen-lectern');
    expect(desk).toContain('data-slide="approvals"');
    expect(desk).toContain('Approvals');
    expect(desk).toContain('data-inbox-body');
    expect(desk).not.toContain('session-drawer__title');
    expect(desk).not.toContain('This scene');
    expect(desk).toContain('class="session-count"');
    expect(desk).toContain('Restore &amp; Restock');
    expect(desk).toContain('data-rest-band="players"');
    expect(desk).toContain('>Players<');
    expect(desk).toContain('data-exertion');
    expect(desk).toContain('data-group-exertion');
    expect(desk).toContain('session-glyph');
    expect(desk).not.toContain('At the table');
    expect(desk).not.toContain('omen-stage__seal');
    expect(desk).toContain('data-point="up"');
    expect(desk).toContain('data-point="down"');
    expect(desk).toContain('href="/characters/tomaso/"');
    expect(desk).toContain('Tomaso Fero');
    expect(desk).toContain('Post the Tide');
    expect(desk).toContain('Post the omens');
    expect(desk).toContain('data-omen-post');
    expect(desk).not.toContain('Save scene');
    expect(desk).toContain('data-tide-open disabled');
    expect(desk).not.toContain('data-tide-open hidden');
    expect(desk).not.toContain('Stepping and closing');
    expect(desk).toContain('Short rest');
    expect(desk).toContain('class="kod-tide"');
    expect(desk).toContain('Table chat');
    expect(desk).toContain('data-session-fluxer');
    expect(desk).toContain('>Fluxer<');
    expect(desk).toContain('data-fluxer-guild');
    expect(desk).toContain('value="100000000000000044"');
    expect(desk).toContain('aria-label="Fluxer guild"');
    expect(desk).toContain('Tomaso Fero — Mara');
    expect(desk).not.toContain('Add a face');
    expect(desk).not.toContain('Save scene');
    expect(desk).not.toContain('Save Discord');
    expect(desk).not.toContain('adapter pending');
    expect(desk).not.toContain('>Deny<');

    const between = sessionPageHtml({ between: true, reading, desk: null });
    expect(between).toContain('The table is between sessions.');
    expect(between).not.toContain('Positive Consequence');
    expect(between).not.toContain('The mill bell');
    expect(between).not.toContain('Approvals');
  });
});

describe('GET /api/session', () => {
  it('returns the shared reading on the live hall and hides it while archived', async () => {
    const path = liveStore();
    const store = openSqliteStore(path);
    store.putTableState({
      ...emptyTableState(),
      sceneFaces: [
        { face: 4, effect: 'The mill bell', tone: 'mixed', hidden: false },
        { face: 9, effect: 'The sealed bell', tone: 'negative', hidden: true },
      ],
    });
    store.close();

    const live = await sessionGet({
      request: new Request('http://play.example/api/session', {
        headers: { host: 'play.example', 'x-forwarded-host': 'play.example' },
      }),
    });
    expect(live.status).toBe(200);
    const body = (await live.json()) as { scene: { effect: string }[]; tide: unknown; pending?: unknown };
    expect(body.scene.map((row) => row.effect)).toContain('The mill bell');
    expect(body.scene.map((row) => row.effect)).toContain('Positive Consequence');
    expect(body.tide).toBeNull();
    expect(body.pending).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain('inbox');
    expect(JSON.stringify(body)).not.toContain('The sealed bell');

    const archived = await sessionGet({
      request: new Request('http://127.0.0.1:8742/api/session', {
        headers: { host: '127.0.0.1', 'x-kodranni-archive': '1' },
      }),
    });
    const quiet = (await archived.json()) as { between?: boolean; scene: unknown[] };
    expect(quiet.between).toBe(true);
    expect(quiet.scene).toEqual([]);
    expect(JSON.stringify(quiet)).not.toContain('The mill bell');
  });
});

describe('GET /api/desk/table', () => {
  it('returns waiting sheets for the approvals drawer', async () => {
    const path = liveStore();
    const store = openSqliteStore(path);
    const ch = store.getCharacterBySlug('jakov');
    if (!ch) throw new Error('missing jakov');
    ch.status = 'pending_review';
    ch.initiator = { platform: 'discord', accountId: 'p1', displayName: 'Mara' };
    store.putCharacter(ch);
    store.close();
    const res = await tableGet({
      request: new Request('http://127.0.0.1:8742/api/desk/table', {
        headers: { host: '127.0.0.1' },
      }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      pending: number;
      inbox: { slug: string; name: string; sentBy: string }[];
    };
    expect(body.pending).toBe(1);
    expect(body.inbox[0]).toMatchObject({ slug: 'jakov', sentBy: 'Mara' });
  });
});

describe('POST /api/desk/table', () => {
  it('refuses a tunnel, saves a scene, and keeps 7 and 13 out of the rows', async () => {
    const path = liveStore();
    const tunneled = await tablePost({
      request: deskRequest(
        'http://127.0.0.1:8742/api/desk/table',
        { op: 'scene', faces: [{ face: 4, effect: 'The mill bell' }] },
        { 'x-forwarded-host': 'play.example' },
      ),
    });
    expect(tunneled.status).toBe(404);

    const saved = await tablePost({
      request: deskRequest('http://127.0.0.1:8742/api/desk/table', {
        op: 'scene',
        faces: [{ face: 4, effect: 'The mill bell' }],
      }),
    });
    expect(saved.status).toBe(200);
    const fixed = await tablePost({
      request: deskRequest('http://127.0.0.1:8742/api/desk/table', {
        op: 'scene',
        faces: [{ face: 7, effect: 'A custom seven' }],
      }),
    });
    expect(fixed.status).toBe(400);
    const store = openSqliteStore(path);
    expect(store.getTableState().sceneFaces).toEqual([
      { face: 4, effect: 'The mill bell', tone: 'mixed', hidden: false },
    ]);
    expect(JSON.stringify(store.toPublicSnapshot())).not.toContain('The mill bell');
    store.close();

    const cleared = await tablePost({
      request: deskRequest('http://127.0.0.1:8742/api/desk/table', { op: 'sceneClear', face: 4 }),
    });
    expect(cleared.status).toBe(200);
    const after = openSqliteStore(path);
    expect(after.getTableState().sceneFaces).toEqual([]);
    after.close();
  });

  it('approves into a bound sheet and sends a draft back with the edited concept', async () => {
    const path = liveStore();
    const store = openSqliteStore(path);
    const { character } = startCreateFromBot(store, {
      platform: 'discord',
      accountId: 'u-mara',
      displayName: 'Mara',
      name: 'Mara Reed',
    });
    updateDraftConcept(store, { characterSlug: character.slug, concept: 'A first line.' });
    confirmReturnToTable(store, { characterSlug: character.slug });
    deskEditCharacter(store, character.slug, { concept: 'The edited line.' });
    store.close();

    const sent = await tablePost({
      request: deskRequest('http://127.0.0.1:8742/api/desk/table', {
        op: 'review',
        slug: character.slug,
        decision: 'request_changes',
      }),
    });
    expect(sent.status).toBe(200);
    const draft = openSqliteStore(path);
    const returned = draft.getCharacterBySlug(character.slug)!;
    expect(returned.status).toBe('draft');
    expect(returned.concept).toBe('The edited line.');
    confirmReturnToTable(draft, { characterSlug: character.slug });
    draft.close();

    const approved = await tablePost({
      request: deskRequest('http://127.0.0.1:8742/api/desk/table', {
        op: 'review',
        slug: character.slug,
        decision: 'approve',
      }),
    });
    expect(approved.status).toBe(200);
    const body = (await approved.json()) as { person?: { slug: string } };
    expect(body.person?.slug).toBe(character.slug);
    const live = openSqliteStore(path);
    const ch = live.getCharacterBySlug(character.slug)!;
    expect(ch.status).toBe('active');
    expect(ch.creation?.locked).toBe(true);
    expect(ch.player?.accountId).toBe('u-mara');
    expect(ch.concept).toBe('The edited line.');
    live.close();
    const denied = await tablePost({
      request: deskRequest('http://127.0.0.1:8742/api/desk/table', {
        op: 'review',
        slug: character.slug,
        decision: 'deny',
      }),
    });
    expect(denied.status).toBe(400);
  });

  it('opens one Tide and refuses a second, and restores only the ticked row', async () => {
    const path = liveStore();
    const prep = openSqliteStore(path);
    const tomaso = prep.getCharacterBySlug('tomaso')!;
    tomaso.inventory.foodDays = 2;
    tomaso.inventory.waterDays = 0;
    tomaso.exertion.current = 1;
    tomaso.exertion.max = 6;
    prep.putCharacter(tomaso);
    const caterina = prep.getCharacterBySlug('caterina')!;
    const foodBefore = caterina.inventory.foodDays;
    prep.close();

    const missing = await tablePost({
      request: deskRequest('http://127.0.0.1:8742/api/desk/table', { op: 'tideClose' }),
    });
    expect(missing.status).toBe(400);

    const opened = await tablePost({
      request: deskRequest('http://127.0.0.1:8742/api/desk/table', {
        op: 'tideOpen',
        size: 'skirmish',
        footing: 'equal',
        sideA: 'Mill',
        sideB: 'Palace',
        dyeA: '#a01818',
        dyeB: '#6e2438',
      }),
    });
    expect(opened.status).toBe(200);
    const tide = (await opened.json()) as {
      posted?: boolean;
      postError?: string;
      reading: { tide: { marker: string; sideA: string } };
    };
    expect(tide.reading.tide.sideA).toBe('Mill');
    expect(tide.reading.tide.marker).toBe('The marker stands at 8 of 15.');
    expect(tide.posted).toBe(false);
    expect(tide.postError).toBeUndefined();
    const again = await tablePost({
      request: deskRequest('http://127.0.0.1:8742/api/desk/table', {
        op: 'tideOpen',
        size: 'small',
        footing: 'equal',
        sideA: 'A',
        sideB: 'B',
        dyeA: '#a01818',
        dyeB: '#a01818',
      }),
    });
    expect(again.status).toBe(400);

    const closed = await tablePost({
      request: deskRequest('http://127.0.0.1:8742/api/desk/table', { op: 'tideClose' }),
    });
    expect(closed.status).toBe(200);
    const closedBody = (await closed.json()) as { reading: { tide: unknown } };
    expect(closedBody.reading.tide).toBeNull();
    const reopened = await tablePost({
      request: deskRequest('http://127.0.0.1:8742/api/desk/table', {
        op: 'tideOpen',
        size: 'small',
        footing: 'equal',
        sideA: 'Gate',
        sideB: 'Yard',
        dyeA: '#a01818',
        dyeB: '#6e2438',
      }),
    });
    expect(reopened.status).toBe(200);
    const nextTide = (await reopened.json()) as { reading: { tide: { sideA: string } } };
    expect(nextTide.reading.tide.sideA).toBe('Gate');

    const dry = await tablePost({
      request: deskRequest('http://127.0.0.1:8742/api/desk/table', {
        op: 'restore',
        rows: [{ characterSlug: 'tomaso', spendWater: true }],
      }),
    });
    expect(dry.status).toBe(400);
    const untouched = openSqliteStore(path);
    expect(untouched.getCharacterBySlug('tomaso')?.inventory.foodDays).toBe(2);
    untouched.close();

    const rested = await tablePost({
      request: deskRequest('http://127.0.0.1:8742/api/desk/table', {
        op: 'restore',
        rows: [{ characterSlug: 'tomaso', spendFood: true, exertion: 3 }],
      }),
    });
    expect(rested.status).toBe(200);
    const after = openSqliteStore(path);
    expect(after.getCharacterBySlug('tomaso')?.inventory.foodDays).toBe(1);
    expect(after.getCharacterBySlug('tomaso')?.exertion.current).toBe(4);
    expect(after.getCharacterBySlug('caterina')?.inventory.foodDays).toBe(foodBefore);
    after.close();
  });

  it('opens a Tide on the desk without posting while the table is not live', async () => {
    const path = liveStore();
    process.env.KODRANNI_HOME = dirname(path);
    delete process.env.DISCORD_PLAY_CHANNEL_ID;
    const opened = await tablePost({
      request: deskRequest('http://127.0.0.1:8742/api/desk/table', {
        op: 'tideOpen',
        post: true,
        size: 'skirmish',
        footing: 'equal',
        sideA: 'Mill',
        sideB: 'Palace',
        dyeA: '#a01818',
        dyeB: '#3a5c6c',
      }),
    });
    expect(opened.status).toBe(200);
    const body = (await opened.json()) as { posted?: boolean; postError?: string };
    expect(body.posted).toBe(false);
    expect(body.postError).toBe(
      'The Tide is open on this table. It posts to the play channel when the table is live.',
    );
  });

  it('keeps the omens on the table when the play channel is not live', async () => {
    const path = liveStore();
    process.env.KODRANNI_HOME = dirname(path);
    delete process.env.DISCORD_PLAY_CHANNEL_ID;
    const posted = await tablePost({
      request: deskRequest('http://127.0.0.1:8742/api/desk/table', { op: 'scenePost' }),
    });
    expect(posted.status).toBe(200);
    const body = (await posted.json()) as { posted?: boolean; postError?: string };
    expect(body.posted).toBe(false);
    expect(body.postError).toBe(
      'The omens are on this table. They post to the play channel when the table is live.',
    );
  });

  it('serves the omen net as a png and hides it on the archive', async () => {
    liveStore();
    const picture = await omensGet({
      request: new Request('http://127.0.0.1:8742/session/omens.png'),
    });
    expect(picture.status).toBe(200);
    expect(picture.headers.get('content-type')).toBe('image/png');
    const bytes = new Uint8Array(await picture.arrayBuffer());
    expect(bytes[0]).toBe(0x89);
    expect(bytes[1]).toBe(0x50);
    const archived = await omensGet({
      request: new Request('http://127.0.0.1:8742/session/omens.png', {
        headers: { 'x-kodranni-archive': '1' },
      }),
    });
    expect(archived.status).toBe(404);
  });

  it('lists the inbox in confirm order', () => {
    const path = liveStore();
    const store = openSqliteStore(path);
    const first = startCreateFromBot(store, {
      platform: 'discord',
      accountId: 'u-1',
      displayName: 'First',
      name: 'Zara Quinn',
    });
    const second = startCreateFromBot(store, {
      platform: 'discord',
      accountId: 'u-2',
      displayName: 'Second',
      name: 'Ada Quinn',
    });
    confirmReturnToTable(store, { characterSlug: first.character.slug });
    confirmReturnToTable(store, { characterSlug: second.character.slug });
    const assembled = assembleSession({
      desk: true,
      state: store.getTableState(),
      characters: store.listCharacters(),
      events: store.listEvents('CharacterReturnedToTable'),
      discord: { guildId: '', channelId: '', roleId: '' },
      fluxer: { guildId: '', channelId: '', roleId: '' },
    });
    store.close();
    expect(assembled.desk?.pending.map((row) => row.name)).toEqual(['Zara Quinn', 'Ada Quinn']);
    expect(assembled.desk?.pending[0]?.sentBy).toBe('First');
  });
});

describe('POST /api/desk/discord', () => {
  it('rejects a non-snowflake and writes the three ids into campaign.toml', async () => {
    const home = mkdtempSync(join(tmpdir(), 'kod-session-home-'));
    dirs.push(home);
    process.env.KODRANNI_HOME = home;
    process.env.KODRANNI_CAMPAIGN_SLUG = 'session-bind-test';
    const toml = defaultCampaignTomlPath('session-bind-test');
    mkdirSync(dirname(toml), { recursive: true });
    writeFileSync(toml, 'slug = "session-bind-test"\nname = "Bind"\n', 'utf8');

    const bad = await discordPost({
      request: deskRequest('http://127.0.0.1:8742/api/desk/discord', {
        guildId: 'hall',
        channelId: '100000000000000001',
        roleId: '100000000000000002',
      }),
    });
    expect(bad.status).toBe(400);

    const guildId = '100000000000000011';
    const channelId = '100000000000000022';
    const roleId = '100000000000000033';
    const ok = await discordPost({
      request: deskRequest('http://127.0.0.1:8742/api/desk/discord', { guildId, channelId, roleId }),
    });
    expect(ok.status).toBe(200);
    const text = readFileSync(toml, 'utf8');
    expect(text).toContain(`discord_guild_id = "${guildId}"`);
    expect(text).toContain(`discord_play_channel_id = "${channelId}"`);
    expect(text).toContain(`discord_storyteller_role_id = "${roleId}"`);
  });
});

describe('POST /api/desk/fluxer', () => {
  it('rejects a non-snowflake and writes the three ids into campaign.toml', async () => {
    const home = mkdtempSync(join(tmpdir(), 'kod-session-home-'));
    dirs.push(home);
    process.env.KODRANNI_HOME = home;
    process.env.KODRANNI_CAMPAIGN_SLUG = 'session-fluxer-test';
    const toml = defaultCampaignTomlPath('session-fluxer-test');
    mkdirSync(dirname(toml), { recursive: true });
    writeFileSync(toml, 'slug = "session-fluxer-test"\nname = "Bind"\n', 'utf8');

    const bad = await fluxerPost({
      request: deskRequest('http://127.0.0.1:8742/api/desk/fluxer', {
        guildId: 'hall',
        channelId: '100000000000000001',
        roleId: '100000000000000002',
      }),
    });
    expect(bad.status).toBe(400);

    const guildId = '100000000000000111';
    const channelId = '100000000000000222';
    const roleId = '100000000000000333';
    const ok = await fluxerPost({
      request: deskRequest('http://127.0.0.1:8742/api/desk/fluxer', { guildId, channelId, roleId }),
    });
    expect(ok.status).toBe(200);
    const text = readFileSync(toml, 'utf8');
    expect(text).toContain(`fluxer_guild_id = "${guildId}"`);
    expect(text).toContain(`fluxer_play_channel_id = "${channelId}"`);
    expect(text).toContain(`fluxer_storyteller_role_id = "${roleId}"`);
    expect(text).not.toContain('botToken');
    expect(text).not.toContain('FLUXER_BOT_TOKEN');
  });
});

describe('sessionNightLine', () => {
  it('names the public hall as live or between sessions', () => {
    const url = 'https://lantern-watch.kodranni.com/community/';
    expect(sessionNightLine(url, false)).toBe(`${url} is between sessions.`);
    expect(sessionNightLine(url, true)).toBe(`${url} is live.`);
  });
});
