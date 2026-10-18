/**
 * Gateway dispatch → the shared chat interaction.
 * A leading ! is a command. A reaction on a card we posted is that button.
 */
import type { ChatInteraction } from '@kodranni/chat-port';
import { parsePrefixCommand, prefixCommandOptions } from './prefix.js';

export interface StoredReaction {
  emoji: string;
  id: string;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/** Fluxer snowflakes are decimal strings. A numeric one still has to match the saved role. */
function snowflake(value: unknown): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isSafeInteger(value)) return String(value);
  return '';
}

function rolesOf(member: Record<string, unknown>): string[] {
  if (!Array.isArray(member.roles)) return [];
  return member.roles.map(snowflake).filter((role) => role.length > 0);
}

export function readyUserId(data: unknown): string {
  return snowflake(record(record(data).user).id);
}

export function interactionFromFluxerEvent(input: {
  t: string;
  d: unknown;
  selfId?: string;
  guildId?: string;
  playChannelId?: string;
  reactions: ReadonlyMap<string, readonly StoredReaction[]>;
}): ChatInteraction | null {
  const data = record(input.d);
  const channelId = snowflake(data.channel_id);
  const guildId = snowflake(data.guild_id);
  if (input.playChannelId && channelId !== input.playChannelId) return null;
  if (input.guildId && guildId !== input.guildId) return null;
  if (!channelId) return null;

  if (input.t === 'MESSAGE_CREATE') {
    const author = record(data.author);
    if (author.bot === true) return null;
    const accountId = snowflake(author.id);
    if (!accountId || (input.selfId && accountId === input.selfId)) return null;
    const parsed = parsePrefixCommand(text(data.content));
    if (!parsed) return null;
    const member = record(data.member);
    const displayName = text(member.nick) || text(author.global_name) || text(author.username);
    const id = snowflake(data.id) || `${channelId}:${accountId}`;
    return {
      type: 'command',
      id,
      clientEventId: id,
      user: {
        platform: 'fluxer',
        accountId,
        displayName: displayName || undefined,
        roleIds: rolesOf(member),
      },
      channelId,
      guildId: guildId || undefined,
      name: parsed.name,
      options: prefixCommandOptions(parsed.name, parsed.args),
    };
  }

  if (input.t === 'MESSAGE_REACTION_ADD') {
    const accountId = snowflake(data.user_id);
    if (!accountId || (input.selfId && accountId === input.selfId)) return null;
    const messageId = snowflake(data.message_id);
    const emoji = text(record(data.emoji).name);
    const match = input.reactions.get(messageId)?.find((row) => row.emoji === emoji);
    if (!match) return null;
    const member = record(data.member);
    const user = record(member.user);
    const displayName = text(member.nick) || text(user.global_name) || text(user.username);
    const id = `${messageId}:${emoji}:${accountId}`;
    return {
      type: 'button',
      id,
      clientEventId: id,
      user: {
        platform: 'fluxer',
        accountId,
        displayName: displayName || undefined,
        roleIds: rolesOf(member),
      },
      channelId,
      guildId: guildId || undefined,
      customId: match.id,
      messageRef: { platform: 'fluxer', channelId, messageId },
    };
  }

  return null;
}
