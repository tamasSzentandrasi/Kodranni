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
}

export type ButtonStyle = 'primary' | 'secondary' | 'success' | 'danger';

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
  /** Blood accent by default in adapters. */
  accent?: 'blood' | 'neutral';
  fields?: ChatField[];
  footer?: string;
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
  onInteraction(handler: (i: ChatInteraction) => Promise<void>): void;
}
