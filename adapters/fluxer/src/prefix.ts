/** Discord’s command words. Fluxer has no slash commands, so a message carries them after `!`. */
export const FLUXER_PREFIX_COMMANDS = [
  'award-word',
  'birth-omen',
  'claim',
  'create',
  'guiding-hand',
  'intent',
  'npc-roll',
  'review',
  'roll',
  'select',
] as const;

export type FluxerPrefixCommand = (typeof FLUXER_PREFIX_COMMANDS)[number];

/** `!roll`, `!award-word Mara`. Anything else, including a button id, is not a command. */
export function parsePrefixCommand(
  text: string,
): { name: FluxerPrefixCommand; args: string } | null {
  let body = text.trim();
  if (!body.startsWith('!')) return null;
  body = body.slice(1).trim();
  const lower = body.toLowerCase();
  const name = FLUXER_PREFIX_COMMANDS.find((cmd) => lower === cmd || lower.startsWith(`${cmd} `));
  if (!name) return null;
  return { name, args: body.slice(name.length).trim() };
}
