import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';
import type { ChatCard, ChatSelect } from '@kodranni/chat-port';

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

/** REST JSON for channel messages / webhook follow-ups (no bot SDK on the Worker). */
export function mapCardToDiscordRest(card: ChatCard): {
  embeds: Record<string, unknown>[];
  components: Record<string, unknown>[];
} {
  const p = mapCardToDiscordPayload(card);
  return {
    embeds: p.embeds.map((e) => e.toJSON() as Record<string, unknown>),
    components: p.components.map((r) => r.toJSON() as Record<string, unknown>),
  };
}
