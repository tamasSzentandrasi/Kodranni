import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { openSqliteStore, seedDemoCampaign } from '@kodranni/store';
import { confirmReturnToTable, grantWord, mapMember, openTide, startCreateFromBot } from '@kodranni/app';
import type { ChatCard, ChatInteraction, ChatMessageRef, ChatPort } from '@kodranni/chat-port';
import {
  handleInteraction,
  noticesForRestore,
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
    async replyEphemeralCard(_i, card) {
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
      characterSlug: 'jakov',
      role: 'player',
    });
    mapMember(store, {
      platform: 'discord',
      accountId: 'st-1',
      characterSlug: 'tomaso',
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
    const poolLine = port.replies[0]!.description?.match(/\*\*(.+?)\*\*/)?.[1];
    expect(poolLine).toBeTruthy();
    expect(port.replies[0]!.description).toContain('Ordinary');
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
    expect(port.cards[0]!.title).toMatch(/^Jakov Bracco rolled \d+ marks?$/);
    expect(port.cards[0]!.description).toContain('{{kod-die:');
    expect(port.cards[0]!.description).toContain('Authority');
    expect(port.cards[0]!.panels).toBeUndefined();
    expect(port.cards[0]!.fields?.find((f) => f.name === 'Pool')?.value).toBe(poolLine);
    expect(port.ephemerals.some((e) => e.includes('Marks'))).toBe(true);
    store.close();
  });

  it('lets a Storyteller roll a named sheet without claiming it', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'kod-bot-'));
    dirs.push(dir);
    const store = openSqliteStore(join(dir, 'c.sqlite'));
    seedDemoCampaign(store);
    mapMember(store, {
      platform: 'discord',
      accountId: 'user-1',
      characterSlug: 'jakov',
      role: 'player',
    });
    const port = mockPort();
    const ctx: BotContext = {
      store,
      port,
      liveBaseUrl: 'http://127.0.0.1:8742',
      prompts: new Map(),
      log: () => {},
      discordStorytellerRoleId: 'role-st',
    };
    const named: ChatInteraction = {
      type: 'command',
      id: 'st-roll',
      clientEventId: 'st-roll',
      user: {
        platform: 'discord',
        accountId: 'visitor',
        displayName: 'Storyteller',
        roleIds: ['role-st'],
      },
      channelId: 'ch',
      name: 'roll',
      options: { character: 'Marino Orvanti' },
    };
    await handleInteraction(ctx, named);
    expect(port.ephemerals.join('\n')).not.toContain('not bound');
    expect(port.replies[0]?.title).toBe('Ready · Marino Orvanti');
    const marino = store.getCharacterBySlug('marino');
    expect(marino?.player?.accountId).toBeUndefined();

    port.replies.length = 0;
    port.ephemerals.length = 0;
    await handleInteraction(ctx, {
      type: 'command',
      id: 'player-roll',
      clientEventId: 'player-roll',
      user: { platform: 'discord', accountId: 'user-1', displayName: 'Player' },
      channelId: 'ch',
      name: 'roll',
      options: { character: 'Marino Orvanti' },
    });
    expect(port.replies).toHaveLength(0);
    expect(port.ephemerals).toContain('That character is not bound to you.');
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
      characterSlug: 'jakov',
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

  it('treats the retired commands as unknown', async () => {
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
    for (const name of ['live', 'reclaim', 'focus', 'st-roll', 'map']) {
      await handleInteraction(ctx, {
        type: 'command',
        id: name,
        clientEventId: name,
        user: { platform: 'discord', accountId: 'user-1', displayName: 'P' },
        channelId: 'ch',
        name,
        options: { character: 'jakov', points: 1 },
      });
    }
    expect(port.cards).toHaveLength(0);
    expect(port.ephemerals.every((e) => /unknown command/i.test(e))).toBe(true);
    expect(port.ephemerals).toHaveLength(5);
    store.close();
  });

  it('/roll without a skill opens the Foundation picker', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'kod-bot-'));
    dirs.push(dir);
    const store = openSqliteStore(join(dir, 'c.sqlite'));
    seedDemoCampaign(store);
    mapMember(store, {
      platform: 'discord',
      accountId: 'user-1',
      characterSlug: 'jakov',
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
    expect(port.replies[0]?.title).toMatch(/^Ready ·/);
    const found = port.replies[0]?.selects?.find((s) => s.id.startsWith('roll-found:'));
    const arch = port.replies[0]?.selects?.find((s) => s.id.startsWith('roll-arch:'));
    const skill = port.replies[0]?.selects?.find((s) => s.id.startsWith('roll-skill:'));
    expect(found?.options).toHaveLength(9);
    expect(arch?.options[0]?.value).toBe('primitive');
    expect(skill?.options[0]?.value).toBe('wait');
    expect(port.replies[0]?.buttons?.some((b) => b.id.startsWith('roll-tier-cycle:'))).toBe(true);
    expect(port.replies[0]?.selects?.some((s) => s.id.startsWith('roll-tier:'))).toBe(false);
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
      characterSlug: 'jakov',
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
    expect(port.cards[0]?.title).toMatch(/rolled \d+ marks?$/);
    if (prev === undefined) delete process.env.DISCORD_PLAY_CHANNEL_ID;
    else process.env.DISCORD_PLAY_CHANNEL_ID = prev;
    store.close();
  });

  it('/select is unused for one living character and chooses among several', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'kod-bot-'));
    dirs.push(dir);
    const store = openSqliteStore(join(dir, 'c.sqlite'));
    seedDemoCampaign(store);
    mapMember(store, {
      platform: 'discord',
      accountId: 'user-1',
      characterSlug: 'jakov',
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
      id: 'sel-one',
      clientEventId: 'sel-one',
      user: { platform: 'discord', accountId: 'user-1', displayName: 'P' },
      channelId: 'ch',
      name: 'select',
      options: { character: 'Jakov Bracco' },
    });
    expect(port.ephemerals.at(-1)).toMatch(/Rolls use \*\*Jakov Bracco\*\*/);

    const caterina = store.getCharacterBySlug('caterina')!;
    caterina.player = { platform: 'discord', accountId: 'user-1', displayName: 'P' };
    store.putCharacter(caterina);
    await handleInteraction(ctx, {
      type: 'command',
      id: 'sel-two',
      clientEventId: 'sel-two',
      user: { platform: 'discord', accountId: 'user-1', displayName: 'P' },
      channelId: 'ch',
      name: 'select',
      options: { character: caterina.name },
    });
    expect(port.ephemerals.at(-1)).toContain(caterina.name);
    const focused = store.listMembers().find((m) => m.accountId === 'user-1');
    expect(focused?.focusedCharacterId).toBe(caterina.id);
    store.close();
  });

  it('/npc-roll names the Omen and writes no harm track', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'kod-bot-'));
    dirs.push(dir);
    const store = openSqliteStore(join(dir, 'c.sqlite'));
    seedDemoCampaign(store);
    mapMember(store, {
      platform: 'discord',
      accountId: 'st-1',
      characterSlug: 'tomaso',
      role: 'storyteller',
    });
    const before = JSON.stringify(store.getCharacterBySlug('jakov')!.harm);
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
      id: 'npc1',
      clientEventId: 'npc1',
      user: { platform: 'discord', accountId: 'st-1', displayName: 'ST' },
      channelId: 'ch',
      name: 'npc-roll',
      options: { foundation: 2, skill: 1, label: 'The miller', tier: 8 },
    });
    expect(port.cards[0]?.title).toMatch(/^The miller rolled \d+ marks?$/);
    expect(port.cards[0]?.fields?.some((f) => f.name === 'Omen')).toBe(true);
    expect(port.cards[0]?.description).toContain('{{kod-die:d8}}');
    expect(port.cards[0]?.thumbnailUrl).toBeUndefined();
    expect(JSON.stringify(store.getCharacterBySlug('jakov')!.harm)).toBe(before);
    store.close();
  });

  it('/award-word is public, names the player, and refuses anyone else', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'kod-bot-'));
    dirs.push(dir);
    const store = openSqliteStore(join(dir, 'c.sqlite'));
    seedDemoCampaign(store);
    const jakov = store.getCharacterBySlug('jakov')!;
    const before = jakov.creation?.words ?? 0;
    jakov.player = { platform: 'discord', accountId: 'player-9', displayName: 'Mara' };
    store.putCharacter(jakov);
    const port = mockPort();
    const ctx: BotContext = {
      store,
      port,
      liveBaseUrl: 'http://127.0.0.1:8742',
      prompts: new Map(),
      log: () => {},
      discordStorytellerRoleId: 'role-st',
    };
    await handleInteraction(ctx, {
      type: 'command',
      id: 'word-no',
      clientEventId: 'word-no',
      user: { platform: 'discord', accountId: 'player-9', displayName: 'Mara', roleIds: [] },
      channelId: 'ch',
      name: 'award-word',
      options: {},
    });
    expect(port.cards).toHaveLength(0);
    expect(port.ephemerals.at(-1)).toMatch(/Storyteller only/);
    expect(store.getCharacterBySlug('jakov')!.creation?.words ?? 0).toBe(before);

    await handleInteraction(ctx, {
      type: 'command',
      id: 'word-none',
      clientEventId: 'word-none',
      user: {
        platform: 'discord',
        accountId: 'st-9',
        displayName: 'ST',
        roleIds: ['role-st'],
      },
      channelId: 'ch',
      name: 'award-word',
      options: {},
    });
    expect(port.cards).toHaveLength(0);
    expect(port.ephemerals.at(-1)).toMatch(/Name the character/);
    expect(store.getCharacterBySlug('jakov')!.creation?.words ?? 0).toBe(before);

    await handleInteraction(ctx, {
      type: 'command',
      id: 'word-yes',
      clientEventId: 'word-yes',
      user: {
        platform: 'discord',
        accountId: 'st-9',
        displayName: 'ST',
        roleIds: ['role-st'],
      },
      channelId: 'ch',
      name: 'award-word',
      options: { character: 'Jakov Bracco' },
    });
    expect(port.cards[0]?.description).toContain('<@player-9>');
    expect(port.cards[0]?.description).toContain('Jakov');
    expect(port.ephemerals.at(-1)).toMatch(/Awarded/);
    expect(store.getCharacterBySlug('jakov')!.creation?.words).toBe(before + 1);
    store.close();
  });

  it('/guiding-hand uses the typer’s active character', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'kod-bot-'));
    dirs.push(dir);
    const store = openSqliteStore(join(dir, 'c.sqlite'));
    seedDemoCampaign(store);
    const jakov = store.getCharacterBySlug('jakov')!;
    jakov.status = 'draft';
    jakov.player = { platform: 'discord', accountId: 'player-9', displayName: 'Mara' };
    jakov.creation = {
      foundationPoints: 0,
      skillPoints: 0,
      words: 0,
      birthOmenGranted: false,
      guidingHandGranted: false,
      locked: false,
    };
    store.putCharacter(jakov);
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
      id: 'hand-1',
      clientEventId: 'hand-1',
      user: { platform: 'discord', accountId: 'player-9', displayName: 'Mara' },
      channelId: 'ch',
      name: 'guiding-hand',
      options: { face: 10 },
    });
    expect(port.ephemerals.at(-1)).toMatch(/Guiding Hand for \*\*Jakov Bracco\*\*/);
    expect(store.getCharacterBySlug('jakov')!.creation?.guidingHandGranted).toBe(true);
    expect(store.getCharacterBySlug('jakov')!.creation?.skillPoints).toBeGreaterThan(0);
    store.close();
  });

  it('/birth-omen uses the typer’s active character', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'kod-bot-'));
    dirs.push(dir);
    const store = openSqliteStore(join(dir, 'c.sqlite'));
    seedDemoCampaign(store);
    const jakov = store.getCharacterBySlug('jakov')!;
    jakov.status = 'draft';
    jakov.player = { platform: 'discord', accountId: 'player-9', displayName: 'Mara' };
    jakov.creation = {
      foundationPoints: 0,
      skillPoints: 0,
      words: 0,
      birthOmenGranted: false,
      guidingHandGranted: false,
      locked: false,
    };
    store.putCharacter(jakov);
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
      id: 'omen-1',
      clientEventId: 'omen-1',
      user: { platform: 'discord', accountId: 'player-9', displayName: 'Mara' },
      channelId: 'ch',
      name: 'birth-omen',
      options: { face: 11 },
    });
    expect(port.ephemerals.at(-1)).toMatch(/Birth Omen for \*\*Jakov Bracco\*\*/);
    expect(store.getCharacterBySlug('jakov')!.creation?.birthOmenGranted).toBe(true);
    expect(store.getCharacterBySlug('jakov')!.creation?.foundationPoints).toBe(6);
    store.close();
  });

  it('lets a Storyteller roll a sheeted person by name', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'kod-bot-'));
    dirs.push(dir);
    const store = openSqliteStore(join(dir, 'c.sqlite'));
    seedDemoCampaign(store);
    mapMember(store, {
      platform: 'discord',
      accountId: 'st-1',
      characterSlug: 'tomaso',
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
      id: 'st-name',
      clientEventId: 'st-name',
      user: { platform: 'discord', accountId: 'st-1', displayName: 'ST' },
      channelId: 'ch',
      name: 'roll',
      options: {
        character: 'Jakov Bracco',
        foundation: 'Authority',
        skill: 'Command',
        tier: 8,
        exertion: 0,
      },
    });
    expect(port.replies[0]?.title).toBe('Ready · Jakov Bracco');
    store.close();
  });

  it('offers Exertion 0 or 1, and 2 only when an Echo is named', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'kod-bot-'));
    dirs.push(dir);
    const store = openSqliteStore(join(dir, 'c.sqlite'));
    seedDemoCampaign(store);
    mapMember(store, {
      platform: 'discord',
      accountId: 'user-1',
      characterSlug: 'jakov',
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
      id: 'ex-tog',
      clientEventId: 'ex-tog',
      user: { platform: 'discord', accountId: 'user-1', displayName: 'P' },
      channelId: 'ch',
      name: 'roll',
      options: { foundation: 'Authority', skill: 'Command', tier: 8 },
    });
    const exert = port.replies[0]!.buttons?.find((b) => b.id.startsWith('roll-exert:'));
    expect(exert?.label).toBe('Exertion · 0');
    expect(port.replies[0]!.buttons?.some((b) => b.id.startsWith('roll-tier-cycle:'))).toBe(true);
    expect(port.replies[0]!.buttons?.some((b) => b.id.startsWith('roll-spend:'))).toBe(false);
    await handleInteraction(ctx, {
      type: 'button',
      id: 'ex-on',
      clientEventId: 'ex-on',
      user: { platform: 'discord', accountId: 'user-1' },
      channelId: 'ch',
      customId: exert!.id,
    });
    expect(port.replies.at(-1)?.description).toContain('**');
    expect(port.replies.at(-1)?.buttons?.find((b) => b.id.startsWith('roll-exert:'))?.label).toBe(
      'Exertion · 1',
    );
    const echo = port.replies.at(-1)?.selects?.find((s) => s.id.startsWith('roll-echo:'));
    const titled = echo?.options.find((o) => o.value !== 'none');
    if (titled) {
      await handleInteraction(ctx, {
        type: 'select',
        id: 'ex-echo',
        clientEventId: 'ex-echo',
        user: { platform: 'discord', accountId: 'user-1' },
        channelId: 'ch',
        customId: echo!.id,
        values: [titled.value],
      });
      expect(port.replies.at(-1)?.buttons?.some((b) => b.id.startsWith('roll-tier-cycle:'))).toBe(true);
      if ((store.getCharacterBySlug('jakov')?.exertion.current ?? 0) >= 2) {
        const stepped = port.replies.at(-1)?.buttons?.find((b) => b.id.startsWith('roll-exert:'));
        await handleInteraction(ctx, {
          type: 'button',
          id: 'ex-extra',
          clientEventId: 'ex-extra',
          user: { platform: 'discord', accountId: 'user-1' },
          channelId: 'ch',
          customId: stepped!.id,
        });
        expect(port.replies.at(-1)?.buttons?.find((b) => b.id.startsWith('roll-exert:'))?.label).toBe(
          'Exertion · 2',
        );
      }
    }
    store.close();
  });

  it('requires a named Echo for the second Exertion die', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'kod-bot-'));
    dirs.push(dir);
    const store = openSqliteStore(join(dir, 'c.sqlite'));
    seedDemoCampaign(store);
    mapMember(store, {
      platform: 'discord',
      accountId: 'user-1',
      characterSlug: 'jakov',
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
      id: 'ex2',
      clientEventId: 'ex2',
      user: { platform: 'discord', accountId: 'user-1', displayName: 'P' },
      channelId: 'ch',
      name: 'roll',
      options: { foundation: 'Authority', skill: 'Command', tier: 8, exertion: 2 },
    });
    expect(port.replies[0]?.description).toMatch(/named Echo/i);
    const castId = port.replies[0]!.buttons?.find((b) => b.id.startsWith('roll-cast:'))?.id;
    await handleInteraction(ctx, {
      type: 'button',
      id: 'ex2b',
      clientEventId: 'ex2b',
      user: { platform: 'discord', accountId: 'user-1', displayName: 'P' },
      channelId: 'ch',
      customId: castId!,
    });
    expect(port.ephemerals.some((e) => /named Echo/i.test(e))).toBe(true);
    expect(port.cards).toHaveLength(0);
    store.close();
  });

  it('Oppose opens a Ready card tied to that roll, and Undo restores the spend', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'kod-bot-'));
    dirs.push(dir);
    const store = openSqliteStore(join(dir, 'c.sqlite'));
    seedDemoCampaign(store);
    mapMember(store, {
      platform: 'discord',
      accountId: 'user-1',
      characterSlug: 'jakov',
      role: 'player',
    });
    mapMember(store, {
      platform: 'discord',
      accountId: 'user-2',
      characterSlug: 'caterina',
      role: 'player',
    });
    mapMember(store, {
      platform: 'discord',
      accountId: 'st-1',
      characterSlug: 'tomaso',
      role: 'storyteller',
    });
    const before = store.getCharacterBySlug('jakov')!.exertion.current;
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
      id: 'op-roll',
      clientEventId: 'op-roll',
      user: { platform: 'discord', accountId: 'user-1', displayName: 'P' },
      channelId: 'ch',
      name: 'roll',
      options: { foundation: 'Authority', skill: 'Command', tier: 8, exertion: 1 },
    });
    const castId = port.replies[0]!.buttons?.find((b) => b.id.startsWith('roll-cast:'))?.id;
    await handleInteraction(ctx, {
      type: 'button',
      id: 'op-cast',
      clientEventId: 'op-cast',
      user: { platform: 'discord', accountId: 'user-1', displayName: 'P' },
      channelId: 'ch',
      customId: castId!,
    });
    expect(store.getCharacterBySlug('jakov')!.exertion.current).toBe(before - 1);
    const rollId = port.cards[0]!.buttons?.find((b) => b.id.startsWith('undo:'))?.id.slice(5);
    expect(rollId).toBeTruthy();

    const publicCards = port.cards.length;
    await handleInteraction(ctx, {
      type: 'button',
      id: 'op-btn',
      clientEventId: 'op-btn',
      user: { platform: 'discord', accountId: 'user-2', displayName: 'C' },
      channelId: 'ch',
      customId: `oppose:${rollId}`,
    });
    expect(port.cards).toHaveLength(publicCards);
    expect(port.replies.at(-1)?.title).toMatch(/^Ready ·/);
    expect(port.replies.at(-1)?.footer).toMatch(/Only you see this/);
    const found = port.replies.at(-1)?.selects?.find((s) => s.id.startsWith('roll-found:'));
    await handleInteraction(ctx, {
      type: 'select',
      id: 'op-found',
      clientEventId: 'op-found',
      user: { platform: 'discord', accountId: 'user-2', displayName: 'C' },
      channelId: 'ch',
      customId: found!.id,
      values: ['Guile'],
    });
    expect(port.replies.at(-1)?.title).toMatch(/^Ready ·/);
    const arch = port.replies.at(-1)?.selects?.find((s) => s.id.startsWith('roll-arch:'));
    expect(arch?.options[0]?.value).toBe('primitive');
    await handleInteraction(ctx, {
      type: 'select',
      id: 'op-arch',
      clientEventId: 'op-arch',
      user: { platform: 'discord', accountId: 'user-2', displayName: 'C' },
      channelId: 'ch',
      customId: arch!.id,
      values: ['warrior'],
    });
    const skill = port.replies.at(-1)?.selects?.find((s) => s.id.startsWith('roll-skill:'));
    expect(skill?.options[0]?.value).not.toBe('wait');
    expect(skill?.options[0]?.value).not.toBe('primitive');
    await handleInteraction(ctx, {
      type: 'select',
      id: 'op-skill',
      clientEventId: 'op-skill',
      user: { platform: 'discord', accountId: 'user-2', displayName: 'C' },
      channelId: 'ch',
      customId: skill!.id,
      values: [skill!.options[0]!.value],
    });
    expect(port.replies.at(-1)?.title).toMatch(/^Ready ·/);
    expect(port.replies.at(-1)?.fields?.find((f) => f.name === 'Foundation')?.value).toBe('Guile');
    const opposeCast = port.replies.at(-1)?.buttons?.find((b) => b.id.startsWith('roll-cast:'))?.id;
    await handleInteraction(ctx, {
      type: 'button',
      id: 'op-cast2',
      clientEventId: 'op-cast2',
      user: { platform: 'discord', accountId: 'user-2', displayName: 'C' },
      channelId: 'ch',
      customId: opposeCast!,
    });
    const opposeRollId = port.cards.at(-1)?.buttons?.find((b) => b.id.startsWith('undo:'))?.id.slice(5);
    expect(store.getRoll(opposeRollId!)?.parentRollId).toBe(rollId);

    await handleInteraction(ctx, {
      type: 'button',
      id: 'undo1',
      clientEventId: 'undo1',
      user: { platform: 'discord', accountId: 'st-1', displayName: 'ST' },
      channelId: 'ch',
      customId: `undo:${rollId}`,
    });
    expect(store.getCharacterBySlug('jakov')!.exertion.current).toBe(before);
    await handleInteraction(ctx, {
      type: 'button',
      id: 'undo2',
      clientEventId: 'undo2',
      user: { platform: 'discord', accountId: 'st-1', displayName: 'ST' },
      channelId: 'ch',
      customId: `undo:${rollId}`,
    });
    expect(port.ephemerals.some((e) => /already undone/i.test(e))).toBe(true);
    store.close();
  });

  it('assigns Harm from a track select', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'kod-bot-'));
    dirs.push(dir);
    const store = openSqliteStore(join(dir, 'c.sqlite'));
    seedDemoCampaign(store);
    mapMember(store, {
      platform: 'discord',
      accountId: 'st-1',
      characterSlug: 'tomaso',
      role: 'storyteller',
    });
    const jakov = store.getCharacterBySlug('jakov')!;
    store.insertRoll({
      id: 'harm-roll',
      ts: new Date().toISOString(),
      characterId: jakov.id,
      data: { characterSlug: 'jakov', marks: 0, failures: 9, kind: 'unopposed' },
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
      type: 'button',
      id: 'harm-open',
      clientEventId: 'harm-open',
      user: { platform: 'discord', accountId: 'st-1', displayName: 'ST' },
      channelId: 'ch',
      customId: 'st-harm:harm-roll',
    });
    const card = port.cards[0]!;
    expect(card.selects?.[0]?.options.length).toBeGreaterThan(0);
    expect(card.buttons?.map((b) => b.label)).toEqual(['Cancel']);
    await handleInteraction(ctx, {
      type: 'select',
      id: 'harm-pick',
      clientEventId: 'harm-pick',
      user: { platform: 'discord', accountId: 'st-1', displayName: 'ST' },
      channelId: 'ch',
      customId: card.selects![0]!.id,
      values: [card.selects![0]!.options[0]!.value],
    });
    expect(store.getCharacterBySlug('jakov')!.harm[card.selects![0]!.options[0]!.value]).toBeGreaterThan(0);
    store.close();
  });

  it('/review reposts a notice and no signed sheet link', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'kod-bot-'));
    dirs.push(dir);
    const store = openSqliteStore(join(dir, 'c.sqlite'));
    seedDemoCampaign(store);
    mapMember(store, {
      platform: 'discord',
      accountId: 'st-1',
      characterSlug: 'tomaso',
      role: 'storyteller',
    });
    const { character } = startCreateFromBot(store, {
      platform: 'discord',
      accountId: 'user-9',
      displayName: 'Nine',
      name: 'Nia Quinn',
    });
    confirmReturnToTable(store, { characterSlug: character.slug });
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
      id: 'rev1',
      clientEventId: 'rev1',
      user: { platform: 'discord', accountId: 'st-1', displayName: 'ST' },
      channelId: 'ch',
      name: 'review',
      options: {},
    });
    const text = JSON.stringify(port.cards[0]);
    expect(text).toContain('Nia Quinn');
    expect(text).toContain('was submitted for approval');
    expect(text).not.toContain('Session inbox');
    expect(text).not.toContain('edit=');
    expect(text).not.toContain('http');
    expect(port.cards[0]?.links).toBeUndefined();
    expect(port.cards[0]?.buttons).toBeUndefined();
    store.close();
  });

  it('writes a Restore notice only for a bound account', () => {
    const notes = noticesForRestore(
      [
        { characterSlug: 'jakov', name: 'Jakov Bracco', foodDays: 1, exertion: 4 },
        { characterSlug: 'caterina', name: 'Caterina', waterDays: 0 },
      ],
      [{ slug: 'jakov', accountId: 'user-1' }, { slug: 'caterina' }],
    );
    expect(notes).toEqual([
      {
        accountId: 'user-1',
        text: 'Rest for **Jakov Bracco**: food is now 1 days; Exertion is now 4.',
      },
    ]);
    expect(noticesForRestore([{ characterSlug: 'caterina', name: 'Caterina', foodDays: 1 }], [])).toEqual(
      [],
    );
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

  it('stages a Wanting from the draft card and does not spend it', async () => {
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
      id: 'cr1',
      clientEventId: 'cr1',
      user: { platform: 'discord', accountId: 'maker', displayName: 'Maker' },
      channelId: 'ch',
      name: 'create',
      options: { name: 'Nela Quinn' },
    });
    const wanting = port.cards[0]?.buttons?.find((b) => b.id.startsWith('wanting:'));
    expect(wanting?.label).toBe('The Wanting');
    const slug = wanting!.id.slice('wanting:'.length);
    grantWord(store, { characterSlug: slug, actor: 'maker' });
    const foundations = { ...store.getCharacterBySlug(slug)!.foundations };
    await handleInteraction(ctx, {
      type: 'button',
      id: 'w1',
      clientEventId: 'w1',
      user: { platform: 'discord', accountId: 'maker' },
      channelId: 'ch',
      customId: wanting!.id,
    });
    expect(port.replies.at(-1)?.selects?.[0]?.options).toHaveLength(4);
    await handleInteraction(ctx, {
      type: 'select',
      id: 'w2',
      clientEventId: 'w2',
      user: { platform: 'discord', accountId: 'maker' },
      channelId: 'ch',
      customId: `wanting-menu:${slug}`,
      values: ['plus_one_foundation'],
    });
    const staged = store.getCharacterBySlug(slug)!;
    expect(staged.creation?.pendingWanting).toBe('plus_one_foundation');
    expect(staged.creation?.words).toBe(1);
    expect(staged.foundations).toEqual(foundations);
    expect(port.ephemerals.at(-1)).toMatch(/named on the sheet/);
    store.close();
  });

  it('closes the Tide from the channel card without a second edit', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'kod-bot-'));
    dirs.push(dir);
    const store = openSqliteStore(join(dir, 'c.sqlite'));
    seedDemoCampaign(store);
    mapMember(store, {
      platform: 'discord',
      accountId: 'st-1',
      characterSlug: 'tomaso',
      role: 'storyteller',
    });
    openTide(store, {
      size: 'skirmish',
      footing: 'equal',
      sideA: 'Mill',
      sideB: 'Palace',
      dyeA: '#a01818',
      dyeB: '#3a5c6c',
    });
    const port = mockPort();
    const edits: ChatCard[] = [];
    port.editCard = async (_ref, card) => {
      edits.push(card);
    };
    const ctx: BotContext = {
      store,
      port,
      liveBaseUrl: 'http://127.0.0.1:8742',
      prompts: new Map(),
      log: () => {},
    };
    await handleInteraction(ctx, {
      type: 'button',
      id: 'tc1',
      clientEventId: 'tc1',
      user: { platform: 'discord', accountId: 'st-1', displayName: 'ST' },
      channelId: 'ch',
      customId: 'tide-close',
    });
    expect(store.getTableState().tide).toBeNull();
    expect(port.replies.at(-1)?.description).toMatch(/^Closed\./);
    expect(port.replies.at(-1)?.buttons).toBeUndefined();
    expect(edits).toHaveLength(0);
    store.close();
  });

  it('pairs two Tide Rolls and leaves the marker until the answer', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'kod-bot-'));
    dirs.push(dir);
    const store = openSqliteStore(join(dir, 'c.sqlite'));
    seedDemoCampaign(store);
    mapMember(store, {
      platform: 'discord',
      accountId: 'user-1',
      characterSlug: 'jakov',
      role: 'player',
    });
    mapMember(store, {
      platform: 'discord',
      accountId: 'user-2',
      characterSlug: 'caterina',
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
      type: 'button',
      id: 'tr-none',
      clientEventId: 'tr-none',
      user: { platform: 'discord', accountId: 'user-1', displayName: 'P' },
      channelId: 'ch',
      customId: 'tide-roll',
    });
    expect(port.ephemerals.at(-1)).toMatch(/No Tide is open/);
    openTide(store, {
      size: 'skirmish',
      footing: 'equal',
      sideA: 'Mill',
      sideB: 'Palace',
      dyeA: '#a01818',
      dyeB: '#3a5c6c',
    });
    const start = store.getTableState().tide?.position;

    async function castOnTide(accountId: string, prefix: string) {
      const user = { platform: 'discord' as const, accountId, displayName: accountId };
      await handleInteraction(ctx, {
        type: 'button',
        id: prefix,
        clientEventId: prefix,
        user,
        channelId: 'ch',
        customId: 'tide-roll',
      });
      const found = port.replies.at(-1)?.selects?.find((s) => s.id.startsWith('roll-found:'));
      await handleInteraction(ctx, {
        type: 'select',
        id: `${prefix}-f`,
        clientEventId: `${prefix}-f`,
        user,
        channelId: 'ch',
        customId: found!.id,
        values: ['Guile'],
      });
      const arch = port.replies.at(-1)?.selects?.find((s) => s.id.startsWith('roll-arch:'));
      await handleInteraction(ctx, {
        type: 'select',
        id: `${prefix}-a`,
        clientEventId: `${prefix}-a`,
        user,
        channelId: 'ch',
        customId: arch!.id,
        values: ['warrior'],
      });
      const skill = port.replies.at(-1)?.selects?.find((s) => s.id.startsWith('roll-skill:'));
      await handleInteraction(ctx, {
        type: 'select',
        id: `${prefix}-s`,
        clientEventId: `${prefix}-s`,
        user,
        channelId: 'ch',
        customId: skill!.id,
        values: [skill!.options.find((o) => o.value !== 'wait' && o.value !== 'primitive')!.value],
      });
      const castId = port.replies.at(-1)?.buttons?.find((b) => b.id.startsWith('roll-cast:'))?.id;
      await handleInteraction(ctx, {
        type: 'button',
        id: `${prefix}-c`,
        clientEventId: `${prefix}-c`,
        user,
        channelId: 'ch',
        customId: castId!,
      });
    }

    await castOnTide('user-1', 'tr1');
    expect(store.getTableState().tide?.position).toBe(start);
    expect(store.getTableState().tide?.openRollId).toBeTruthy();
    expect(port.cards.at(-1)?.description).toContain('The other side answers with Roll.');
    await castOnTide('user-2', 'tr2');
    expect(store.getTableState().tide?.openRollId).toBeUndefined();
    expect(store.getTableState().tide).not.toBeNull();
    expect(port.cards.at(-1)?.description).toContain('This answer moves the marker.');
    store.close();
  });
});
