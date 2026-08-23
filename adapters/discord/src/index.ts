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
import { FOUNDATION_NAMES, filterSkillSuggestions } from '@kodranni/domain';
import type {
  ChatCard,
  ChatInteraction,
  ChatMessageRef,
  ChatPort,
  ChatSelect,
  ChatUserRef,
  CommandInteraction,
} from '@kodranni/chat-port';

const foundationChoices = () =>
  FOUNDATION_NAMES.map((f) => ({ name: f, value: f }));

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

  if (card.links?.length) {
    const linkRow = new ActionRowBuilder<ButtonBuilder>();
    for (const l of card.links.slice(0, 5)) {
      linkRow.addComponents(
        new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(l.label.slice(0, 80)).setURL(l.url),
      );
    }
    components.push(linkRow);
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
      sel.options.slice(0, 25).map((o) => {
        const opt: {
          label: string;
          value: string;
          description?: string;
          default?: boolean;
          emoji?: string;
        } = {
          label: o.label.slice(0, 100),
          value: o.value.slice(0, 100),
        };
        if (o.description) opt.description = o.description.slice(0, 100);
        if (o.default) opt.default = true;
        if (o.emoji) opt.emoji = o.emoji;
        return opt;
      }),
    );
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}

const dieTier = (o: {
  setName: (n: string) => typeof o;
  setDescription: (d: string) => typeof o;
  addChoices: (...c: { name: string; value: number }[]) => typeof o;
}) =>
  o
    .setName('tier')
    .setDescription('Die tier (ST agreement; default d8 Ordinary)')
    .addChoices(
      { name: 'd6 · Disadvantage', value: 6 },
      { name: 'd8 · Equal', value: 8 },
      { name: 'd12 · Advantage', value: 12 },
    );

const SLASH = [
  new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Roll what the table agreed — skill autocomplete, then confirm')
    .addStringOption((o) =>
      o
        .setName('skill')
        .setDescription('Skill (type to search; omit → pick Archetype)')
        .setAutocomplete(true),
    )
    .addStringOption((o) =>
      o
        .setName('foundation')
        .setDescription('Foundation (often not the guiding one)')
        .addChoices(...foundationChoices()),
    )
    .addIntegerOption((o) => dieTier(o))
    .addIntegerOption((o) =>
      o
        .setName('exertion')
        .setDescription('Exertion dice to spend (0–2; 2 needs Echo applies)')
        .setMinValue(0)
        .setMaxValue(2),
    )
    .addBooleanOption((o) =>
      o.setName('echo').setDescription('Echo applies — only if the table agreed it matches'),
    )
    .addStringOption((o) =>
      o.setName('character').setDescription('Character slug if you have more than one'),
    ),
  new SlashCommandBuilder()
    .setName('intent')
    .setDescription('ST: post the agreed pool for a player to Roll')
    .addUserOption((o) =>
      o.setName('player').setDescription('Player who should roll').setRequired(true),
    )
    .addStringOption((o) =>
      o.setName('skill').setDescription('Skill (type to search)').setAutocomplete(true),
    )
    .addStringOption((o) =>
      o
        .setName('foundation')
        .setDescription('Foundation (often not the guiding one)')
        .addChoices(...foundationChoices()),
    )
    .addIntegerOption((o) => dieTier(o))
    .addStringOption((o) =>
      o.setName('character').setDescription('Optional character slug for the player'),
    ),
  new SlashCommandBuilder()
    .setName('create')
    .setDescription('Start a character draft bound to you (edit on the live sheet)')
    .addStringOption((o) => o.setName('name').setDescription('Provisional character name')),
  new SlashCommandBuilder()
    .setName('claim')
    .setDescription('Claim an ST prebuilt / guest character')
    .addStringOption((o) =>
      o.setName('character').setDescription('Claimable character slug').setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName('focus')
    .setDescription('Set which of your characters is active for rolls')
    .addStringOption((o) =>
      o.setName('character').setDescription('Character slug').setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName('birth-omen')
    .setDescription('Weighing: private Birth Omen d20 → Foundation points on sheet')
    .addStringOption((o) =>
      o.setName('character').setDescription('Draft character slug').setRequired(true),
    )
    .addIntegerOption((o) =>
      o
        .setName('face')
        .setDescription('Optional fixed face 1–20 (tests); omit to roll')
        .setMinValue(1)
        .setMaxValue(20),
    ),
  new SlashCommandBuilder()
    .setName('guiding-hand')
    .setDescription('Weighing: private Guiding Hand d20 → Skill points on sheet')
    .addStringOption((o) =>
      o.setName('character').setDescription('Draft character slug').setRequired(true),
    )
    .addIntegerOption((o) =>
      o
        .setName('face')
        .setDescription('Optional fixed face 1–20; omit to roll')
        .setMinValue(1)
        .setMaxValue(20),
    ),
  new SlashCommandBuilder()
    .setName('award-word')
    .setDescription('ST: award 1 Word to a speaker after an accepted claim')
    .addStringOption((o) =>
      o.setName('character').setDescription('Speaker character slug').setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName('review')
    .setDescription('ST: post Approve/Changes/Deny cards for pending drafts')
    .addStringOption((o) =>
      o.setName('character').setDescription('Optional slug; omit to post all pending'),
    ),
  new SlashCommandBuilder()
    .setName('st-roll')
    .setDescription('ST NPC roll (numeric pool, no PC sheet)')
    .addIntegerOption((o) =>
      o.setName('foundation').setDescription('Foundation dice').setRequired(true),
    )
    .addIntegerOption((o) =>
      o.setName('skill').setDescription('Skill dice').setRequired(true),
    )
    .addStringOption((o) => o.setName('label').setDescription('NPC label'))
    .addIntegerOption((o) => dieTier(o)),
  new SlashCommandBuilder()
    .setName('live')
    .setDescription('Show live / archive sheet URLs'),
  new SlashCommandBuilder()
    .setName('map')
    .setDescription('Emergency: map user → character (prefer /create + Confirm)')
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
