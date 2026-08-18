import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { openSqliteStore, seedDemoCampaign } from '@kodranni/store';
import { mapMember } from '@kodranni/app';
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

function mockPort(): ChatPort & { cards: ChatCard[]; ephemerals: string[] } {
  const cards: ChatCard[] = [];
  const ephemerals: string[] = [];
  return {
    platform: 'discord',
    cards,
    ephemerals,
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
    expect(port.cards.length).toBe(1);
    expect(port.cards[0]!.title).toBe('Leifr Ketilsson');
    expect(port.ephemerals.some((e) => e.includes('Marks'))).toBe(true);
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

  it('legacy kod-roll alias still works', async () => {
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
      id: '3',
      clientEventId: 'c3',
      user: { platform: 'discord', accountId: 'user-1', displayName: 'P' },
      channelId: 'ch',
      name: 'kod-roll',
      options: { foundation: 'Authority', skill: 'Command' },
    });
    expect(port.cards[0]!.title).toBe('Leifr Ketilsson');
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
