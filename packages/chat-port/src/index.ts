/**
 * Platform-agnostic chat surface. Discord and Fluxer adapters implement this.
 * No platform SDK imports here.
 */

export type PlatformId = 'discord' | 'fluxer';

export type ChatRole = 'player' | 'storyteller';

export interface ChatUserRef {
  platform: PlatformId;
  accountId: string;
  displayName?: string;
  /** Platform role IDs (e.g. Discord guild roles) for ST recognition. */
  roleIds?: string[];
}

export type ButtonStyle = 'primary' | 'secondary' | 'success' | 'danger';

/** Shared card colour. Die tiers use the Guidebook die colours. */
export type CardAccent = 'blood' | 'neutral' | 'd6' | 'd8' | 'd12';

export const CARD_ACCENT: Record<CardAccent, number> = {
  blood: 0x8a1515,
  neutral: 0x2a2222,
  /** Cool steel. Disadvantage. */
  d6: 0x6a9bb8,
  /** Warm bone. Ordinary. */
  d8: 0xe6e0d4,
  /** Amber. Advantage. */
  d12: 0xe0b44a,
};

export function cardAccentColor(accent?: CardAccent): number {
  if (!accent) return CARD_ACCENT.neutral;
  return CARD_ACCENT[accent];
}

export interface ChatButton {
  id: string;
  label: string;
  style?: ButtonStyle;
  disabled?: boolean;
}

export interface ChatSelectOption {
  value: string;
  label: string;
  description?: string;
  /** Discord: mark as default selected. */
  default?: boolean;
  /** Discord custom emoji name or unicode. */
  emoji?: string;
}

export interface ChatSelect {
  id: string;
  placeholder: string;
  options: ChatSelectOption[];
  minValues?: number;
  maxValues?: number;
}

export interface ChatField {
  name: string;
  value: string;
  inline?: boolean;
}

/** Neutral rich card — adapters map to embeds / components. */
export interface ChatCard {
  title?: string;
  description?: string;
  /** Blood by default. A roll uses the die-tier accent. */
  accent?: CardAccent;
  /**
   * Public image the client can fetch. Loopback halls omit it:
   * a chat client cannot load 127.0.0.1.
   */
  thumbnailUrl?: string;
  /** Wide picture under the text. Same fetch rule as the thumbnail. */
  imageUrl?: string;
  /** Overrides the accent. The Tide picture uses the desk’s stone. */
  color?: number;
  fields?: ChatField[];
  footer?: string;
  /**
   * Extra embeds on the same message. The title stays on the first embed,
   * where the client draws it largest.
   */
  panels?: {
    title?: string;
    description?: string;
    fields?: ChatField[];
    footer?: string;
  }[];
  buttons?: ChatButton[];
  selects?: ChatSelect[];
  /** Deep links (live sheet, archive). */
  links?: { label: string; url: string }[];
}

export interface ChatMessageRef {
  platform: PlatformId;
  channelId: string;
  messageId: string;
}

export interface InteractionBase {
  id: string;
  clientEventId: string;
  user: ChatUserRef;
  channelId: string;
  guildId?: string;
  /** Referenced/parent message if reply or button on a card. */
  messageRef?: ChatMessageRef;
}

export interface ButtonInteraction extends InteractionBase {
  type: 'button';
  customId: string;
}

export interface SelectInteraction extends InteractionBase {
  type: 'select';
  customId: string;
  values: string[];
}

export interface CommandInteraction extends InteractionBase {
  type: 'command';
  name: string;
  options: Record<string, string | number | boolean | undefined>;
}

export type ChatInteraction = ButtonInteraction | SelectInteraction | CommandInteraction;

export interface ChatPort {
  readonly platform: PlatformId;
  start(): Promise<void>;
  stop(): Promise<void>;
  sendCard(channelId: string, card: ChatCard): Promise<ChatMessageRef>;
  editCard(ref: ChatMessageRef, card: ChatCard): Promise<void>;
  replyEphemeral(interaction: ChatInteraction, content: string): Promise<void>;
  /**
   * Edit the deferred/ephemeral interaction reply as a rich card
   * (confirm stance, fallback picker, etc.).
   */
  editReplyCard?(interaction: ChatInteraction, card: ChatCard): Promise<void>;
  /**
   * New ephemeral card. Does not edit the message the control sits on,
   * so Oppose can leave the public result in the channel.
   */
  replyEphemeralCard?(interaction: ChatInteraction, card: ChatCard): Promise<void>;
  onInteraction(handler: (i: ChatInteraction) => Promise<void>): void;
}
