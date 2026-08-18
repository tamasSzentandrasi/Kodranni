import { randomUUID } from 'node:crypto';
import type { ChatCard, ChatInteraction, ChatPort } from '@kodranni/chat-port';
import {
  applyHarm,
  executePlayerRoll,
  executeStorytellerNpcRoll,
  grantBirthOmen,
  grantGuidingHand,
  grantWord,
  listCharactersForAccount,
  mapMember,
  previewHarm,
  reclaimExertion,
  resolveCharacterByAccount,
  resolveFocusedCharacter,
  resolveRoleByAccount,
  rollAndGrantBirthOmen,
  rollAndGrantGuidingHand,
  setFocusedCharacter,
  startClaimFromBot,
  startCreateFromBot,
  stReviewCharacter,
  issueSheetToken,
  sheetTokenSecret,
  withEditToken,
} from '@kodranni/app';
import {
  buildHarmAssignCard,
  buildRollPromptCard,
  buildRollResultCard,
} from '@kodranni/chat-ui';
import { skillByName, type DieTier } from '@kodranni/domain';
import type { CommunityStorePort } from '@kodranni/store';

export interface RollPrompt {
  id: string;
  foundation: string;
  skill?: string;
  dieTier: DieTier;
  characterSlug?: string;
  /** When set (Intent), only this account may press Roll. */
  targetAccountId?: string;
  stAccountId: string;
  channelId: string;
  /** Private-to-player intent card vs public homework. */
  whisper?: boolean;
}

export interface BotContext {
  store: CommunityStorePort;
  port: ChatPort;
  liveBaseUrl: string;
  archiveBaseUrl?: string;
  prompts: Map<string, RollPrompt>;
  log: (line: string) => void;
}

function sheetUrl(
  base: string,
  slug: string,
  edit?: { platform: string; accountId: string; role?: 'player' | 'storyteller' },
): string {
  const url = `${base.replace(/\/$/, '')}/characters/${slug}/`;
  if (!edit || !sheetTokenSecret()) return url;
  try {
    const token = issueSheetToken({
      platform: edit.platform,
      accountId: edit.accountId,
      characterSlug: slug,
      role: edit.role ?? 'player',
    });
    return withEditToken(url, token);
  } catch {
    return url;
  }
}

function isSt(ctx: BotContext, accountId: string): boolean {
  return resolveRoleByAccount(ctx.store, 'discord', accountId) === 'storyteller';
}

/** Canonical command name after demoting kod-* aliases. */
function canonicalCommand(name: string): string {
  const aliases: Record<string, string> = {
    'kod-live': 'live',
    'kod-roll': 'roll',
    'kod-st-roll': 'st-roll',
    'kod-prompt': 'intent',
    'kod-map': 'map',
  };
  return aliases[name] ?? name;
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

async function resolveRollCharacter(
  ctx: BotContext,
  accountId: string,
  characterOpt?: string,
): Promise<{ ok: true; slug: string; name: string } | { ok: false; message: string }> {
  if (characterOpt) {
    const ch = ctx.store.getCharacterBySlug(characterOpt);
    if (!ch) return { ok: false, message: `Unknown character: ${characterOpt}` };
    if (
      ch.player?.accountId !== accountId &&
      ch.initiator?.accountId !== accountId &&
      resolveRoleByAccount(ctx.store, 'discord', accountId) !== 'storyteller'
    ) {
      return { ok: false, message: 'That character is not bound to you.' };
    }
    return { ok: true, slug: ch.slug, name: ch.name };
  }
  const focused = resolveFocusedCharacter(ctx.store, 'discord', accountId);
  if (focused) return { ok: true, slug: focused.slug, name: focused.name };
  const bound = listCharactersForAccount(ctx.store, 'discord', accountId).filter(
    (c) => c.status === 'active',
  );
  if (bound.length === 0) {
    const any = resolveCharacterByAccount(ctx.store, 'discord', accountId);
    if (any) return { ok: true, slug: any.slug, name: any.name };
    return {
      ok: false,
      message:
        'No character bound. Use `/create` to start a draft, or claim a prebuilt. (Emergency: ST `/map`.)',
    };
  }
  if (bound.length > 1) {
    const names = bound.map((c) => `\`${c.slug}\``).join(', ');
    return {
      ok: false,
      message: `Multiple characters: ${names}. Pass \`character:\` or \`/focus\`.`,
    };
  }
  return { ok: true, slug: bound[0]!.slug, name: bound[0]!.name };
}

function guidingFoundation(skill?: string, explicit?: string): string {
  if (explicit) return explicit;
  if (skill) {
    const def = skillByName(skill);
    if (def) return def.foundation;
  }
  return 'Strength';
}

async function handleCommand(
  ctx: BotContext,
  i: Extract<ChatInteraction, { type: 'command' }>,
): Promise<void> {
  const name = canonicalCommand(i.name);
  const { options, user, channelId } = i;

  if (name === 'live') {
    const live = ctx.liveBaseUrl;
    const arch = ctx.archiveBaseUrl;
    await ctx.port.replyEphemeral(
      i,
      [
        `**Live sheet:** ${live}`,
        arch ? `**Archive:** ${arch}` : '**Archive:** (not configured)',
      ].join('\n'),
    );
    return;
  }

  if (name === 'create') {
    const nameOpt = options.name != null ? String(options.name) : undefined;
    const { character } = startCreateFromBot(ctx.store, {
      platform: 'discord',
      accountId: user.accountId,
      displayName: user.displayName ?? user.accountId,
      name: nameOpt,
      actor: user.accountId,
    });
    const url = sheetUrl(ctx.liveBaseUrl, character.slug, {
      platform: 'discord',
      accountId: user.accountId,
      role: 'player',
    });
    await ctx.port.replyEphemeral(
      i,
      [
        `Draft **${character.name}** started.`,
        `Edit your sheet (personal link): ${url}`,
        'Spend on Core · concept on Draft tab · **Confirm** on Core when ready.',
        'Birth Omen / Guiding Hand dice are rolled here at the table (not on the sheet).',
      ].join('\n'),
    );
    await ctx.port.sendCard(channelId, {
      title: 'Character draft',
      description: `<@${user.accountId}> opened a draft. Use your **ephemeral** sheet link to edit.`,
      accent: 'blood',
      fields: [
        { name: 'Name', value: character.name, inline: true },
        { name: 'Slug', value: character.slug, inline: true },
      ],
      links: [{ label: 'Live sheet (read)', url: sheetUrl(ctx.liveBaseUrl, character.slug) }],
      footer: 'Edit link is in your private reply · Confirm on Core returns here for ST review',
    });
    return;
  }

  if (name === 'claim') {
    const characterSlug = String(options.character ?? '');
    if (!characterSlug) {
      await ctx.port.replyEphemeral(i, 'Need `character:` slug of a claimable prebuilt.');
      return;
    }
    const ch = startClaimFromBot(ctx.store, {
      platform: 'discord',
      accountId: user.accountId,
      displayName: user.displayName ?? user.accountId,
      characterSlug,
      actor: user.accountId,
    });
    const url = sheetUrl(ctx.liveBaseUrl, ch.slug, {
      platform: 'discord',
      accountId: user.accountId,
      role: 'player',
    });
    await ctx.port.replyEphemeral(
      i,
      `Claim started on **${ch.name}**. Open your edit link, then Confirm on Core: ${url}`,
    );
    return;
  }

  if (name === 'focus') {
    const characterSlug = String(options.character ?? '');
    if (!characterSlug) {
      await ctx.port.replyEphemeral(i, 'Need `character:` slug.');
      return;
    }
    const ch = setFocusedCharacter(ctx.store, {
      platform: 'discord',
      accountId: user.accountId,
      characterSlug,
      displayName: user.displayName,
      actor: user.accountId,
    });
    await ctx.port.replyEphemeral(i, `Now playing as **${ch.name}** (\`${ch.slug}\`).`);
    return;
  }

  if (name === 'birth-omen') {
    const characterSlug = String(options.character ?? '');
    if (!characterSlug) {
      await ctx.port.replyEphemeral(i, 'Need `character:` slug.');
      return;
    }
    const faceOpt = options.face != null ? Number(options.face) : undefined;
    const r =
      faceOpt != null
        ? grantBirthOmen(ctx.store, {
            characterSlug,
            face: faceOpt,
            actor: user.accountId,
          })
        : rollAndGrantBirthOmen(ctx.store, {
            characterSlug,
            actor: user.accountId,
          });
    await ctx.port.replyEphemeral(
      i,
      `Birth Omen for **${r.character.name}**: d20 = **${r.face}** → **${r.points}** Foundation points on the sheet.`,
    );
    return;
  }

  if (name === 'guiding-hand') {
    const characterSlug = String(options.character ?? '');
    if (!characterSlug) {
      await ctx.port.replyEphemeral(i, 'Need `character:` slug.');
      return;
    }
    const faceOpt = options.face != null ? Number(options.face) : undefined;
    const r =
      faceOpt != null
        ? grantGuidingHand(ctx.store, {
            characterSlug,
            face: faceOpt,
            actor: user.accountId,
          })
        : rollAndGrantGuidingHand(ctx.store, {
            characterSlug,
            actor: user.accountId,
          });
    await ctx.port.replyEphemeral(
      i,
      `Guiding Hand for **${r.character.name}**: d20 = **${r.face}** → **${r.points}** Skill points on the sheet.`,
    );
    return;
  }

  if (name === 'review') {
    if (!isSt(ctx, user.accountId)) {
      const anySt = ctx.store.listMembers().some((m) => m.role === 'storyteller');
      if (anySt) {
        await ctx.port.replyEphemeral(i, 'Storyteller only.');
        return;
      }
    }
    const characterSlug = options.character != null ? String(options.character) : undefined;
    const pending = ctx.store
      .listCharacters()
      .filter((c) => c.status === 'pending_review')
      .filter((c) => !characterSlug || c.slug === characterSlug);
    if (pending.length === 0) {
      await ctx.port.replyEphemeral(
        i,
        characterSlug
          ? `No pending review for \`${characterSlug}\`.`
          : 'No characters in pending_review. Players Confirm on the sheet after `/create`.',
      );
      return;
    }
    for (const ch of pending) {
      const accountId = ch.initiator?.accountId ?? ch.player?.accountId ?? '';
      const stUrl = sheetUrl(ctx.liveBaseUrl, ch.slug, {
        platform: 'discord',
        accountId: user.accountId,
        role: 'storyteller',
      });
      await ctx.port.sendCard(
        channelId,
        buildDraftReviewCard({
          characterName: ch.name,
          characterSlug: ch.slug,
          mentionAccountId: accountId,
          liveSheetUrl: stUrl,
        }),
      );
    }
    await ctx.port.replyEphemeral(i, `Posted ${pending.length} review card(s).`);
    return;
  }

  if (name === 'award-word') {
    if (!isSt(ctx, user.accountId)) {
      const anySt = ctx.store.listMembers().some((m) => m.role === 'storyteller');
      if (anySt) {
        await ctx.port.replyEphemeral(i, 'Storyteller only.');
        return;
      }
    }
    const characterSlug = String(options.character ?? '');
    if (!characterSlug) {
      await ctx.port.replyEphemeral(i, 'Need `character:` of the **speaker** (not the claim target).');
      return;
    }
    const ch = grantWord(ctx.store, {
      characterSlug,
      reason: 'accepted claim',
      actor: user.accountId,
    });
    await ctx.port.replyEphemeral(
      i,
      `Awarded **1 Word** to **${ch.name}** (now ${ch.creation?.words ?? 0}). Wanting spends are on their sheet.`,
    );
    return;
  }

  if (name === 'map') {
    if (!isSt(ctx, user.accountId)) {
      await ctx.port.replyEphemeral(
        i,
        'Emergency only. Preferred path: player `/create` → sheet Confirm → ST Approve.',
      );
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
      `Emergency map: <@${accountId}> → **${characterSlug}** (${role}).`,
    );
    return;
  }

  if (name === 'intent') {
    if (!isSt(ctx, user.accountId)) {
      const anySt = ctx.store.listMembers().some((m) => m.role === 'storyteller');
      if (anySt) {
        await ctx.port.replyEphemeral(i, 'Only a Storyteller may send Intent.');
        return;
      }
    }
    const targetUser = String(options.player ?? options.user ?? '');
    if (!targetUser) {
      await ctx.port.replyEphemeral(i, 'Intent requires a **player** (named target).');
      return;
    }
    const skill = options.skill != null ? String(options.skill) : undefined;
    const foundation = guidingFoundation(
      skill,
      options.foundation != null ? String(options.foundation) : undefined,
    );
    const dieTier = (Number(options.tier ?? 8) || 8) as DieTier;
    const characterSlug =
      options.character != null ? String(options.character) : undefined;
    let ch = characterSlug ? ctx.store.getCharacterBySlug(characterSlug) : undefined;
    if (!ch) {
      ch = resolveFocusedCharacter(ctx.store, 'discord', targetUser);
    }
    if (!ch) {
      ch = resolveCharacterByAccount(ctx.store, 'discord', targetUser);
    }
    const promptId = randomUUID().slice(0, 8);
    ctx.prompts.set(promptId, {
      id: promptId,
      foundation,
      skill,
      dieTier,
      characterSlug: ch?.slug,
      targetAccountId: targetUser,
      stAccountId: user.accountId,
      channelId,
      whisper: true,
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
    // Channel notice + card; only target may press Roll (enforced on button).
    await ctx.port.sendCard(channelId, {
      title: 'Intent sent',
      description: `Intent for <@${targetUser}>${ch ? ` · **${ch.name}**` : ''}.`,
      accent: 'neutral',
      footer: 'Only the named player can press Roll on the intent card.',
    });
    await ctx.port.sendCard(channelId, card);
    await ctx.port.replyEphemeral(
      i,
      `Intent posted for <@${targetUser}>${ch ? ` (${ch.name})` : ''}.`,
    );
    return;
  }

  if (name === 'roll') {
    const characterOpt =
      options.character != null ? String(options.character) : undefined;
    const resolved = await resolveRollCharacter(ctx, user.accountId, characterOpt);
    if (!resolved.ok) {
      await ctx.port.replyEphemeral(i, resolved.message);
      return;
    }
    const skill = options.skill != null ? String(options.skill) : undefined;
    const foundation = guidingFoundation(
      skill,
      options.foundation != null ? String(options.foundation) : undefined,
    );
    const dieTier = (Number(options.tier ?? 8) || 8) as DieTier;
    const exertion = Number(options.exertion ?? 0);
    const echo = Boolean(options.echo);
    const result = executePlayerRoll(ctx.store, {
      characterSlug: resolved.slug,
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
      characterName: resolved.name,
      intentLine: skill ? `${foundation} + ${skill}` : `${foundation} (Primitive)`,
      poolFormula: result.poolFormula,
      dieTier: result.dieTier,
      faces: result.faces,
      marks: result.marks,
      omen: result.omen,
      omenHit: result.omenHit,
      practiceGained: result.practiceGained,
      whyPool: result.whyPool,
      liveSheetUrl: sheetUrl(ctx.liveBaseUrl, resolved.slug),
      archiveSheetUrl: ctx.archiveBaseUrl
        ? sheetUrl(ctx.archiveBaseUrl, resolved.slug)
        : undefined,
      rollId: result.rollId,
      showOppose: true,
      showStPalette: true,
    });
    await ctx.port.sendCard(channelId, card);
    await ctx.port.replyEphemeral(i, `Rolled **${result.marks}** Marks.`);
    return;
  }

  if (name === 'st-roll') {
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

  await ctx.port.replyEphemeral(i, `Unknown command: ${i.name}`);
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
      await ctx.port.replyEphemeral(i, 'This intent expired. Ask the ST for a new one.');
      return;
    }
    if (prompt.targetAccountId && prompt.targetAccountId !== i.user.accountId) {
      await ctx.port.replyEphemeral(i, 'This Intent is for another player.');
      return;
    }
    let ch = resolveCharacterByAccount(ctx.store, 'discord', i.user.accountId);
    if (!ch && prompt.characterSlug) {
      ch = ctx.store.getCharacterBySlug(prompt.characterSlug);
    }
    if (!ch) {
      await ctx.port.replyEphemeral(
        i,
        'No character bound. Use `/create` or wait for ST approve after Confirm.',
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

  if (id.startsWith('approve:') || id.startsWith('deny:') || id.startsWith('changes:')) {
    if (!isSt(ctx, i.user.accountId)) {
      await ctx.port.replyEphemeral(i, 'Storyteller only.');
      return;
    }
    const slug = id.split(':')[1];
    if (!slug) {
      await ctx.port.replyEphemeral(i, 'Missing character.');
      return;
    }
    const decision = id.startsWith('approve:')
      ? 'approve'
      : id.startsWith('changes:')
        ? 'request_changes'
        : 'deny';
    const ch = stReviewCharacter(ctx.store, {
      characterSlug: slug,
      decision,
      actor: i.user.accountId,
    });
    await ctx.port.replyEphemeral(
      i,
      decision === 'approve'
        ? `Approved **${ch.name}** — bound and locked.`
        : decision === 'request_changes'
          ? `**${ch.name}** returned to draft for changes.`
          : `Denied **${ch.name}** (still draft).`,
    );
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
      'Oppose: reply with `/roll` or `/st-roll` (full oppose linking comes next).',
    );
    return;
  }

  await ctx.port.replyEphemeral(i, `Unhandled button: ${id}`);
}

/** Slugs in pending_review that have not been announced this session. */
export function slugsNeedingReviewCard(
  pendingSlugs: string[],
  announced: Set<string>,
): string[] {
  return pendingSlugs.filter((s) => !announced.has(s));
}

/** Drop announcements for characters no longer pending (changes/deny/approve). */
export function pruneAnnouncedReviews(
  pendingSlugs: string[],
  announced: Set<string>,
): void {
  const live = new Set(pendingSlugs);
  for (const s of announced) {
    if (!live.has(s)) announced.delete(s);
  }
}

/** Build ST review card after sheet Confirm (for bot consumers of events). */
export function buildDraftReviewCard(input: {
  characterName: string;
  characterSlug: string;
  mentionAccountId: string;
  liveSheetUrl: string;
}): ChatCard {
  return {
    title: `${input.characterName} · ready for review`,
    description: `<@${input.mentionAccountId}> finished draft **${input.characterName}**.`,
    accent: 'blood',
    fields: [{ name: 'From', value: `<@${input.mentionAccountId}>`, inline: true }],
    buttons: [
      { id: `approve:${input.characterSlug}`, label: 'Approve', style: 'success' },
      { id: `changes:${input.characterSlug}`, label: 'Request changes', style: 'secondary' },
      { id: `deny:${input.characterSlug}`, label: 'Deny', style: 'danger' },
    ],
    links: [{ label: 'Open sheet', url: input.liveSheetUrl }],
  };
}
