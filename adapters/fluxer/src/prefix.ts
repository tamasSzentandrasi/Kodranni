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

const OPTION_KEYS = [
  'foundation',
  'skill',
  'character',
  'tier',
  'exertion',
  'echo',
  'face',
  'name',
  'label',
  'player',
] as const;

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

function numeric(key: string, raw: string): string | number {
  if (!/^\d+$/.test(raw)) return raw;
  if (key === 'tier' || key === 'face' || key === 'exertion' || key === 'foundation' || key === 'skill') {
    return Number(raw);
  }
  return raw;
}

/** `character:Marino Orvanti skill:Command`, or the command’s usual word order. */
export function prefixCommandOptions(
  name: string,
  args: string,
): Record<string, string | number | boolean | undefined> {
  const pattern =
    /(^|\s)(foundation|skill|character|tier|exertion|echo|face|name|label|player):/gi;
  const marks: { key: string; at: number }[] = [];
  for (const match of args.matchAll(pattern)) {
    const key = match[2]?.toLowerCase();
    if (!key || !OPTION_KEYS.includes(key as (typeof OPTION_KEYS)[number])) continue;
    marks.push({ key, at: (match.index ?? 0) + (match[1]?.length ?? 0) });
  }
  if (marks.length > 0) {
    const options: Record<string, string | number> = {};
    for (let i = 0; i < marks.length; i++) {
      const mark = marks[i]!;
      const valueStart = args.indexOf(':', mark.at) + 1;
      const valueEnd = i + 1 < marks.length ? marks[i + 1]!.at : args.length;
      const raw = args.slice(valueStart, valueEnd).trim();
      if (raw) options[mark.key] = numeric(mark.key, raw);
    }
    return options;
  }
  if (!args) return {};
  if (name === 'npc-roll') {
    const parts = args.split(/\s+/);
    const foundation = Number(parts[0]);
    const skill = Number(parts[1]);
    const label = parts.slice(2).join(' ');
    return {
      ...(Number.isFinite(foundation) ? { foundation } : {}),
      ...(Number.isFinite(skill) ? { skill } : {}),
      ...(label ? { label } : {}),
    };
  }
  if (name === 'create') return { name: args };
  if (name === 'birth-omen' || name === 'guiding-hand') {
    const face = Number(args);
    return Number.isFinite(face) ? { face } : {};
  }
  if (
    name === 'roll' ||
    name === 'claim' ||
    name === 'select' ||
    name === 'award-word' ||
    name === 'review'
  ) {
    return { character: args };
  }
  return {};
}
