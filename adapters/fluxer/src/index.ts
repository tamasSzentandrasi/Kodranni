import {
  cardAccentColor,
  type ChatCard,
  type ChatPort,
  type ChatInteraction,
  type ChatMessageRef,
} from '@kodranni/chat-port';
import { createFluxerGateway, fluxerGatewayToken, type FluxerSocket } from './gateway.js';
import {
  interactionFromFluxerEvent,
  readyUserId,
  rolesFromMemberBody,
  type StoredReaction,
} from './inbound.js';

export { FLUXER_PREFIX_COMMANDS, parsePrefixCommand, prefixCommandOptions } from './prefix.js';
export type { FluxerPrefixCommand } from './prefix.js';
export type { FluxerSocket } from './gateway.js';

/** Bot HTTP host. The web app host answers the same post with INVALID_API_ORIGIN. */
const FLUXER_API = 'https://api.fluxer.app/v1';

/**
 * Fluxer ChatPort. The card on the wire is the Discord embed.
 * One reaction stands in for each enabled button.
 * start() opens the gateway only when a socket constructor is passed.
 */
export function createFluxerAdapter(opts: {
  token: string;
  guildId: string;
  playChannelId?: string;
  apiBase?: string;
  fetch?: typeof fetch;
  gateway?: {
    url?: string;
    WebSocket: new (url: string) => FluxerSocket;
  };
  /** Desk log. A failed command must not vanish, and the line must not carry a snowflake. */
  log?: (line: string) => void;
}): ChatPort {
  const token = fluxerGatewayToken(opts.token);
  const base = (opts.apiBase ?? FLUXER_API).replace(/\/$/, '');
  const fetchImpl = opts.fetch ?? fetch;
  const call = (method: string, path: string, body?: unknown) =>
    fluxerCall(fetchImpl, token, method, `${base}${path}`, body);
  const reactions = new Map<string, StoredReaction[]>();
  const replies = new Map<string, ChatMessageRef>();
  let selfId = '';
  let handler: ((i: ChatInteraction) => Promise<void>) | undefined;
  let gateway: { stop(): void } | undefined;

  async function deliver(channelId: string, card: ChatCard): Promise<ChatMessageRef> {
    const mapped = mapCardToFluxerPayload(card);
    const posted = await call(
      'POST',
      `/channels/${encodeURIComponent(channelId)}/messages`,
      wireMessage(mapped),
    );
    const messageId = messageIdFrom(posted);
    if (!messageId) throw new Error('fluxer post returned no message');
    const stored = mapped.reactions ?? [];
    reactions.set(messageId, stored);
    await putReactions(call, channelId, messageId, stored);
    return { platform: 'fluxer', channelId, messageId };
  }

  return {
    platform: 'fluxer',
    async start() {
      if (!opts.gateway || gateway) return;
      const connection = createFluxerGateway({
        token,
        guildId: opts.guildId,
        url: opts.gateway.url,
        WebSocket: opts.gateway.WebSocket,
      });
      gateway = connection;
      connection.onDispatch((event) => {
        if (event.t === 'READY') selfId = readyUserId(event.d);
        void (async () => {
          const interaction = interactionFromFluxerEvent({
            t: event.t,
            d: event.d,
            selfId,
            guildId: opts.guildId,
            playChannelId: opts.playChannelId,
            reactions,
          });
          if (!interaction || !handler) return;
          // A Fluxer message has no member. The Storyteller role is on the membership.
          if (interaction.user.roleIds === undefined) {
            interaction.user.roleIds = await memberRoles(
              call,
              opts.log,
              interaction.guildId || opts.guildId,
              interaction.user.accountId,
            );
          }
          await handler(interaction);
        })().catch((err: unknown) => {
          const raw = err instanceof Error ? err.message : String(err);
          opts.log?.(`fluxer command failed: ${raw.replace(/\d{6,}/g, '#')}`);
        });
      });
      try {
        await connection.start();
      } catch (err) {
        gateway = undefined;
        throw err;
      }
    },
    async stop() {
      gateway?.stop();
      gateway = undefined;
    },
    sendCard: deliver,
    async editCard(ref: ChatMessageRef, card: ChatCard) {
      const mapped = mapCardToFluxerPayload(card);
      const channel = encodeURIComponent(ref.channelId);
      const message = encodeURIComponent(ref.messageId);
      await call('PATCH', `/channels/${channel}/messages/${message}`, wireMessage(mapped));
      await call('DELETE', `/channels/${channel}/messages/${message}/reactions`);
      const stored = mapped.reactions ?? [];
      reactions.set(ref.messageId, stored);
      await putReactions(call, ref.channelId, ref.messageId, stored);
    },
    async replyEphemeral(i, content) {
      if (!content.trim()) return;
      await call('POST', `/channels/${encodeURIComponent(i.channelId)}/messages`, { content });
    },
    async editReplyCard(i, card) {
      const ref = replies.get(i.id) ?? i.messageRef;
      if (!ref) {
        replies.set(i.id, await deliver(i.channelId, card));
        return;
      }
      const mapped = mapCardToFluxerPayload(card);
      const channel = encodeURIComponent(ref.channelId);
      const message = encodeURIComponent(ref.messageId);
      await call('PATCH', `/channels/${channel}/messages/${message}`, wireMessage(mapped));
      await call('DELETE', `/channels/${channel}/messages/${message}/reactions`);
      const stored = mapped.reactions ?? [];
      reactions.set(ref.messageId, stored);
      await putReactions(call, ref.channelId, ref.messageId, stored);
    },
    async replyEphemeralCard(i, card) {
      replies.set(i.id, await deliver(i.channelId, card));
    },
    onInteraction(next) {
      handler = next;
    },
  };
}

function wireMessage(mapped: { content?: string; embeds: unknown[] }): {
  content?: string;
  embeds: unknown[];
} {
  return mapped.content ? { content: mapped.content, embeds: mapped.embeds } : { embeds: mapped.embeds };
}

/** GET the member. A missing role list is empty, and the failure stays off the card. */
async function memberRoles(
  call: (method: string, path: string) => Promise<string>,
  log: ((line: string) => void) | undefined,
  guildId: string,
  accountId: string,
): Promise<string[]> {
  if (!guildId || !accountId) return [];
  try {
    const text = await call(
      'GET',
      `/guilds/${encodeURIComponent(guildId)}/members/${encodeURIComponent(accountId)}`,
    );
    return rolesFromMemberBody(text);
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    log?.(`fluxer member roles failed: ${raw.replace(/\d{6,}/g, '#')}`);
    return [];
  }
}

async function putReactions(
  call: (method: string, path: string) => Promise<string>,
  channelId: string,
  messageId: string,
  reactions: { emoji: string }[],
): Promise<void> {
  const channel = encodeURIComponent(channelId);
  const message = encodeURIComponent(messageId);
  for (const reaction of reactions) {
    const emoji = encodeURIComponent(reaction.emoji);
    await call('PUT', `/channels/${channel}/messages/${message}/reactions/${emoji}/@me`);
  }
}

async function fluxerCall(
  fetchImpl: typeof fetch,
  token: string,
  method: string,
  url: string,
  body?: unknown,
): Promise<string> {
  if (!token) throw new Error('fluxer token is missing');
  const res = await fetchImpl(url, {
    method,
    headers: {
      Authorization: `Bot ${token}`,
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw fluxerFailure(method, res.status, text);
  return text;
}

/** Status and Fluxer’s code only. The body can carry ids, so it stays out of the log. */
function fluxerFailure(method: string, status: number, text: string): Error {
  let code = '';
  try {
    const parsed = JSON.parse(text) as { code?: unknown };
    if (typeof parsed.code === 'string' && /^[A-Z0-9_]+$/.test(parsed.code)) code = parsed.code;
  } catch {
    /* status is enough */
  }
  return new Error(`fluxer ${method.toLowerCase()} failed (${status}${code ? ` ${code}` : ''})`);
}

function messageIdFrom(text: string): string {
  try {
    const parsed = JSON.parse(text) as { id?: unknown };
    return typeof parsed.id === 'string' ? parsed.id : '';
  } catch {
    return '';
  }
}

const REACTION_EMOJI: readonly [string, string][] = [
  ['oppose:', '⚔'],
  ['why-pool:', '❓'],
  ['st-harm:', '🩸'],
  ['undo:', '↩'],
  ['claim-second:', '✋'],
  ['claim-accept:', '✅'],
  ['claim-refuse:st:', '🚫'],
  ['claim-refuse:target:', '🙅'],
];

function reactionEmoji(id: string): string | undefined {
  if (id === 'tide-roll') return '🎲';
  if (id === 'tide-close') return '✕';
  return REACTION_EMOJI.find(([prefix]) => id.startsWith(prefix))?.[1];
}

/** One reaction per mapped button. A disabled button emits none. Components stay for when item 7 ships. */
export function fluxerReactions(card: ChatCard): { emoji: string; id: string }[] {
  const reactions: { emoji: string; id: string }[] = [];
  for (const button of card.buttons ?? []) {
    if (button.disabled) continue;
    const emoji = reactionEmoji(button.id);
    if (!emoji) continue;
    reactions.push({ emoji, id: button.id });
  }
  return reactions;
}

function storytellerOnly(id: string): boolean {
  return (
    id === 'tide-close' ||
    id.startsWith('st-harm:') ||
    id.startsWith('undo:') ||
    id.startsWith('claim-refuse:st:')
  );
}

function spentChoice(id: string): boolean {
  return (
    id === 'tide-close' ||
    id.startsWith('undo:') ||
    id.startsWith('st-harm:') ||
    id.startsWith('claim-second:') ||
    id.startsWith('claim-accept:') ||
    id.startsWith('claim-refuse:')
  );
}

/**
 * What the connected adapter would do with one reaction.
 * Harm, Undo, Close, and the Storyteller’s refuse are removed when the sender is not the Storyteller.
 * Oppose and Why this pool stay. A spent choice clears the reactions after the edit.
 */
export function resolveFluxerReaction(input: {
  customId: string;
  actorIsStoryteller: boolean;
}): { allowed: boolean; remove: boolean; once: boolean } {
  if (storytellerOnly(input.customId) && !input.actorIsStoryteller) {
    return { allowed: false, remove: true, once: false };
  }
  return { allowed: true, remove: false, once: spentChoice(input.customId) };
}

function plainDice(text: string): string {
  return text
    .replaceAll('{{kod-die:d6}}', '🎲')
    .replaceAll('{{kod-die:d8}}', '🎲')
    .replaceAll('{{kod-die:d12}}', '🎲');
}

/** Fluxer mapping reuses the same card model; payload shape tracked as capability matures. */
export function mapCardToFluxerPayload(card: ChatCard): {
  content?: string;
  embeds: unknown[];
  components: unknown[];
  reactions?: { emoji: string; id: string }[];
} {
  const reactions = fluxerReactions(card);
  const color = card.color ?? cardAccentColor(card.accent);
  return {
    embeds: [
      {
        title: card.title,
        description: card.description == null ? undefined : plainDice(card.description),
        color,
        fields: card.fields?.map((field) => ({
          ...field,
          value: plainDice(field.value),
        })),
        footer: card.footer ? { text: card.footer } : undefined,
        thumbnail: card.thumbnailUrl ? { url: card.thumbnailUrl } : undefined,
        image: card.imageUrl ? { url: card.imageUrl } : undefined,
      },
      ...(card.panels ?? []).map((panel) => ({
        title: panel.title,
        description: panel.description == null ? undefined : plainDice(panel.description),
        color,
        fields: panel.fields?.map((field) => ({
          ...field,
          value: plainDice(field.value),
        })),
        footer: panel.footer ? { text: panel.footer } : undefined,
      })),
    ],
    components: card.buttons?.length
      ? [
          {
            type: 1,
            components: card.buttons.slice(0, 5).map((b) => ({
              type: 2,
              custom_id: b.id,
              label: b.label,
              disabled: Boolean(b.disabled),
            })),
          },
        ]
      : [],
    ...(reactions.length ? { reactions } : {}),
  };
}
