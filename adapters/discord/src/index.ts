import {
  Client,
  Events,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
  type ChatInputCommandInteraction,
  type Interaction,
  type Message,
} from 'discord.js';
import { filterSkillSuggestions } from '@kodranni/domain';
import type {
  ChatCard,
  ChatInteraction,
  ChatMessageRef,
  ChatPort,
  ChatUserRef,
  CommandInteraction,
} from '@kodranni/chat-port';
import { SLASH } from './commands.js';
import { mapCardToDiscordPayload } from './card.js';

export { SLASH } from './commands.js';
export { mapCardToDiscordPayload, mapCardToDiscordRest } from './card.js';
export {
  createDiscordHttpAdapter,
  mapRawDiscordInteraction,
  type DiscordHttpOpts,
  type RawDiscordInteraction,
} from './http.js';

export function createDiscordAdapter(opts: {
  token: string;
  guildId: string;
  /** Optional: announce channel for session links */
  playChannelId?: string;
}): ChatPort & { client: Client; registerCommands: () => Promise<void> } {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    partials: [Partials.Channel],
  });

  let handler: ((i: ChatInteraction) => Promise<void>) | null = null;
  /** interaction token → for ephemeral replies */
  const pendingIx = new Map<string, Interaction>();

  async function registerCommands(): Promise<void> {
    const rest = new REST({ version: '10' }).setToken(opts.token);
    const appId = client.user?.id;
    if (!appId) throw new Error('Discord client not ready');
    await rest.put(Routes.applicationGuildCommands(appId, opts.guildId), {
      body: SLASH,
    });
  }

  client.on(Events.InteractionCreate, async (ix: Interaction) => {
    try {
      if (ix.isAutocomplete()) {
        const focused = ix.options.getFocused(true);
        if (focused.name === 'skill') {
          const picks = filterSkillSuggestions(String(focused.value ?? ''), 25);
          await ix.respond(
            picks.map((p) => ({
              name: `${p.name} · ${p.foundation}`.slice(0, 100),
              value: p.value.slice(0, 100),
            })),
          );
        } else {
          await ix.respond([]);
        }
        return;
      }
      if (!handler) return;
      if (ix.isChatInputCommand()) {
        if (!ix.deferred && !ix.replied) {
          await ix.deferReply({ ephemeral: true });
        }
        const mapped = mapSlash(ix);
        pendingIx.set(mapped.id, ix);
        await handler(mapped);
        pendingIx.delete(mapped.id);
        return;
      }
      if (ix.isButton()) {
        const mapped: ChatInteraction = {
          type: 'button',
          id: ix.id,
          clientEventId: `discord:btn:${ix.id}`,
          user: mapUser(ix),
          channelId: ix.channelId,
          guildId: ix.guildId ?? undefined,
          customId: ix.customId,
          messageRef: ix.message
            ? {
                platform: 'discord',
                channelId: ix.channelId,
                messageId: ix.message.id,
              }
            : undefined,
        };
        pendingIx.set(mapped.id, ix);
        if (!ix.deferred && !ix.replied) {
          await ix.deferUpdate().catch(() => undefined);
        }
        await handler(mapped);
        pendingIx.delete(mapped.id);
        return;
      }
      if (ix.isStringSelectMenu()) {
        const mapped: ChatInteraction = {
          type: 'select',
          id: ix.id,
          clientEventId: `discord:sel:${ix.id}`,
          user: mapUser(ix),
          channelId: ix.channelId,
          guildId: ix.guildId ?? undefined,
          customId: ix.customId,
          values: ix.values,
        };
        pendingIx.set(mapped.id, ix);
        if (!ix.deferred && !ix.replied) {
          await ix.deferUpdate().catch(() => undefined);
        }
        await handler(mapped);
        pendingIx.delete(mapped.id);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (ix.isRepliable() && !ix.replied) {
        await ix.reply({ content: msg.slice(0, 500), ephemeral: true }).catch(() => undefined);
      }
    }
  });

  return {
    platform: 'discord',
    client,
    registerCommands,
    async start() {
      await client.login(opts.token);
      await new Promise<void>((resolve) => {
        if (client.isReady()) resolve();
        else client.once(Events.ClientReady, () => resolve());
      });
      await registerCommands();
    },
    async stop() {
      client.destroy();
    },
    async sendCard(channelId: string, card: ChatCard): Promise<ChatMessageRef> {
      const ch = await client.channels.fetch(channelId);
      if (!ch || !ch.isTextBased() || ch.isDMBased()) {
        throw new Error(`cannot send to channel ${channelId}`);
      }
      const payload = mapCardToDiscordPayload(card);
      const msg = (await ch.send({
        embeds: payload.embeds,
        components: payload.components,
      })) as Message;
      return {
        platform: 'discord',
        channelId,
        messageId: msg.id,
      };
    },
    async editCard(ref: ChatMessageRef, card: ChatCard): Promise<void> {
      const ch = await client.channels.fetch(ref.channelId);
      if (!ch || !ch.isTextBased()) return;
      const msg = await ch.messages.fetch(ref.messageId);
      const payload = mapCardToDiscordPayload(card);
      await msg.edit({ embeds: payload.embeds, components: payload.components });
    },
    async replyEphemeral(interaction: ChatInteraction, content: string): Promise<void> {
      const ix = pendingIx.get(interaction.id);
      if (!ix || !ix.isRepliable()) return;
      if (ix.deferred || ix.replied) {
        await ix.followUp({ content: content.slice(0, 2000), ephemeral: true });
      } else {
        await ix.reply({ content: content.slice(0, 2000), ephemeral: true });
      }
    },
    async editReplyCard(interaction: ChatInteraction, card: ChatCard): Promise<void> {
      const ix = pendingIx.get(interaction.id);
      if (!ix || !ix.isRepliable()) return;
      const payload = mapCardToDiscordPayload(card);
      if (ix.deferred || ix.replied) {
        await ix.editReply({
          content: null,
          embeds: payload.embeds,
          components: payload.components,
        });
      } else {
        await ix.reply({
          ephemeral: true,
          embeds: payload.embeds,
          components: payload.components,
        });
      }
    },
    onInteraction(h) {
      handler = h;
    },
  };
}

function discordRoleIds(ix: Interaction): string[] | undefined {
  if (!ix.inGuild() || !ix.member) return undefined;
  const roles = ix.member.roles;
  if (roles && typeof roles === 'object' && 'cache' in roles) {
    return [...(roles as { cache: Map<string, unknown> }).cache.keys()];
  }
  if (Array.isArray(roles)) return roles as string[];
  return undefined;
}

function mapUser(ix: Interaction): ChatUserRef {
  return {
    platform: 'discord',
    accountId: ix.user.id,
    displayName: ix.user.username,
    roleIds: discordRoleIds(ix),
  };
}

function mapSlash(ix: ChatInputCommandInteraction): CommandInteraction {
  const options: Record<string, string | number | boolean | undefined> = {};
  for (const opt of ix.options.data) {
    options[opt.name] = opt.value as string | number | boolean | undefined;
  }
  // Flatten user options to account ids
  const userOpt = ix.options.getUser('user');
  if (userOpt) options.user = userOpt.id;
  const playerOpt = ix.options.getUser('player');
  if (playerOpt) options.player = playerOpt.id;
  return {
    type: 'command',
    id: ix.id,
    clientEventId: `discord:cmd:${ix.id}`,
    user: mapUser(ix),
    channelId: ix.channelId,
    guildId: ix.guildId ?? undefined,
    name: ix.commandName,
    options,
  };
}
