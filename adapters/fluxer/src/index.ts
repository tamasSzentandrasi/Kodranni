import type { ChatCard, ChatPort, ChatInteraction, ChatMessageRef } from '@kodranni/chat-port';

/**
 * Fluxer adapter — equal peer to Discord (Discord-shaped API).
 * Skeleton until bot-runtime session start; same ChatPort + shared cards.
 */
export function createFluxerAdapter(_opts: {
  token: string;
  guildId: string;
  apiBase?: string;
}): ChatPort {
  return {
    platform: 'fluxer',
    async start() {
      // TODO: Fluxer gateway / HTTP (wire-compat path)
    },
    async stop() {},
    async sendCard(_channelId: string, _card: ChatCard): Promise<ChatMessageRef> {
      throw new Error('Fluxer adapter not connected — session runtime pending');
    },
    async editCard() {},
    async replyEphemeral() {},
    onInteraction(_h: (i: ChatInteraction) => Promise<void>) {},
  };
}

/** Fluxer mapping reuses the same card model; payload shape tracked as capability matures. */
export function mapCardToFluxerPayload(card: ChatCard): {
  content?: string;
  embeds: unknown[];
  components: unknown[];
} {
  const color = card.accent === 'blood' ? 0x8a1515 : 0x2a2222;
  return {
    embeds: [
      {
        title: card.title,
        description: card.description,
        color,
        fields: card.fields,
        footer: card.footer ? { text: card.footer } : undefined,
      },
    ],
    components: card.buttons?.length
      ? [
          {
            type: 1,
            components: card.buttons.slice(0, 5).map((b) => ({
              type: 2,
              custom_id: b.id,
              label: b.label,
            })),
          },
        ]
      : [],
  };
}
