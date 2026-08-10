import type { ChatCard, ChatPort, ChatInteraction, ChatMessageRef } from '@kodranni/chat-port';

/**
 * Discord adapter — skeleton implementing ChatPort.
 * Full discord.js wiring lands when bot-runtime session start is built.
 */
export function createDiscordAdapter(_opts: {
  token: string;
  guildId: string;
}): ChatPort {
  let handler: ((i: ChatInteraction) => Promise<void>) | null = null;

  return {
    platform: 'discord',
    async start() {
      // TODO: gateway + interaction routes
    },
    async stop() {},
    async sendCard(_channelId: string, _card: ChatCard): Promise<ChatMessageRef> {
      throw new Error('Discord adapter not connected — session runtime pending');
    },
    async editCard() {},
    async replyEphemeral() {},
    onInteraction(h) {
      handler = h;
    },
  };
}

export function mapCardToDiscordPayload(card: ChatCard): {
  embeds: unknown[];
  components: unknown[];
} {
  // Structural mapping preview for tests / later discord.js builders
  const color = card.accent === 'blood' ? 0x8a1515 : 0x2a2222;
  const embeds = [
    {
      title: card.title,
      description: card.description,
      color,
      fields: card.fields?.map((f) => ({
        name: f.name,
        value: f.value,
        inline: f.inline ?? false,
      })),
      footer: card.footer ? { text: card.footer } : undefined,
    },
  ];
  const row =
    card.buttons?.map((b) => ({
      type: 2,
      custom_id: b.id,
      label: b.label,
      style: b.style === 'danger' ? 4 : b.style === 'success' ? 3 : b.style === 'primary' ? 1 : 2,
    })) ?? [];
  const components = row.length ? [{ type: 1, components: row.slice(0, 5) }] : [];
  return { embeds, components };
}
