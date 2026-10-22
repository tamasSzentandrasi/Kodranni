import { randomUUID } from 'node:crypto';
import type { ChatCard, ChatInteraction, ChatPort } from '@kodranni/chat-port';
import {
  acceptSeenClaim,
  applyHarm,
  closeTide,
  setTideOpenRoll,
  executePlayerRoll,
  executeStorytellerNpcRoll,
  grantBirthOmen,
  grantGuidingHand,
  grantWord,
  listCharactersForAccount,
  previewHarm,
  previewPlayerPool,
  refuseSeenClaim,
  resolveCharacterByAccount,
  resolveFocusedCharacter,
  resolveRoleByAccount,
  rollAndGrantBirthOmen,
  rollAndGrantGuidingHand,
  secondSeenClaim,
  setFocusedCharacter,
  stageWanting,
  startClaimFromBot,
  startCreateFromBot,
  stReviewCharacter,
  undoPlayerRoll,
  wantingChoiceLine,
  issueSheetToken,
  sheetTokenSecret,
  withEditToken,
} from '@kodranni/app';
import {
  buildHarmAssignCard,
  buildRollConfirmCard,
  buildRollPromptCard,
  buildRollResultCard,
  exertionChoices,
  buildSeenClaimCard,
  buildTideCard,
  dieImageUrl,
  dieTierShort,
  fetchablePicture,
  publicAssetUrl,
  tideFootingLabel,
  tideSizeLabel,
} from '@kodranni/chat-ui';
import {
  ARCHETYPES,
  FOUNDATION_NAMES,
  skillByName,
  type DieTier,
} from '@kodranni/domain';
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

/** Ephemeral confirm / fallback wizard state for free-roll. */
export interface RollConfirm {
  id: string;
  accountId: string;
  characterSlug: string;
  characterName: string;
  skill?: string;
  foundation: string;
  dieTier: DieTier;
  exertion: number;
  echoName?: string;
  parentRollId?: string;
  /** Started from Roll on the Tide card. The first one waits; the next one answers it. */
  tideLink?: boolean;
  channelId: string;
  /** Kept so an in-flight Foundation step can still open this card. */
  phase?: 'found' | 'arch' | 'skill' | 'confirm';
  /** `primitive`, an archetype id, or unset until the player chooses. */
  archetype?: string;
}

export interface BotContext {
  store: CommunityStorePort;
  port: ChatPort;
  liveBaseUrl: string;
  archiveBaseUrl?: string;
  prompts: Map<string, RollPrompt>;
  confirms?: Map<string, RollConfirm>;
  log: (line: string) => void;
  /** Discord guild role ID → Storyteller (preferred). */
  discordStorytellerRoleId?: string;
  /** Fluxer role ID → Storyteller. */
  fluxerStorytellerRoleId?: string;
}

function confirmsOf(ctx: BotContext): Map<string, RollConfirm> {
  if (!ctx.confirms) ctx.confirms = new Map();
  return ctx.confirms;
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

function tableChannel(i: ChatInteraction, stored?: string): string {
  return (stored || i.channelId || process.env.DISCORD_PLAY_CHANNEL_ID || '').trim();
}

function portraitFor(ctx: BotContext, slug: string, avatar?: string): string | undefined {
  if (!avatar) return undefined;
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) return fetchablePicture(avatar);
  return publicAssetUrl(ctx.liveBaseUrl, `/api/avatar/${slug}`);
}

function playerMention(ch: {
  name: string;
  player?: { platform?: string; accountId?: string; displayName?: string };
  initiator?: { platform?: string; accountId?: string; displayName?: string };
}): string {
  const bound = ch.player?.accountId
    ? ch.player
    : ch.initiator?.accountId
      ? ch.initiator
      : undefined;
  if (bound?.platform === 'discord' && bound.accountId) return `<@${bound.accountId}>`;
  if (bound?.displayName) return `**${bound.displayName}**`;
  return `**${ch.name}**`;
}

function isSt(
  ctx: BotContext,
  user: { platform: string; accountId: string; roleIds?: string[] },
): boolean {
  if (
    user.platform === 'discord' &&
    ctx.discordStorytellerRoleId &&
    user.roleIds?.includes(ctx.discordStorytellerRoleId)
  ) {
    return true;
  }
  if (
    user.platform === 'fluxer' &&
    ctx.fluxerStorytellerRoleId &&
    user.roleIds?.includes(ctx.fluxerStorytellerRoleId)
  ) {
    return true;
  }
  return resolveRoleByAccount(ctx.store, user.platform, user.accountId) === 'storyteller';
}

function canonicalCommand(name: string): string {
  return name;
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
    if (i.type === 'select') {
      await handleSelect(ctx, i);
      return;
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    ctx.log(`error: ${msg}`);
    await ctx.port.replyEphemeral(i, msg.slice(0, 500));
  }
}

async function showConfirmCard(
  ctx: BotContext,
  i: ChatInteraction,
  c: RollConfirm,
  fresh = false,
): Promise<void> {
  c.phase = 'confirm';
  confirmsOf(ctx).set(c.id, c);
  const person = ctx.store.getCharacterBySlug(c.characterSlug);
  if (person?.dying && person.exertion.current >= 1 && c.exertion < 1) c.exertion = 1;
  let poolFormula = '';
  try {
    poolFormula = previewPlayerPool(ctx.store, {
      characterSlug: c.characterSlug,
      foundation: c.foundation,
      skill: c.skill,
      dieTier: c.dieTier,
      exertionDice: c.exertion,
      echoInvoked: Boolean(c.echoName),
      echoName: c.echoName,
      primitive: !c.skill,
    }).poolFormula;
  } catch (err) {
    poolFormula = err instanceof Error ? err.message : String(err);
  }
  const arch =
    c.archetype && c.archetype !== 'primitive'
      ? ARCHETYPES.find((a) => a.id === c.archetype)
      : undefined;
  const card = buildRollConfirmCard({
    confirmId: c.id,
    characterName: c.characterName,
    skill: c.skill,
    foundation: c.foundation,
    foundations: [...FOUNDATION_NAMES],
    archetype: c.archetype,
    archetypes: ARCHETYPES.map((a) => ({ id: a.id, name: a.name, tag: a.tag })),
    skills: (arch?.skills ?? []).map((s) => ({ name: s.name, foundation: s.foundation })),
    dieTier: c.dieTier,
    exertion: c.exertion,
    poolFormula,
    echoes: (person?.echoes ?? [])
      .filter((echo) => !echo.resolved)
      .map((echo) => ({ title: echo.title })),
    echoName: c.echoName,
    exertionCurrent: person?.exertion.current,
    dying: Boolean(person?.dying),
    dieImageUrl: dieImageUrl(ctx.liveBaseUrl, c.dieTier),
    liveSheetUrl: sheetUrl(ctx.liveBaseUrl, c.characterSlug, {
      platform: 'discord',
      accountId: c.accountId,
    }),
  });
  if (fresh && ctx.port.replyEphemeralCard) {
    await ctx.port.replyEphemeralCard(i, card);
    return;
  }
  if (ctx.port.editReplyCard) await ctx.port.editReplyCard(i, card);
  else await ctx.port.sendCard(c.channelId || i.channelId, card);
}

async function castConfirm(
  ctx: BotContext,
  i: ChatInteraction,
  c: RollConfirm,
): Promise<void> {
  confirmsOf(ctx).delete(c.id);
  const person = ctx.store.getCharacterBySlug(c.characterSlug);
  if (c.tideLink && !c.parentRollId) {
    const openRollId = ctx.store.getTableState().tide?.openRollId;
    if (openRollId) c.parentRollId = openRollId;
  }
  const answering = Boolean(c.parentRollId);
  const result = executePlayerRoll(ctx.store, {
    characterSlug: c.characterSlug,
    foundation: c.foundation,
    skill: c.skill,
    dieTier: c.dieTier,
    exertionDice: c.exertion,
    echoInvoked: Boolean(c.echoName),
    echoName: c.echoName,
    parentRollId: c.parentRollId,
    primitive: !c.skill,
    actor: c.accountId,
    clientEventId: i.clientEventId,
  });
  const intentLine = c.skill
    ? `${c.foundation} + ${c.skill} · ${dieTierShort(c.dieTier)}`
    : `${c.foundation} (Primitive) · ${dieTierShort(c.dieTier)}`;
  const card = buildRollResultCard({
    characterName: c.characterName,
    intentLine,
    poolFormula: result.poolFormula,
    dieTier: result.dieTier,
    portraitUrl: portraitFor(ctx, c.characterSlug, person?.avatar),
    faces: result.faces,
    marks: result.marks,
    omen: result.omen,
    omenHit: result.omenSecret ? null : omenWords(result.omenHit, result.omenEffect),
    died: result.died,
    whyPool: result.whyPool,
    aside: c.tideLink
      ? answering
        ? 'On the Tide. This answer moves the marker.'
        : 'On the Tide. The other side answers with Roll.'
      : undefined,
    liveSheetUrl: sheetUrl(ctx.liveBaseUrl, c.characterSlug),
    archiveSheetUrl: ctx.archiveBaseUrl
      ? sheetUrl(ctx.archiveBaseUrl, c.characterSlug)
      : undefined,
    rollId: result.rollId,
    showOppose: true,
    showStPalette: true,
  });
  const dest = tableChannel(i, c.channelId);
  if (!dest) throw new Error('no Discord channel on this interaction — cannot post the roll');
  await ctx.port.sendCard(dest, card);
  if (c.tideLink) {
    setTideOpenRoll(ctx.store, answering ? null : result.rollId);
  } else if (answering) {
    const openRollId = ctx.store.getTableState().tide?.openRollId;
    if (openRollId && openRollId === c.parentRollId) setTideOpenRoll(ctx.store, null);
  }
  await refreshTideCard(ctx);
  await ctx.port.replyEphemeral(i, `Rolled **${result.marks}** Marks — posted to the table.`);
  if (ctx.port.editReplyCard) {
    await ctx.port.editReplyCard(i, {
      title: 'Cast',
      description: `**${result.marks}** Marks · ${intentLine}`,
      accent: 'neutral',
      footer: 'Result is on the table.',
    });
  }
}

async function resolveRollCharacter(
  ctx: BotContext,
  user: { platform: string; accountId: string; roleIds?: string[] },
  characterOpt?: string,
): Promise<{ ok: true; slug: string; name: string } | { ok: false; message: string }> {
  const accountId = user.accountId;
  const platform = user.platform;
  if (characterOpt) {
    const ch = findSheeted(ctx, characterOpt);
    if (!ch) return { ok: false, message: `Unknown character: ${characterOpt}` };
    if (
      ch.player?.accountId !== accountId &&
      ch.initiator?.accountId !== accountId &&
      !isSt(ctx, user)
    ) {
      return { ok: false, message: 'That character is not bound to you.' };
    }
    return { ok: true, slug: ch.slug, name: ch.name };
  }
  const focused = resolveFocusedCharacter(ctx.store, platform, accountId);
  if (focused) return { ok: true, slug: focused.slug, name: focused.name };
  const bound = listCharactersForAccount(ctx.store, platform, accountId).filter(
    (c) => c.status === 'active',
  );
  if (bound.length === 0) {
    const any = resolveCharacterByAccount(ctx.store, platform, accountId);
    if (any) return { ok: true, slug: any.slug, name: any.name };
    return {
      ok: false,
      message: 'No active character. Use /create or /claim.',
    };
  }
  if (bound.length > 1) {
    const names = bound.map((c) => c.name).join(', ');
    return {
      ok: false,
      message: `Multiple characters: ${names}. Use \`/select\`.`,
    };
  }
  return { ok: true, slug: bound[0]!.slug, name: bound[0]!.name };
}

function findSheeted(ctx: BotContext, token: string) {
  const trimmed = token.trim();
  if (!trimmed) return undefined;
  const bySlug = ctx.store.getCharacterBySlug(trimmed);
  if (bySlug) return bySlug;
  const folded = trimmed.toLowerCase();
  const all = ctx.store.listCharacters();
  const exact = all.find((ch) => ch.name.toLowerCase() === folded);
  if (exact) return exact;
  // Fluxer has no autocomplete, so one name is enough when it matches a single sheet.
  const partial = all.filter((ch) => {
    const name = ch.name.toLowerCase();
    return name.startsWith(`${folded} `) || name.split(/\s+/).includes(folded);
  });
  return partial.length === 1 ? partial[0] : undefined;
}

function omenWords(hit: string | null | undefined, effect?: string): string | null {
  if (hit === 'positive') return 'Positive Consequence';
  if (hit === 'negative') return 'Negative Consequence';
  if (hit === 'scene') return effect || 'Scene';
  return null;
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
        'Spend on Core · concept on the sheet · **Confirm** on any tab when ready.',
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
      buttons: [{ id: `wanting:${character.slug}`, label: 'The Wanting', style: 'secondary' }],
      links: [{ label: 'Live sheet (read)', url: sheetUrl(ctx.liveBaseUrl, character.slug) }],
      footer: 'Edit link is in your private reply · Confirm on the sheet returns here for review',
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

  if (name === 'select') {
    const living = listCharactersForAccount(ctx.store, 'discord', user.accountId).filter(
      (c) => c.status === 'active',
    );
    if (living.length === 0) {
      await ctx.port.replyEphemeral(i, 'No active character. Use /create or /claim.');
      return;
    }
    if (living.length === 1) {
      await ctx.port.replyEphemeral(
        i,
        `Rolls use **${living[0]!.name}**. Claiming another releases it.`,
      );
      return;
    }
    const token = String(options.character ?? '').trim();
    const folded = token.toLowerCase();
    const match = living.find((c) => c.slug === token || c.name.toLowerCase() === folded);
    if (!match) {
      await ctx.port.replyEphemeral(i, `None of your living characters is named ${token}.`);
      return;
    }
    const ch = setFocusedCharacter(ctx.store, {
      platform: 'discord',
      accountId: user.accountId,
      characterSlug: match.slug,
      displayName: user.displayName,
      actor: user.accountId,
    });
    await ctx.port.replyEphemeral(i, `Rolls will use **${ch.name}**.`);
    return;
  }

  if (name === 'birth-omen') {
    const resolved = await resolveRollCharacter(ctx, user);
    if (!resolved.ok) {
      await ctx.port.replyEphemeral(i, resolved.message);
      return;
    }
    const faceOpt = options.face != null ? Number(options.face) : undefined;
    const r =
      faceOpt != null
        ? grantBirthOmen(ctx.store, {
            characterSlug: resolved.slug,
            face: faceOpt,
            actor: user.accountId,
          })
        : rollAndGrantBirthOmen(ctx.store, {
            characterSlug: resolved.slug,
            actor: user.accountId,
          });
    await ctx.port.replyEphemeral(
      i,
      `Birth Omen for **${r.character.name}**: d20 = **${r.face}** → **${r.points}** Foundation points on the sheet.`,
    );
    return;
  }

  if (name === 'guiding-hand') {
    const resolved = await resolveRollCharacter(ctx, user);
    if (!resolved.ok) {
      await ctx.port.replyEphemeral(i, resolved.message);
      return;
    }
    const faceOpt = options.face != null ? Number(options.face) : undefined;
    const r =
      faceOpt != null
        ? grantGuidingHand(ctx.store, {
            characterSlug: resolved.slug,
            face: faceOpt,
            actor: user.accountId,
          })
        : rollAndGrantGuidingHand(ctx.store, {
            characterSlug: resolved.slug,
            actor: user.accountId,
          });
    await ctx.port.replyEphemeral(
      i,
      `Guiding Hand for **${r.character.name}**: d20 = **${r.face}** → **${r.points}** Skill points on the sheet.`,
    );
    return;
  }

  if (name === 'review') {
    if (!isSt(ctx, user)) {
      const anySt = ctx.store.listMembers().some((m) => m.role === 'storyteller');
      if (anySt) {
        await ctx.port.replyEphemeral(i, 'Storyteller only.');
        return;
      }
    }
    const token = options.character != null ? String(options.character) : undefined;
    const pending = ctx.store.listCharacters().filter((c) => c.status === 'pending_review');
    const named = token ? findSheeted(ctx, token) : undefined;
    const waiting = token ? pending.filter((c) => c.slug === named?.slug) : pending;
    if (waiting.length === 0) {
      await ctx.port.replyEphemeral(i, 'No one is waiting.');
      return;
    }
    for (const ch of waiting) {
      await ctx.port.sendCard(channelId, sessionInboxNotice(ch.name));
    }
    await ctx.port.replyEphemeral(i, `Posted ${waiting.length} notice${waiting.length === 1 ? '' : 's'}.`);
    return;
  }

  if (name === 'award-word') {
    if (!isSt(ctx, user)) {
      await ctx.port.replyEphemeral(i, 'Storyteller only.');
      return;
    }
    const token = String(options.character ?? '').trim();
    if (!token) {
      await ctx.port.replyEphemeral(i, 'Name the character.');
      return;
    }
    const named = findSheeted(ctx, token);
    if (!named) {
      await ctx.port.replyEphemeral(i, `Unknown character: ${token}`);
      return;
    }
    const ch = grantWord(ctx.store, {
      characterSlug: named.slug,
      reason: 'accepted claim',
      actor: user.accountId,
    });
    const who = playerMention(ch);
    await ctx.port.sendCard(channelId, {
      title: 'Word',
      description: `**${ch.name}** is awarded a Word. ${who} can spend it in The Wanting.`,
      accent: 'neutral',
    });
    await ctx.port.replyEphemeral(i, `Awarded. **${ch.name}** holds ${ch.creation?.words ?? 0}.`);
    return;
  }

  if (name === 'intent') {
    if (!isSt(ctx, user)) {
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
      dieImageUrl: dieImageUrl(ctx.liveBaseUrl, dieTier),
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
    const resolved = await resolveRollCharacter(ctx, user, characterOpt);
    if (!resolved.ok) {
      await ctx.port.replyEphemeral(i, resolved.message);
      return;
    }
    const skill = options.skill != null ? String(options.skill) : undefined;
    const skillDef = skill ? skillByName(skill) : undefined;
    if (skill && !skillDef) {
      await ctx.port.replyEphemeral(
        i,
        `Unknown skill “${skill}”. Type a few letters for autocomplete, or omit skill to pick by Archetype.`,
      );
      return;
    }
    const foundation = guidingFoundation(
      skill,
      options.foundation != null ? String(options.foundation) : undefined,
    );
    const dieTier = (Number(options.tier ?? 8) || 8) as DieTier;
    const exertion = Number(options.exertion ?? 0);
    const echoToken =
      typeof options.echo === 'string' && options.echo.trim() && options.echo !== 'none'
        ? options.echo.trim()
        : undefined;
    let echoName: string | undefined;
    if (echoToken) {
      const person = ctx.store.getCharacterBySlug(resolved.slug);
      const echo = person?.echoes.find(
        (row) => !row.resolved && row.title.toLowerCase() === echoToken.toLowerCase(),
      );
      if (!echo) {
        await ctx.port.replyEphemeral(i, `That Echo is not on **${resolved.name}**.`);
        return;
      }
      echoName = echo.title;
    }
    const confirmId = randomUUID().slice(0, 8);
    const confirm: RollConfirm = {
      id: confirmId,
      accountId: user.accountId,
      characterSlug: resolved.slug,
      characterName: resolved.name,
      skill,
      foundation,
      dieTier,
      exertion,
      echoName,
      channelId,
      archetype: skillDef?.archetype,
      phase: 'confirm',
    };
    confirmsOf(ctx).set(confirmId, confirm);
    await showConfirmCard(ctx, i, confirm);
    return;
  }

  if (name === 'npc-roll') {
    if (!isSt(ctx, user)) {
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
      omenHit: result.omenSecret ? null : omenWords(result.omenHit, result.omenEffect),
      rollId: result.rollId,
      showStPalette: true,
    });
    await ctx.port.sendCard(channelId, card);
    const whisper = result.omenWhisper ? ` Whisper, face ${result.omen}: ${result.omenWhisper}.` : '';
    await ctx.port.replyEphemeral(i, `NPC rolled **${result.marks}** Marks.${whisper}`);
    return;
  }

  await ctx.port.replyEphemeral(i, `Unknown command: ${i.name}`);
}

async function handleSelect(
  ctx: BotContext,
  i: Extract<ChatInteraction, { type: 'select' }>,
): Promise<void> {
  const id = i.customId;
  const value = i.values[0];
  if (!value) return;

  if (id.startsWith('wanting-menu:')) {
    const slug = id.slice('wanting-menu:'.length);
    const ch = ctx.store.getCharacterBySlug(slug);
    if (!ch || ch.initiator?.accountId !== i.user.accountId) {
      await ctx.port.replyEphemeral(i, 'Only the person who opened this draft can choose a Wanting.');
      return;
    }
    try {
      stageWanting(ctx.store, { characterSlug: slug, menu: value, actor: i.user.accountId });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await ctx.port.replyEphemeral(i, msg);
      return;
    }
    const url = sheetUrl(ctx.liveBaseUrl, slug, {
      platform: i.user.platform,
      accountId: i.user.accountId,
      role: 'player',
    });
    await ctx.port.replyEphemeral(
      i,
      `${wantingChoiceLine(value)} The desk approves it. Name the pay on your sheet: ${url}`,
    );
    return;
  }

  if (id.startsWith('roll-arch:')) {
    const confirmId = id.slice('roll-arch:'.length);
    const c = confirmsOf(ctx).get(confirmId);
    if (!c || c.accountId !== i.user.accountId) {
      await ctx.port.replyEphemeral(i, 'This picker is not yours or expired.');
      return;
    }
    if (value === 'primitive') {
      c.skill = undefined;
      c.archetype = 'primitive';
      await showConfirmCard(ctx, i, c);
      return;
    }
    const arch = ARCHETYPES.find((a) => a.id === value);
    if (!arch) {
      await ctx.port.replyEphemeral(i, 'Unknown Archetype.');
      return;
    }
    c.archetype = arch.id;
    if (c.skill && !arch.skills.some((s) => s.name === c.skill)) c.skill = undefined;
    await showConfirmCard(ctx, i, c);
    return;
  }

  if (id.startsWith('roll-skill:')) {
    const confirmId = id.slice('roll-skill:'.length);
    const c = confirmsOf(ctx).get(confirmId);
    if (!c || c.accountId !== i.user.accountId) {
      await ctx.port.replyEphemeral(i, 'This picker is not yours or expired.');
      return;
    }
    if (value === 'wait') {
      await ctx.port.replyEphemeral(
        i,
        'Choose an Archetype. Primitive rolls the Foundation alone.',
      );
      return;
    }
    if (value === 'primitive') {
      c.archetype = 'primitive';
      c.skill = undefined;
      await showConfirmCard(ctx, i, c);
      return;
    }
    const def = skillByName(value);
    if (!def) {
      await ctx.port.replyEphemeral(i, 'Unknown skill.');
      return;
    }
    c.skill = def.name;
    c.archetype = def.archetype;
    await showConfirmCard(ctx, i, c);
    return;
  }

  if (id.startsWith('roll-step-found:')) {
    const confirmId = id.slice('roll-step-found:'.length);
    const c = confirmsOf(ctx).get(confirmId);
    if (!c || c.accountId !== i.user.accountId) {
      await ctx.port.replyEphemeral(i, 'This picker is not yours or expired.');
      return;
    }
    if (!(FOUNDATION_NAMES as readonly string[]).includes(value)) {
      await ctx.port.replyEphemeral(i, 'Unknown Foundation.');
      return;
    }
    c.foundation = value;
    await showConfirmCard(ctx, i, c);
    return;
  }

  if (id.startsWith('roll-found:')) {
    const confirmId = id.slice('roll-found:'.length);
    const c = confirmsOf(ctx).get(confirmId);
    if (!c || c.accountId !== i.user.accountId) {
      await ctx.port.replyEphemeral(i, 'This confirm is not yours or expired.');
      return;
    }
    if (!(FOUNDATION_NAMES as readonly string[]).includes(value)) {
      await ctx.port.replyEphemeral(i, 'Unknown Foundation.');
      return;
    }
    c.foundation = value;
    await showConfirmCard(ctx, i, c);
    return;
  }

  if (id.startsWith('roll-tier:')) {
    const confirmId = id.slice('roll-tier:'.length);
    const c = confirmsOf(ctx).get(confirmId);
    if (!c || c.accountId !== i.user.accountId) {
      await ctx.port.replyEphemeral(i, 'This confirm is not yours or expired.');
      return;
    }
    const tier = Number(value);
    if (tier !== 6 && tier !== 8 && tier !== 12) {
      await ctx.port.replyEphemeral(i, 'Unknown die tier.');
      return;
    }
    c.dieTier = tier as DieTier;
    await showConfirmCard(ctx, i, c);
    return;
  }

  if (id.startsWith('roll-echo:')) {
    const confirmId = id.slice('roll-echo:'.length);
    const c = confirmsOf(ctx).get(confirmId);
    if (!c || c.accountId !== i.user.accountId) {
      await ctx.port.replyEphemeral(i, 'This confirm is not yours or expired.');
      return;
    }
    if (value === 'none') {
      c.echoName = undefined;
      if (c.exertion > 1) c.exertion = 1;
    } else {
      const person = ctx.store.getCharacterBySlug(c.characterSlug);
      const echo = person?.echoes.find((row) => !row.resolved && row.title === value);
      if (!echo) {
        await ctx.port.replyEphemeral(i, 'That Echo is not on this sheet.');
        return;
      }
      c.echoName = echo.title;
    }
    await showConfirmCard(ctx, i, c);
    return;
  }

  if (id.startsWith('harm-track:')) {
    if (!isSt(ctx, i.user)) {
      await ctx.port.replyEphemeral(i, 'Storyteller only.');
      return;
    }
    const parts = id.split(':');
    const rollId = parts[1]!;
    const family = parts[2] as 'physical' | 'mental' | 'social';
    const points = Number(parts[3] ?? 0);
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
      allocations: [{ track: value, points }],
      rollId,
      actor: i.user.accountId,
      clientEventId: i.clientEventId,
    });
    await ctx.port.sendCard(i.channelId, {
      title: `Harm applied · ${r.character.name}`,
      description: r.applied.map((a) => `**${a.track}** +${a.points}`).join(', '),
      accent: 'blood',
      footer: r.dying ? 'Dying' : undefined,
      links: [{ label: 'Live sheet', url: sheetUrl(ctx.liveBaseUrl, r.character.slug) }],
    });
  }
}

async function handleButton(
  ctx: BotContext,
  i: Extract<ChatInteraction, { type: 'button' }>,
): Promise<void> {
  const id = i.customId;

  if (id.startsWith('roll-cast:')) {
    const confirmId = id.slice('roll-cast:'.length);
    const c = confirmsOf(ctx).get(confirmId);
    if (!c || c.accountId !== i.user.accountId) {
      await ctx.port.replyEphemeral(i, 'This confirm is not yours or expired.');
      return;
    }
    if (!c.skill && c.archetype !== 'primitive') {
      await ctx.port.replyEphemeral(
        i,
        c.archetype
          ? 'Pick a skill, or choose Primitive.'
          : 'Choose an Archetype. Primitive rolls the Foundation alone.',
      );
      return;
    }
    await castConfirm(ctx, i, c);
    return;
  }
  if (id.startsWith('roll-tier-cycle:')) {
    const confirmId = id.slice('roll-tier-cycle:'.length);
    const c = confirmsOf(ctx).get(confirmId);
    if (!c || c.accountId !== i.user.accountId) {
      await ctx.port.replyEphemeral(i, 'This confirm is not yours or expired.');
      return;
    }
    c.dieTier = c.dieTier === 8 ? 12 : c.dieTier === 12 ? 6 : 8;
    await showConfirmCard(ctx, i, c);
    return;
  }
  if (id.startsWith('roll-cancel:')) {
    const confirmId = id.slice('roll-cancel:'.length);
    confirmsOf(ctx).delete(confirmId);
    if (ctx.port.editReplyCard) {
      await ctx.port.editReplyCard(i, {
        title: 'Cancelled',
        description: 'No roll.',
        accent: 'neutral',
      });
    } else {
      await ctx.port.replyEphemeral(i, 'Cancelled.');
    }
    return;
  }
  if (id.startsWith('roll-exert:')) {
    const confirmId = id.slice('roll-exert:'.length);
    const c = confirmsOf(ctx).get(confirmId);
    if (!c || c.accountId !== i.user.accountId) {
      await ctx.port.replyEphemeral(i, 'This confirm is not yours or expired.');
      return;
    }
    const person = ctx.store.getCharacterBySlug(c.characterSlug);
    const choices = exertionChoices({
      exertion: c.exertion,
      exertionCurrent: person?.exertion.current,
      dying: Boolean(person?.dying),
      echoName: c.echoName,
    });
    if (choices.length === 0) {
      c.exertion = 0;
      await showConfirmCard(ctx, i, c);
      return;
    }
    const at = choices.indexOf(c.exertion);
    c.exertion = choices[(at + 1) % choices.length]!;
    await showConfirmCard(ctx, i, c);
    return;
  }
  if (id.startsWith('roll-spend:')) {
    const rest = id.slice('roll-spend:'.length);
    const sep = rest.indexOf(':');
    const n = Number(sep < 1 ? '' : rest.slice(0, sep));
    const confirmId = sep < 1 ? '' : rest.slice(sep + 1);
    const c = confirmsOf(ctx).get(confirmId);
    if (!c || c.accountId !== i.user.accountId) {
      await ctx.port.replyEphemeral(i, 'This confirm is not yours or expired.');
      return;
    }
    if (n !== 0 && n !== 1 && n !== 2) {
      await ctx.port.replyEphemeral(i, 'Unknown Exertion.');
      return;
    }
    const person = ctx.store.getCharacterBySlug(c.characterSlug);
    const current = person?.exertion.current ?? 0;
    if (person?.dying && current >= 1 && n === 0) {
      await ctx.port.replyEphemeral(i, 'Dying spends Exertion on every roll.');
      return;
    }
    if (current <= 0) {
      c.exertion = 0;
      await showConfirmCard(ctx, i, c);
      return;
    }
    if (n === 2 && !c.echoName) {
      await ctx.port.replyEphemeral(i, 'Name an Echo before the second point.');
      return;
    }
    if (n === 2 && current < 2) {
      await ctx.port.replyEphemeral(i, 'The extra die needs two Exertion points.');
      return;
    }
    c.exertion = n;
    await showConfirmCard(ctx, i, c);
    return;
  }
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
    let ch = resolveFocusedCharacter(ctx.store, 'discord', i.user.accountId);
    if (!ch) ch = resolveCharacterByAccount(ctx.store, 'discord', i.user.accountId);
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
    const confirmId = randomUUID().slice(0, 8);
    const confirm: RollConfirm = {
      id: confirmId,
      accountId: i.user.accountId,
      characterSlug: ch.slug,
      characterName: ch.name,
      skill: prompt.skill,
      archetype: prompt.skill ? skillByName(prompt.skill)?.archetype : undefined,
      foundation: prompt.foundation,
      dieTier: prompt.dieTier,
      exertion: 0,
      channelId: i.channelId,
      phase: 'confirm',
    };
    await showConfirmCard(ctx, i, confirm);
    return;
  }

  if (id.startsWith('approve:') || id.startsWith('deny:') || id.startsWith('changes:')) {
    if (!isSt(ctx, i.user)) {
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
          ? `**${ch.name}** is a draft again. The edits remain.`
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
    if (!isSt(ctx, i.user)) {
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
    if (!isSt(ctx, i.user)) {
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

  if (id.startsWith('undo:')) {
    if (!isSt(ctx, i.user)) {
      await ctx.port.replyEphemeral(i, 'Storyteller only.');
      return;
    }
    const rollId = id.slice('undo:'.length);
    try {
      const undone = undoPlayerRoll(ctx.store, rollId, i.user.accountId);
      await refreshTideCard(ctx);
      await ctx.port.replyEphemeral(i, `Undid the roll for **${undone.name}**.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await ctx.port.replyEphemeral(i, msg);
    }
    return;
  }

  if (id.startsWith('oppose:')) {
    const parentRollId = id.slice('oppose:'.length);
    const roll = ctx.store.getRoll(parentRollId);
    if (!roll) {
      await ctx.port.replyEphemeral(i, 'Unknown roll.');
      return;
    }
    const resolved = await resolveRollCharacter(ctx, i.user);
    if (!resolved.ok) {
      await ctx.port.replyEphemeral(i, resolved.message);
      return;
    }
    const confirmId = randomUUID().slice(0, 8);
    const confirm: RollConfirm = {
      id: confirmId,
      accountId: i.user.accountId,
      characterSlug: resolved.slug,
      characterName: resolved.name,
      foundation: 'Strength',
      dieTier: 8,
      exertion: 0,
      parentRollId,
      channelId: i.channelId,
      phase: 'confirm',
    };
    await showConfirmCard(ctx, i, confirm, true);
    return;
  }

  if (id === 'tide-roll') {
    const tide = ctx.store.getTableState().tide;
    if (!tide) {
      await ctx.port.replyEphemeral(i, 'No Tide is open.');
      return;
    }
    const resolved = await resolveRollCharacter(ctx, i.user);
    if (!resolved.ok) {
      await ctx.port.replyEphemeral(i, resolved.message);
      return;
    }
    const confirmId = randomUUID().slice(0, 8);
    const confirm: RollConfirm = {
      id: confirmId,
      accountId: i.user.accountId,
      characterSlug: resolved.slug,
      characterName: resolved.name,
      foundation: 'Strength',
      dieTier: 8,
      exertion: 0,
      channelId: i.channelId,
      phase: 'confirm',
      tideLink: true,
    };
    await showConfirmCard(ctx, i, confirm, true);
    return;
  }

  if (id === 'tide-close') {
    if (!isSt(ctx, i.user)) {
      await ctx.port.replyEphemeral(i, 'Storyteller only.');
      return;
    }
    const tide = ctx.store.getTableState().tide;
    if (!tide) {
      await ctx.port.replyEphemeral(i, 'No Tide is open.');
      return;
    }
    const card = tideChannelCard(ctx, tide, true);
    closeTide(ctx.store, i.user.accountId);
    if (ctx.port.editReplyCard) await ctx.port.editReplyCard(i, card);
    return;
  }

  if (id.startsWith('wanting:')) {
    const slug = id.slice('wanting:'.length);
    const ch = ctx.store.getCharacterBySlug(slug);
    if (!ch || ch.initiator?.accountId !== i.user.accountId) {
      await ctx.port.replyEphemeral(i, 'Only the person who opened this draft can choose a Wanting.');
      return;
    }
    const card: ChatCard = {
      title: 'The Wanting',
      description: 'Choose one purchase. The desk approves it. Name the pay on your sheet.',
      footer: 'Only you see this.',
      selects: [
        {
          id: `wanting-menu:${slug}`,
          placeholder: 'A purchase…',
          options: [
            { value: 'plus_one_foundation', label: '+1 to one Foundation', description: 'Pay 3 skill points' },
            {
              value: 'plus_two_foundation_split',
              label: '+2 Foundation points, split',
              description: 'Pay 5 skill points, or a Negative Trait',
            },
            { value: 'plus_five_skill', label: '+5 skill points', description: 'Pay −1 from one Foundation' },
            { value: 'positive_trait', label: 'One Positive Trait', description: 'Pay 3 skill points' },
          ],
        },
      ],
    };
    if (ctx.port.replyEphemeralCard) await ctx.port.replyEphemeralCard(i, card);
    else {
      await ctx.port.replyEphemeral(
        i,
        'Choose on your sheet: +1 to one Foundation, +2 Foundation points split, +5 skill points, or one Positive Trait.',
      );
    }
    return;
  }

  if (
    id.startsWith('claim-second:') ||
    id.startsWith('claim-accept:') ||
    id.startsWith('claim-refuse:')
  ) {
    await handleSeenClaim(ctx, i, id);
    return;
  }

  await ctx.port.replyEphemeral(i, `Unhandled button: ${id}`);
}

/** Same query as `tidePicturePath` in hall-render. Dyes bust a chat client's cached still. */
function tideStillPath(tide: { position: number; dyeA: string; dyeB: string }): string {
  const dye = (hex: string) => hex.replace(/[^0-9a-f]/gi, '').toLowerCase();
  return `/session/tide.png?p=${tide.position}&a=${dye(tide.dyeA)}&b=${dye(tide.dyeB)}`;
}

function tideChannelCard(
  ctx: BotContext,
  tide: {
    sideA: string;
    sideB: string;
    position: number;
    length: number;
    size: string;
    footing: string;
    dyeA: string;
    dyeB: string;
  },
  closed: boolean,
): ChatCard {
  return buildTideCard({
    sideA: tide.sideA,
    sideB: tide.sideB,
    position: tide.position,
    length: tide.length,
    sizeLabel: tideSizeLabel(tide.size),
    footingLabel: tideFootingLabel(tide.footing, tide.sideA, tide.sideB),
    imageUrl: publicAssetUrl(ctx.liveBaseUrl, tideStillPath(tide)),
    closed,
  });
}

async function refreshTideCard(ctx: BotContext): Promise<void> {
  const tide = ctx.store.getTableState().tide;
  if (!tide?.messageRef) return;
  try {
    await ctx.port.editCard(tide.messageRef, tideChannelCard(ctx, tide, false));
  } catch {
    ctx.log('tide picture did not update');
  }
}

async function handleSeenClaim(
  ctx: BotContext,
  i: Extract<ChatInteraction, { type: 'button' }>,
  id: string,
): Promise<void> {
  const parts = id.split(':');
  const kind = parts[0];
  const slug = kind === 'claim-refuse' ? parts[2] : parts[1];
  const claimId = kind === 'claim-refuse' ? parts[3] : parts[2];
  if (!slug || !claimId) {
    await ctx.port.replyEphemeral(i, 'Missing claim.');
    return;
  }
  const target = ctx.store.getCharacterBySlug(slug);
  if (!target) {
    await ctx.port.replyEphemeral(i, 'Unknown character.');
    return;
  }
  try {
    if (kind === 'claim-second') {
      secondSeenClaim(ctx.store, {
        targetSlug: slug,
        claimId,
        accountId: i.user.accountId,
        actor: i.user.accountId,
      });
    } else if (kind === 'claim-accept') {
      acceptSeenClaim(ctx.store, { targetSlug: slug, claimId, actor: i.user.accountId });
    } else {
      const by = parts[1] === 'st' ? 'storyteller' : 'target';
      if (by === 'storyteller' && !isSt(ctx, i.user)) {
        await ctx.port.replyEphemeral(i, 'Storyteller only.');
        return;
      }
      if (by === 'target') {
        const account = target.player?.accountId ?? target.initiator?.accountId;
        if (account !== i.user.accountId) {
          await ctx.port.replyEphemeral(i, 'Only that person can refuse.');
          return;
        }
      }
      refuseSeenClaim(ctx.store, { targetSlug: slug, claimId, by, actor: i.user.accountId });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await ctx.port.replyEphemeral(i, msg);
    return;
  }
  const claim = target.creation?.seenClaims?.find((row) => row.id === claimId);
  const fresh = ctx.store.getCharacterBySlug(slug);
  const stored = fresh?.creation?.seenClaims?.find((row) => row.id === claimId) ?? claim;
  if (!stored || !ctx.port.editReplyCard) return;
  const closed = stored.accepted
    ? 'accepted'
    : stored.refusedByStoryteller && stored.refusedByTarget
      ? 'refused'
      : undefined;
  const avatar = fresh?.avatar ?? target.avatar;
  const thumbnailUrl = avatar?.startsWith('http://') || avatar?.startsWith('https://')
    ? fetchablePicture(avatar)
    : avatar
      ? publicAssetUrl(ctx.liveBaseUrl, `/api/avatar/${slug}`)
      : undefined;
  await ctx.port.editReplyCard(
    i,
    buildSeenClaimCard({
      personName: fresh?.name ?? target.name,
      line: stored.line,
      targetSlug: slug,
      claimId,
      thumbnailUrl,
      closed,
    }),
  );
}

/** Channel notice that a character was submitted. No sheet link. */
export function sessionInboxNotice(characterName: string): ChatCard {
  return {
    title: 'Session',
    description: `**${characterName}** was submitted for approval.`,
    footer: 'Approve or send it back from the Session desk.',
    accent: 'neutral',
  };
}

export interface RestoreNoticeChange {
  characterSlug: string;
  name: string;
  foodDays?: number;
  waterDays?: number;
  exertion?: number;
}

/** Private lines for people who have an account. Unbound names stay quiet. */
export function noticesForRestore(
  changes: readonly RestoreNoticeChange[],
  people: readonly { slug: string; accountId?: string }[],
): { accountId: string; text: string }[] {
  const notes: { accountId: string; text: string }[] = [];
  for (const change of changes) {
    const accountId = people.find((person) => person.slug === change.characterSlug)?.accountId;
    if (!accountId) continue;
    const bits: string[] = [];
    if (change.foodDays != null) bits.push(`food is now ${change.foodDays} days`);
    if (change.waterDays != null) bits.push(`water is now ${change.waterDays} days`);
    if (change.exertion != null) bits.push(`Exertion is now ${change.exertion}`);
    if (bits.length === 0) continue;
    notes.push({
      accountId,
      text: `Rest for **${change.name}**: ${bits.join('; ')}.`,
    });
  }
  return notes;
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

