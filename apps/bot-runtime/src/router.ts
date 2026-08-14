import { randomUUID } from 'node:crypto';
import type { ChatInteraction, ChatPort } from '@kodranni/chat-port';
import {
  applyHarm,
  executePlayerRoll,
  executeStorytellerNpcRoll,
  mapMember,
  previewHarm,
  reclaimExertion,
  resolveCharacterByAccount,
  resolveRoleByAccount,
} from '@kodranni/app';
import {
  buildHarmAssignCard,
  buildRollPromptCard,
  buildRollResultCard,
} from '@kodranni/chat-ui';
import type { CommunityStorePort } from '@kodranni/store';
import type { DieTier } from '@kodranni/domain';

export interface RollPrompt {
  id: string;
  foundation: string;
  skill?: string;
  dieTier: DieTier;
  characterSlug?: string;
  stAccountId: string;
  channelId: string;
}

export interface BotContext {
  store: CommunityStorePort;
  port: ChatPort;
  liveBaseUrl: string;
  archiveBaseUrl?: string;
  prompts: Map<string, RollPrompt>;
  log: (line: string) => void;
}

function sheetUrl(base: string, slug: string): string {
  return `${base.replace(/\/$/, '')}/characters/${slug}/`;
}

function isSt(ctx: BotContext, accountId: string): boolean {
  return resolveRoleByAccount(ctx.store, 'discord', accountId) === 'storyteller';
}

export async function handleInteraction(
  ctx: BotContext,
  i: ChatInteraction,
): Promise<void> {
  try {
    if (i.type === 'command') {
      await handleCommand(ctx, i);
      return;
    }
    if (i.type === 'button') {
      await handleButton(ctx, i);
      return;
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    ctx.log(`error: ${msg}`);
    await ctx.port.replyEphemeral(i, msg.slice(0, 500));
  }
}

async function handleCommand(
  ctx: BotContext,
  i: Extract<ChatInteraction, { type: 'command' }>,
): Promise<void> {
  const { name, options, user, channelId } = i;

  if (name === 'kod-live') {
    const live = ctx.liveBaseUrl;
    const arch = ctx.archiveBaseUrl;
    await ctx.port.replyEphemeral(
      i,
      [
        `**Live:** ${live}`,
        arch ? `**Archive:** ${arch}` : '**Archive:** (not configured)',
      ].join('\n'),
    );
    return;
  }

  if (name === 'kod-map') {
    if (!isSt(ctx, user.accountId)) {
      await ctx.port.replyEphemeral(i, 'Only a mapped Storyteller may map members.');
      return;
    }
    const accountId = String(options.user ?? '');
    const characterSlug = String(options.character ?? '');
    const role = (options.role as 'player' | 'storyteller') ?? 'player';
    if (!accountId || !characterSlug) {
      await ctx.port.replyEphemeral(i, 'Need user and character slug.');
      return;
    }
    mapMember(ctx.store, {
      platform: 'discord',
      accountId,
      characterSlug,
      role,
      displayName: user.displayName,
      actor: user.accountId,
    });
    await ctx.port.replyEphemeral(
      i,
      `Mapped <@${accountId}> → **${characterSlug}** (${role}).`,
    );
    return;
  }

  if (name === 'kod-prompt') {
    if (!isSt(ctx, user.accountId)) {
      // Allow any user in demo if no ST mapped yet — still prefer ST
      const anySt = ctx.store.listMembers().some((m) => m.role === 'storyteller');
      if (anySt) {
        await ctx.port.replyEphemeral(i, 'Only a Storyteller may post roll prompts.');
        return;
      }
    }
    const foundation = String(options.foundation ?? '');
    const skill = options.skill != null ? String(options.skill) : undefined;
    const dieTier = (Number(options.tier ?? 8) || 8) as DieTier;
    const characterSlug =
      options.character != null ? String(options.character) : undefined;
    const promptId = randomUUID().slice(0, 8);
    const ch = characterSlug
      ? ctx.store.getCharacterBySlug(characterSlug)
      : undefined;
    ctx.prompts.set(promptId, {
      id: promptId,
      foundation,
      skill,
      dieTier,
      characterSlug,
      stAccountId: user.accountId,
      channelId,
    });
    const card = buildRollPromptCard({
      promptId,
      foundation,
      skill,
      dieTier,
      characterName: ch?.name,
      stName: user.displayName ?? 'ST',
      liveSheetUrl: ch ? sheetUrl(ctx.liveBaseUrl, ch.slug) : undefined,
    });
    await ctx.port.sendCard(channelId, card);
    await ctx.port.replyEphemeral(i, 'Roll prompt posted — player presses **Roll**.');
    return;
  }

  if (name === 'kod-roll') {
    const ch = resolveCharacterByAccount(ctx.store, 'discord', user.accountId);
    if (!ch) {
      await ctx.port.replyEphemeral(
        i,
        'You are not mapped to a character. ST: `/kod-map user:@you character:slug`',
      );
      return;
    }
    const foundation = String(options.foundation ?? '');
    const skill = options.skill != null ? String(options.skill) : undefined;
    const dieTier = (Number(options.tier ?? 8) || 8) as DieTier;
    const exertion = Number(options.exertion ?? 0);
    const echo = Boolean(options.echo);
    const result = executePlayerRoll(ctx.store, {
      characterSlug: ch.slug,
      foundation,
      skill,
      dieTier,
      exertionDice: exertion,
      echoInvoked: echo,
      primitive: !skill,
      actor: user.accountId,
      clientEventId: i.clientEventId,
    });
    const card = buildRollResultCard({
      characterName: ch.name,
      intentLine: skill
        ? `${foundation} + ${skill}`
        : `${foundation} (Primitive)`,
      poolFormula: result.poolFormula,
      dieTier: result.dieTier,
      faces: result.faces,
      marks: result.marks,
      omen: result.omen,
      omenHit: result.omenHit,
      practiceGained: result.practiceGained,
      whyPool: result.whyPool,
      liveSheetUrl: sheetUrl(ctx.liveBaseUrl, ch.slug),
      archiveSheetUrl: ctx.archiveBaseUrl
        ? sheetUrl(ctx.archiveBaseUrl, ch.slug)
        : undefined,
      rollId: result.rollId,
      showOppose: true,
      showStPalette: true,
    });
    await ctx.port.sendCard(channelId, card);
    await ctx.port.replyEphemeral(i, `Rolled **${result.marks}** Marks.`);
    return;
  }

  if (name === 'kod-st-roll') {
    if (!isSt(ctx, user.accountId)) {
      const anySt = ctx.store.listMembers().some((m) => m.role === 'storyteller');
      if (anySt) {
        await ctx.port.replyEphemeral(i, 'Storyteller only.');
        return;
      }
    }
    const foundation = Number(options.foundation);
    const skill = Number(options.skill);
    const label = String(options.label ?? 'NPC');
    const dieTier = (Number(options.tier ?? 8) || 8) as DieTier;
    const result = executeStorytellerNpcRoll(ctx.store, {
      label,
      foundation,
      skill,
      dieTier,
      actor: user.accountId,
      clientEventId: i.clientEventId,
    });
    const card = buildRollResultCard({
      characterName: label,
      intentLine: `NPC pool F${foundation}+S${skill}`,
      poolFormula: `${result.poolSize}d${result.dieTier}`,
      dieTier: result.dieTier,
      faces: result.faces,
      marks: result.marks,
      omen: result.omen,
      omenHit: null,
      rollId: result.rollId,
      showStPalette: true,
    });
    await ctx.port.sendCard(channelId, card);
    await ctx.port.replyEphemeral(i, `NPC rolled **${result.marks}** Marks.`);
    return;
  }

  await ctx.port.replyEphemeral(i, `Unknown command: ${name}`);
}

async function handleButton(
  ctx: BotContext,
  i: Extract<ChatInteraction, { type: 'button' }>,
): Promise<void> {
  const id = i.customId;

  if (id.startsWith('prompt-roll:')) {
    const promptId = id.slice('prompt-roll:'.length);
    const prompt = ctx.prompts.get(promptId);
    if (!prompt) {
      await ctx.port.replyEphemeral(i, 'This prompt expired. Ask the ST for a new one.');
      return;
    }
    let ch = resolveCharacterByAccount(ctx.store, 'discord', i.user.accountId);
    if (!ch && prompt.characterSlug) {
      ch = ctx.store.getCharacterBySlug(prompt.characterSlug);
    }
    if (!ch) {
      await ctx.port.replyEphemeral(
        i,
        'Map yourself first: ST runs `/kod-map`.',
      );
      return;
    }
    const result = executePlayerRoll(ctx.store, {
      characterSlug: ch.slug,
      foundation: prompt.foundation,
      skill: prompt.skill,
      dieTier: prompt.dieTier,
      exertionDice: 0,
      echoInvoked: false,
      primitive: !prompt.skill,
      actor: i.user.accountId,
      clientEventId: i.clientEventId,
    });
    const card = buildRollResultCard({
      characterName: ch.name,
      intentLine: prompt.skill
        ? `${prompt.foundation} + ${prompt.skill}`
        : `${prompt.foundation} (Primitive)`,
      poolFormula: result.poolFormula,
      dieTier: result.dieTier,
      faces: result.faces,
      marks: result.marks,
      omen: result.omen,
      omenHit: result.omenHit,
      practiceGained: result.practiceGained,
      whyPool: result.whyPool,
      liveSheetUrl: sheetUrl(ctx.liveBaseUrl, ch.slug),
      archiveSheetUrl: ctx.archiveBaseUrl
        ? sheetUrl(ctx.archiveBaseUrl, ch.slug)
        : undefined,
      rollId: result.rollId,
      showOppose: true,
      showStPalette: true,
    });
    await ctx.port.sendCard(i.channelId, card);
    return;
  }

  if (id.startsWith('why-pool:')) {
    const rollId = id.slice('why-pool:'.length);
    const roll = ctx.store.getRoll(rollId);
    const why =
      (roll?.data as { whyPool?: string } | undefined)?.whyPool ??
      'No detail stored for this roll.';
    await ctx.port.replyEphemeral(i, why);
    return;
  }

  if (id.startsWith('st-harm:')) {
    if (!isSt(ctx, i.user.accountId)) {
      await ctx.port.replyEphemeral(i, 'Storyteller only.');
      return;
    }
    const rollId = id.slice('st-harm:'.length);
    const roll = ctx.store.getRoll(rollId);
    if (!roll) {
      await ctx.port.replyEphemeral(i, 'Unknown roll.');
      return;
    }
    const data = roll.data as {
      marks?: number;
      failures?: number;
      characterSlug?: string;
      kind?: string;
    };
    const slug = data.characterSlug;
    if (!slug) {
      await ctx.port.replyEphemeral(i, 'Roll has no character (NPC?) — harm not wired.');
      return;
    }
    const ch = ctx.store.getCharacterBySlug(slug);
    if (!ch) {
      await ctx.port.replyEphemeral(i, 'Character missing.');
      return;
    }
    // Default physical family; ST can re-request with other families later
    const family = 'physical' as const;
    const prev = previewHarm({
      kind: data.kind === 'opposed' ? 'opposed' : 'unopposed',
      family,
      marks: data.marks,
      failures: data.failures,
      target: ch,
    });
    if (prev.points <= 0) {
      await ctx.port.replyEphemeral(i, 'No harm points from this roll (points = 0).');
      return;
    }
    const card = buildHarmAssignCard({
      rollId,
      characterName: ch.name,
      family,
      points: prev.points,
      ratio: prev.ratio,
      tracks: [...prev.allowedTracks],
    });
    await ctx.port.sendCard(i.channelId, card);
    return;
  }

  if (id.startsWith('harm-apply:')) {
    if (!isSt(ctx, i.user.accountId)) {
      await ctx.port.replyEphemeral(i, 'Storyteller only.');
      return;
    }
    // harm-apply:rollId:family:track:points
    const parts = id.split(':');
    const rollId = parts[1]!;
    const family = parts[2] as 'physical' | 'mental' | 'social';
    const track = parts[3]!;
    const points = Number(parts[4] ?? 0);
    const roll = ctx.store.getRoll(rollId);
    const slug = (roll?.data as { characterSlug?: string } | undefined)?.characterSlug;
    if (!slug || !points) {
      await ctx.port.replyEphemeral(i, 'Invalid harm apply.');
      return;
    }
    const r = applyHarm(ctx.store, {
      characterSlug: slug,
      family,
      availablePoints: points,
      allocations: [{ track, points }],
      rollId,
      actor: i.user.accountId,
      clientEventId: i.clientEventId,
    });
    await ctx.port.sendCard(i.channelId, {
      title: `Harm applied · ${r.character.name}`,
      description: r.applied.map((a) => `**${a.track}** +${a.points}`).join(', '),
      accent: 'blood',
      footer: r.dying ? 'Dying' : undefined,
      links: [
        {
          label: 'Live sheet',
          url: sheetUrl(ctx.liveBaseUrl, r.character.slug),
        },
      ],
    });
    return;
  }

  if (id.startsWith('harm-cancel:')) {
    await ctx.port.replyEphemeral(i, 'Harm assignment cancelled.');
    return;
  }

  if (id.startsWith('st-exert:')) {
    if (!isSt(ctx, i.user.accountId)) {
      await ctx.port.replyEphemeral(i, 'Storyteller only.');
      return;
    }
    const rollId = id.slice('st-exert:'.length);
    const roll = ctx.store.getRoll(rollId);
    const slug = (roll?.data as { characterSlug?: string } | undefined)?.characterSlug;
    if (!slug) {
      await ctx.port.replyEphemeral(i, 'No character on this roll.');
      return;
    }
    const ch = reclaimExertion(ctx.store, {
      characterSlug: slug,
      actor: i.user.accountId,
      note: `from roll ${rollId}`,
    });
    await ctx.port.replyEphemeral(
      i,
      `${ch.name} Exertion now ${ch.exertion.current}/${ch.exertion.max}.`,
    );
    return;
  }

  if (id.startsWith('oppose:')) {
    await ctx.port.replyEphemeral(
      i,
      'Oppose: reply with `/kod-roll` or `/kod-st-roll` (full oppose linking comes next).',
    );
    return;
  }

  await ctx.port.replyEphemeral(i, `Unhandled button: ${id}`);
}
