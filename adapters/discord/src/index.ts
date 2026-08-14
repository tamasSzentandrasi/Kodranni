import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  type ChatInputCommandInteraction,
  type Interaction,
  type Message,
} from 'discord.js';
import type {
  ChatCard,
  ChatInteraction,
  ChatMessageRef,
  ChatPort,
  ChatSelect,
  CommandInteraction,
} from '@kodranni/chat-port';

const STYLE: Record<string, ButtonStyle> = {
  primary: ButtonStyle.Primary,
  secondary: ButtonStyle.Secondary,
  success: ButtonStyle.Success,
  danger: ButtonStyle.Danger,
};

export function mapCardToDiscordPayload(card: ChatCard): {
  embeds: EmbedBuilder[];
  components: ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[];
} {
  const color = card.accent === 'blood' ? 0x8a1515 : 0x2a2222;
  const embed = new EmbedBuilder().setColor(color);
  if (card.title) embed.setTitle(card.title);
  if (card.description) embed.setDescription(card.description);
  if (card.fields?.length) {
    embed.addFields(
      card.fields.map((f) => ({
        name: f.name,
        value: f.value.slice(0, 1024),
        inline: f.inline ?? false,
      })),
    );
  }
  if (card.footer) embed.setFooter({ text: card.footer.slice(0, 2048) });
  if (card.links?.length) {
    const linkLine = card.links.map((l) => `[${l.label}](${l.url})`).join(' · ');
    const prev = embed.data.description ?? '';
    embed.setDescription([prev, linkLine].filter(Boolean).join('\n\n'));
  }

  const components: ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[] = [];

  if (card.buttons?.length) {
    const row = new ActionRowBuilder<ButtonBuilder>();
    for (const b of card.buttons.slice(0, 5)) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(b.id.slice(0, 100))
          .setLabel(b.label.slice(0, 80))
          .setStyle(STYLE[b.style ?? 'secondary'] ?? ButtonStyle.Secondary)
          .setDisabled(Boolean(b.disabled)),
      );
    }
    components.push(row);
  }

  if (card.selects?.length) {
    for (const sel of card.selects.slice(0, 3)) {
      components.push(selectToRow(sel));
    }
  }

  return { embeds: [embed], components };
}

function selectToRow(sel: ChatSelect): ActionRowBuilder<StringSelectMenuBuilder> {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(sel.id.slice(0, 100))
    .setPlaceholder((sel.placeholder ?? 'Choose…').slice(0, 150))
    .setMinValues(sel.minValues ?? 1)
    .setMaxValues(sel.maxValues ?? 1)
    .addOptions(
      sel.options.slice(0, 25).map((o) => ({
        label: o.label.slice(0, 100),
        value: o.value.slice(0, 100),
        description: o.description?.slice(0, 100),
      })),
    );
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}

const SLASH = [
  new SlashCommandBuilder()
    .setName('kod-map')
    .setDescription('Map a Discord user to a character (ST)')
    .addUserOption((o) => o.setName('user').setDescription('Discord user').setRequired(true))
    .addStringOption((o) =>
      o.setName('character').setDescription('Character slug').setRequired(true),
    )
    .addStringOption((o) =>
      o
        .setName('role')
        .setDescription('player or storyteller')
        .addChoices(
          { name: 'player', value: 'player' },
          { name: 'storyteller', value: 'storyteller' },
        ),
    ),
  new SlashCommandBuilder()
    .setName('kod-prompt')
    .setDescription('ST: set roll config; player presses Roll')
    .addStringOption((o) =>
      o.setName('foundation').setDescription('e.g. Authority').setRequired(true),
    )
    .addStringOption((o) => o.setName('skill').setDescription('Skill name (omit for Primitive)'))
    .addIntegerOption((o) =>
      o
        .setName('tier')
        .setDescription('Die tier 6|8|12')
        .addChoices(
          { name: 'd6', value: 6 },
          { name: 'd8', value: 8 },
          { name: 'd12', value: 12 },
        ),
    )
    .addStringOption((o) =>
      o.setName('character').setDescription('Optional character slug for the card'),
    ),
  new SlashCommandBuilder()
    .setName('kod-roll')
    .setDescription('Player roll from your mapped character')
    .addStringOption((o) =>
      o.setName('foundation').setDescription('e.g. Strength').setRequired(true),
    )
    .addStringOption((o) => o.setName('skill').setDescription('Skill name'))
    .addIntegerOption((o) =>
      o
        .setName('tier')
        .setDescription('Die tier')
        .addChoices(
          { name: 'd6', value: 6 },
          { name: 'd8', value: 8 },
          { name: 'd12', value: 12 },
        ),
    )
    .addIntegerOption((o) =>
      o
        .setName('exertion')
        .setDescription('0–2 (2 needs Echo)')
        .setMinValue(0)
        .setMaxValue(2),
    )
    .addBooleanOption((o) => o.setName('echo').setDescription('Invoke a matching Echo')),
  new SlashCommandBuilder()
    .setName('kod-st-roll')
    .setDescription('ST NPC roll (no PC sheet)')
    .addIntegerOption((o) =>
      o.setName('foundation').setDescription('Foundation dice').setRequired(true),
    )
    .addIntegerOption((o) =>
      o.setName('skill').setDescription('Skill dice').setRequired(true),
    )
    .addStringOption((o) => o.setName('label').setDescription('NPC label'))
    .addIntegerOption((o) =>
      o
        .setName('tier')
        .setDescription('Die tier')
        .addChoices(
          { name: 'd6', value: 6 },
          { name: 'd8', value: 8 },
          { name: 'd12', value: 12 },
        ),
    ),
  new SlashCommandBuilder()
    .setName('kod-live')
    .setDescription('Post live / archive sheet links'),
].map((c) => c.toJSON());

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
    if (!handler) return;
    try {
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
          user: {
            platform: 'discord',
            accountId: ix.user.id,
            displayName: ix.user.username,
          },
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
          user: {
            platform: 'discord',
            accountId: ix.user.id,
            displayName: ix.user.username,
          },
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
    onInteraction(h) {
      handler = h;
    },
  };
}

function mapSlash(ix: ChatInputCommandInteraction): CommandInteraction {
  const options: Record<string, string | number | boolean | undefined> = {};
  for (const opt of ix.options.data) {
    options[opt.name] = opt.value as string | number | boolean | undefined;
  }
  // Flatten user option to id
  const user = ix.options.getUser('user');
  if (user) options.user = user.id;
  return {
    type: 'command',
    id: ix.id,
    clientEventId: `discord:cmd:${ix.id}`,
    user: {
      platform: 'discord',
      accountId: ix.user.id,
      displayName: ix.user.username,
    },
    channelId: ix.channelId,
    guildId: ix.guildId ?? undefined,
    name: ix.commandName,
    options,
  };
}
