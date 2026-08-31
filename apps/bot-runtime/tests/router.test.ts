import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { openSqliteStore, seedDemoCampaign } from '@kodranni/store';
import { mapMember, sheetTokenSecret } from '@kodranni/app';
import type { ChatCard, ChatInteraction, ChatMessageRef, ChatPort } from '@kodranni/chat-port';
import {
  handleInteraction,
  pruneAnnouncedReviews,
  slugsNeedingReviewCard,
  type BotContext,
} from '../src/router.js';

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

function mockPort(): ChatPort & {
  cards: ChatCard[];
  ephemerals: string[];
  replies: ChatCard[];
} {
  const cards: ChatCard[] = [];
  const ephemerals: string[] = [];
  const replies: ChatCard[] = [];
  return {
    platform: 'discord',
    cards,
    ephemerals,
    replies,
    async start() {},
    async stop() {},
    async sendCard(_ch, card) {
      cards.push(card);
      return { platform: 'discord', channelId: _ch, messageId: '1' } as ChatMessageRef;
    },
    async editCard() {},
    async replyEphemeral(_i, content) {
      ephemerals.push(content);
    },
    async editReplyCard(_i, card) {
      replies.push(card);
    },
    onInteraction() {},
  };
}

describe('bot router', () => {
  it('rolls via /roll for a bound character', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'kod-bot-'));
    dirs.push(dir);
    const store = openSqliteStore(join(dir, 'c.sqlite'));
    seedDemoCampaign(store);
    mapMember(store, {
      platform: 'discord',
      accountId: 'user-1',
      characterSlug: 'leifr',
      role: 'player',
    });
    mapMember(store, {
      platform: 'discord',
      accountId: 'st-1',
      characterSlug: 'torvald',
      role: 'storyteller',
    });

    const port = mockPort();
    const ctx: BotContext = {
      store,
      port,
      liveBaseUrl: 'http://127.0.0.1:8742',
      prompts: new Map(),
      log: () => {},
    };

    const rollIx: ChatInteraction = {
      type: 'command',
      id: '1',
      clientEventId: 'c1',
      user: { platform: 'discord', accountId: 'user-1', displayName: 'Player' },
      channelId: 'ch',
      name: 'roll',
      options: {
        foundation: 'Authority',
        skill: 'Command',
        tier: 8,
        exertion: 0,
      },
    };
    await handleInteraction(ctx, rollIx);
    expect(port.replies.length).toBe(1);
    expect(port.replies[0]!.title).toMatch(/^Ready ·/);
    expect(port.replies[0]!.selects?.[0]?.options).toHaveLength(9);
    const castId = port.replies[0]!.buttons?.find((b) => b.id.startsWith('roll-cast:'))?.id;
    expect(castId).toBeTruthy();
    await handleInteraction(ctx, {
      type: 'button',
      id: '1b',
      clientEventId: 'c1b',
      user: { platform: 'discord', accountId: 'user-1', displayName: 'Player' },
      channelId: 'ch',
      customId: castId!,
    });
    expect(port.cards.length).toBe(1);
    expect(port.cards[0]!.title).toBe('Leifr Ketilsson');
    expect(port.cards[0]!.fields?.[0]?.name).toBe('Marks');
    expect(port.ephemerals.some((e) => e.includes('Marks'))).toBe(true);
    store.close();
  });

  it('allows Foundation change on confirm before Cast', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'kod-bot-'));
    dirs.push(dir);
    const store = openSqliteStore(join(dir, 'c.sqlite'));
    seedDemoCampaign(store);
    mapMember(store, {
      platform: 'discord',
      accountId: 'user-1',
      characterSlug: 'leifr',
      role: 'player',
    });
    const port = mockPort();
    const ctx: BotContext = {
      store,
      port,
      liveBaseUrl: 'http://127.0.0.1:8742',
      prompts: new Map(),
      log: () => {},
    };
    await handleInteraction(ctx, {
      type: 'command',
      id: 'f1',
      clientEventId: 'cf1',
      user: { platform: 'discord', accountId: 'user-1' },
      channelId: 'ch',
      name: 'roll',
      options: { skill: 'Command' },
    });
    const foundId = port.replies[0]!.selects?.[0]?.id;
    expect(foundId?.startsWith('roll-found:')).toBe(true);
    await handleInteraction(ctx, {
      type: 'select',
      id: 'f2',
      clientEventId: 'cf2',
      user: { platform: 'discord', accountId: 'user-1' },
      channelId: 'ch',
      customId: foundId!,
      values: ['Guile'],
    });
    expect(port.replies.at(-1)?.fields?.find((f) => f.name === 'Foundation')?.value).toBe('Guile');
    store.close();
  });

  it('create starts a draft with sheet URL', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'kod-bot-'));
    dirs.push(dir);
    const store = openSqliteStore(join(dir, 'c.sqlite'));
    seedDemoCampaign(store);
    const port = mockPort();
    const ctx: BotContext = {
      store,
      port,
      liveBaseUrl: 'http://127.0.0.1:8742',
      prompts: new Map(),
      log: () => {},
    };
    await handleInteraction(ctx, {
      type: 'command',
      id: '2',
      clientEventId: 'c2',
      user: { platform: 'discord', accountId: 'new-p', displayName: 'Mara' },
      channelId: 'ch',
      name: 'create',
      options: { name: 'Mara Reed' },
    });
    expect(port.ephemerals.some((e) => e.includes('Draft'))).toBe(true);
    expect(port.ephemerals.some((e) => e.includes('/characters/'))).toBe(true);
    expect(port.cards.some((c) => c.title === 'Character draft')).toBe(true);
    const drafts = store.listCharacters().filter((c) => c.status === 'draft');
    expect(drafts.some((d) => d.initiator?.accountId === 'new-p')).toBe(true);
    store.close();
  });

  it('rejects unknown legacy kod-* command names', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'kod-bot-'));
    dirs.push(dir);
    const store = openSqliteStore(join(dir, 'c.sqlite'));
    seedDemoCampaign(store);
    const port = mockPort();
    const ctx: BotContext = {
      store,
      port,
      liveBaseUrl: 'http://127.0.0.1:8742',
      prompts: new Map(),
      log: () => {},
    };
    await handleInteraction(ctx, {
      type: 'command',
      id: '3',
      clientEventId: 'c3',
      user: { platform: 'discord', accountId: 'user-1', displayName: 'P' },
      channelId: 'ch',
      name: 'kod-roll',
      options: { foundation: 'Authority', skill: 'Command' },
    });
    expect(port.cards).toHaveLength(0);
    expect(port.ephemerals.some((e) => /unknown command/i.test(e))).toBe(true);
    store.close();
  });

  it('/live includes a signed Storyteller desk URL for the ST', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'kod-bot-'));
    dirs.push(dir);
    const store = openSqliteStore(join(dir, 'c.sqlite'));
    seedDemoCampaign(store);
    mapMember(store, {
      platform: 'discord',
      accountId: 'st-1',
      characterSlug: 'torvald',
      role: 'storyteller',
    });
    const prev = process.env.KODRANNI_SHEET_TOKEN_SECRET;
    process.env.KODRANNI_SHEET_TOKEN_SECRET = 'test-sheet-secret-do-not-use-in-prod';
    const port = mockPort();
    const ctx: BotContext = {
      store,
      port,
      liveBaseUrl: 'http://127.0.0.1:8742',
      prompts: new Map(),
      log: () => {},
    };
    await handleInteraction(ctx, {
      type: 'command',
      id: '4',
      clientEventId: 'c4',
      user: { platform: 'discord', accountId: 'st-1', displayName: 'ST' },
      channelId: 'ch',
      name: 'live',
      options: {},
    });
    expect(sheetTokenSecret()).toBeTruthy();
    expect(port.ephemerals.some((e) => e.includes('/community/setup/'))).toBe(true);
    expect(port.ephemerals.some((e) => e.includes('edit='))).toBe(true);
    if (prev === undefined) delete process.env.KODRANNI_SHEET_TOKEN_SECRET;
    else process.env.KODRANNI_SHEET_TOKEN_SECRET = prev;
    store.close();
  });

  it('/roll without a skill opens the Archetype picker', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'kod-bot-'));
    dirs.push(dir);
    const store = openSqliteStore(join(dir, 'c.sqlite'));
    seedDemoCampaign(store);
    mapMember(store, {
      platform: 'discord',
      accountId: 'user-1',
      characterSlug: 'leifr',
      role: 'player',
    });
    const port = mockPort();
    const ctx: BotContext = {
      store,
      port,
      liveBaseUrl: 'http://127.0.0.1:8742',
      prompts: new Map(),
      log: () => {},
    };
    await handleInteraction(ctx, {
      type: 'command',
      id: 'arch1',
      clientEventId: 'arch1',
      user: { platform: 'discord', accountId: 'user-1', displayName: 'Player' },
      channelId: 'ch',
      name: 'roll',
      options: {},
    });
    expect(port.replies[0]?.title).toMatch(/^Archetype ·/);
    expect(port.replies[0]?.description).not.toMatch(/Forgot/i);
    store.close();
  });

  it('posts the Marks card to the play channel when the interaction has no channel', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'kod-bot-'));
    dirs.push(dir);
    const store = openSqliteStore(join(dir, 'c.sqlite'));
    seedDemoCampaign(store);
    mapMember(store, {
      platform: 'discord',
      accountId: 'user-1',
      characterSlug: 'leifr',
      role: 'player',
    });
    const prev = process.env.DISCORD_PLAY_CHANNEL_ID;
    process.env.DISCORD_PLAY_CHANNEL_ID = 'play-ch';
    const dests: string[] = [];
    const port = mockPort();
    const inner = port.sendCard.bind(port);
    port.sendCard = async (ch, card) => {
      dests.push(ch);
      return inner(ch, card);
    };
    const ctx: BotContext = {
      store,
      port,
      liveBaseUrl: 'http://127.0.0.1:8742',
      prompts: new Map(),
      log: () => {},
    };
    await handleInteraction(ctx, {
      type: 'command',
      id: 'roll-empty-ch',
      clientEventId: 'rec1',
      user: { platform: 'discord', accountId: 'user-1', displayName: 'Player' },
      channelId: '',
      name: 'roll',
      options: { foundation: 'Authority', skill: 'Command', tier: 8, exertion: 0 },
    });
    const castId = port.replies[0]!.buttons?.find((b) => b.id.startsWith('roll-cast:'))?.id;
    expect(castId).toBeTruthy();
    await handleInteraction(ctx, {
      type: 'button',
      id: 'roll-empty-ch-b',
      clientEventId: 'rec1b',
      user: { platform: 'discord', accountId: 'user-1', displayName: 'Player' },
      channelId: '',
      customId: castId!,
    });
    expect(dests).toEqual(['play-ch']);
    expect(port.cards[0]?.fields?.[0]?.name).toBe('Marks');
    if (prev === undefined) delete process.env.DISCORD_PLAY_CHANNEL_ID;
    else process.env.DISCORD_PLAY_CHANNEL_ID = prev;
    store.close();
  });

  it('ST /reclaim restores Exertion and posts to the table', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'kod-bot-'));
    dirs.push(dir);
    const store = openSqliteStore(join(dir, 'c.sqlite'));
    seedDemoCampaign(store);
    mapMember(store, {
      platform: 'discord',
      accountId: 'st-1',
      characterSlug: 'torvald',
      role: 'storyteller',
    });
    const port = mockPort();
    const ctx: BotContext = {
      store,
      port,
      liveBaseUrl: 'http://127.0.0.1:8742',
      prompts: new Map(),
      log: () => {},
    };
    await handleInteraction(ctx, {
      type: 'command',
      id: 'reclaim1',
      clientEventId: 'rc1',
      user: { platform: 'discord', accountId: 'st-1', displayName: 'ST' },
      channelId: 'ch',
      name: 'reclaim',
      options: { character: 'leifr', points: 1 },
    });
    expect(port.cards[0]?.title).toMatch(/Exertion restored/);
    expect(port.ephemerals.some((e) => e.includes('Posted to the table'))).toBe(true);
    store.close();
  });

  it('announces each pending review once until it leaves the queue', () => {
    const announced = new Set<string>();
    expect(slugsNeedingReviewCard(['regis'], announced)).toEqual(['regis']);
    announced.add('regis');
    expect(slugsNeedingReviewCard(['regis'], announced)).toEqual([]);
    pruneAnnouncedReviews(['mara'], announced);
    expect(announced.has('regis')).toBe(false);
    expect(slugsNeedingReviewCard(['mara'], announced)).toEqual(['mara']);
  });
});
