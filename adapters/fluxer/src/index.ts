import {
  cardAccentColor,
  type ChatCard,
  type ChatPort,
  type ChatInteraction,
  type ChatMessageRef,
} from '@kodranni/chat-port';

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
