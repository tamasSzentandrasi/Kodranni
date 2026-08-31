/**
 * HTTP ChatPort: Discord interactions arrive as JSON (Worker → host).
 * Channel send/edit goes through the Worker (bot token stays off the host).
 * Interaction replies use the webhook token in the payload (no bot token).
 */
import { createHmac } from 'node:crypto';
import type {
  ChatCard,
  ChatInteraction,
  ChatMessageRef,
  ChatPort,
  ChatUserRef,
  CommandInteraction,
} from '@kodranni/chat-port';
import { mapCardToDiscordRest } from './card.js';

const FLAG_EPHEMERAL = 1 << 6;
const TYPE_COMMAND = 2;
const TYPE_COMPONENT = 3;
const COMPONENT_BUTTON = 2;
const COMPONENT_SELECT = 3;
const OPTION_USER = 6;

export interface DiscordHttpOpts {
  campaignId: string;
  /** Worker origin used for sendCard/editCard (bot token lives there). */
  edgeUrl?: string;
  deviceKey?: string;
  applicationId?: string;
}

type Pending = {
  token: string;
  applicationId: string;
  kind: 'command' | 'component';
};

export type RawDiscordInteraction = {
  id?: string;
  type?: number;
  token?: string;
  application_id?: string;
  guild_id?: string;
  channel_id?: string;
  channel?: { id?: string };
  member?: {
    user?: { id?: string; username?: string };
    roles?: string[];
  };
  user?: { id?: string; username?: string };
  data?: {
    name?: string;
    custom_id?: string;
    component_type?: number;
    values?: string[];
    options?: RawOption[];
  };
  message?: { id?: string; channel_id?: string };
};

type RawOption = {
  name: string;
  type?: number;
  value?: string | number | boolean;
  options?: RawOption[];
};

export function mapRawDiscordInteraction(raw: RawDiscordInteraction): ChatInteraction | null {
  const id = raw.id;
  if (!id || (raw.type !== TYPE_COMMAND && raw.type !== TYPE_COMPONENT)) return null;
  const user = mapRawUser(raw);
  const channelId = raw.channel_id ?? raw.channel?.id ?? raw.message?.channel_id ?? '';
  const guildId = raw.guild_id;
  if (raw.type === TYPE_COMMAND) {
    return mapRawCommand(raw, id, user, channelId, guildId);
  }
  const customId = raw.data?.custom_id ?? '';
  const componentType = raw.data?.component_type;
  if (componentType === COMPONENT_SELECT || (raw.data?.values && raw.data.values.length)) {
    return {
      type: 'select',
      id,
      clientEventId: `discord:sel:${id}`,
      user,
      channelId,
      guildId,
      customId,
      values: raw.data?.values ?? [],
    };
  }
  if (componentType === COMPONENT_BUTTON || customId) {
    return {
      type: 'button',
      id,
      clientEventId: `discord:btn:${id}`,
      user,
      channelId,
      guildId,
      customId,
      messageRef: raw.message?.id
        ? { platform: 'discord', channelId, messageId: raw.message.id }
        : undefined,
    };
  }
  return null;
}

function mapRawUser(raw: RawDiscordInteraction): ChatUserRef {
  const u = raw.member?.user ?? raw.user;
  return {
    platform: 'discord',
    accountId: u?.id ?? '',
    displayName: u?.username,
    roleIds: raw.member?.roles,
  };
}

function flattenOptions(
  options: RawOption[] | undefined,
  into: Record<string, string | number | boolean | undefined>,
): void {
  if (!options) return;
  for (const opt of options) {
    if (opt.options?.length) flattenOptions(opt.options, into);
    if (opt.value === undefined) continue;
    into[opt.name] = opt.type === OPTION_USER ? String(opt.value) : opt.value;
  }
}

function mapRawCommand(
  raw: RawDiscordInteraction,
  id: string,
  user: ChatUserRef,
  channelId: string,
  guildId?: string,
): CommandInteraction {
  const options: Record<string, string | number | boolean | undefined> = {};
  flattenOptions(raw.data?.options, options);
  return {
    type: 'command',
    id,
    clientEventId: `discord:cmd:${id}`,
    user,
    channelId,
    guildId,
    name: raw.data?.name ?? '',
    options,
  };
}

function hmacHex(key: string, data: string): string {
  return createHmac('sha256', key).update(data).digest('hex');
}

export function createDiscordHttpAdapter(
  opts: DiscordHttpOpts,
): ChatPort & { receive: (raw: unknown) => Promise<void> } {
  let handler: ((i: ChatInteraction) => Promise<void>) | null = null;
  const pending = new Map<string, Pending>();

  async function webhook(
    p: Pending,
    method: 'POST' | 'PATCH',
    path: string,
    body: Record<string, unknown>,
  ): Promise<void> {
    const dest = `https://discord.com/api/v10/webhooks/${p.applicationId}/${p.token}${path}`;
    const res = await fetch(dest, {
      method,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok && res.status !== 404) {
      const text = await res.text().catch(() => '');
      throw new Error(`discord webhook ${res.status}: ${text.slice(0, 180)}`);
    }
  }

  async function edgeRest(body: Record<string, unknown>): Promise<{ id?: string }> {
    const edge = opts.edgeUrl?.replace(/\/$/, '');
    if (!edge || !opts.deviceKey) {
      throw new Error('discord HTTP send/edit needs edge URL + device key');
    }
    const raw = JSON.stringify(body);
    const url = `${edge}/control/discord/rest?campaign=${encodeURIComponent(opts.campaignId)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${opts.campaignId}:${hmacHex(opts.deviceKey, raw)}`,
      },
      body: raw,
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`edge discord rest ${res.status}: ${text.slice(0, 180)}`);
    }
    return (await res.json()) as { id?: string };
  }

  return {
    platform: 'discord',
    async start() {
      /* inbound HTTP — no gateway */
    },
    async stop() {
      pending.clear();
      handler = null;
    },
    async sendCard(channelId: string, card: ChatCard): Promise<ChatMessageRef> {
      const payload = mapCardToDiscordRest(card);
      const msg = await edgeRest({ op: 'send', channelId, payload });
      if (!msg.id) throw new Error('discord send missing message id');
      return { platform: 'discord', channelId, messageId: msg.id };
    },
    async editCard(ref: ChatMessageRef, card: ChatCard): Promise<void> {
      await edgeRest({
        op: 'edit',
        channelId: ref.channelId,
        messageId: ref.messageId,
        payload: mapCardToDiscordRest(card),
      });
    },
    async replyEphemeral(interaction: ChatInteraction, content: string): Promise<void> {
      const p = pending.get(interaction.id);
      if (!p) return;
      const body = { content: content.slice(0, 2000), flags: FLAG_EPHEMERAL };
      if (p.kind === 'command') {
        await webhook(p, 'PATCH', '/messages/@original', body);
      } else {
        await webhook(p, 'POST', '', body);
      }
    },
    async editReplyCard(interaction: ChatInteraction, card: ChatCard): Promise<void> {
      const p = pending.get(interaction.id);
      if (!p) return;
      const payload = mapCardToDiscordRest(card);
      await webhook(p, 'PATCH', '/messages/@original', {
        content: null,
        flags: p.kind === 'command' ? FLAG_EPHEMERAL : undefined,
        embeds: payload.embeds,
        components: payload.components,
      });
    },
    onInteraction(h) {
      handler = h;
    },
    async receive(raw: unknown) {
      const ix = (raw ?? {}) as RawDiscordInteraction;
      const mapped = mapRawDiscordInteraction(ix);
      if (!mapped || !handler) return;
      if (!ix.token || !ix.application_id) return;
      pending.set(mapped.id, {
        token: ix.token,
        applicationId: ix.application_id,
        kind: mapped.type === 'command' ? 'command' : 'component',
      });
      try {
        await handler(mapped);
      } finally {
        pending.delete(mapped.id);
      }
    },
  };
}
