/** Display helpers */

const ROMAN = ['∅', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'] as const;

export function toRoman(n: number): string {
  if (n <= 0) return ROMAN[0]!;
  if (n < ROMAN.length) return ROMAN[n]!;
  return String(n);
}

/** Discrete 1-unit segments for natural-number trackers (Exertion, Echo load). */
export function segments(filled: number, total: number): { on: boolean; over: boolean }[] {
  const n = Math.max(0, total);
  const f = Math.max(0, filled);
  return Array.from({ length: Math.max(n, f) }, (_, i) => ({
    on: i < Math.min(f, n),
    over: i >= n && i < f,
  }));
}

export function harmPips(n: number, max = 3): boolean[] {
  return Array.from({ length: max }, (_, i) => i < Math.min(max, Math.max(0, n)));
}

export const WEIGHT_BAND: Record<1 | 2 | 3, string> = {
  1: 'Individual',
  2: 'Group',
  3: 'Pivotal',
};

export const AXIS_DOMAIN: Record<string, string> = {
  Arms: 'Martial strength, protection, war, right to violence',
  Faith: 'Ritual, sacred knowledge, moral weight',
  Coin: 'Wealth, trade, material surplus, leverage',
  Blood: 'Kinship, land, lineage, domestic authority',
};

/** Unknown / renamed / fifth axis — empty string is not enough. */
export const AXIS_DOMAIN_FALLBACK = 'Standing on this axis.';

export function axisDomain(axis: string): string {
  return AXIS_DOMAIN[axis] ?? AXIS_DOMAIN_FALLBACK;
}

export const AXIS_KEY: Record<string, string> = {
  Arms: 'arms',
  Faith: 'faith',
  Coin: 'coin',
  Blood: 'blood',
};

const AXIS_HUE_CYCLE = ['arms', 'faith', 'coin', 'blood'] as const;

/** Named axes keep their hue; a fifth unknown axis is pewter, not a recycled accent. */
export function axisKey(axis: string, index = 0): string {
  if (AXIS_KEY[axis]) return AXIS_KEY[axis]!;
  if (index >= AXIS_HUE_CYCLE.length) return 'other';
  return AXIS_HUE_CYCLE[index]!;
}

export const FORTUNE_BLURBS: Record<string, string> = {
  vitality: 'People and health — how many hands remain, how much loss the group can still take.',
  cohesion: 'Trust and order within — whether the kinship still acts as one.',
  surplus: 'Food, tools, stores — the material cushion between ordinary winter and desperation.',
  standing: 'How outsiders see the community — treaties, fear, respect, and the weight of the name.',
  tradition:
    'Shared memory and self-belief — lore, custom, and what the people still know themselves to be.',
};

export type FactionOpt = { name: string; hue: number };

export function factionHue(faction: string): number {
  let h = 0;
  for (let i = 0; i < faction.length; i++) h = (h * 31 + faction.charCodeAt(i)) >>> 0;
  return h % 360;
}

export function resolveFactionHue(name: string, listed?: FactionOpt[]): number {
  const n = name.trim().toLowerCase();
  const hit = listed?.find((f) => f.name.toLowerCase() === n);
  return hit ? hit.hue : factionHue(name);
}

export function collectFactions(
  listed: FactionOpt[] | undefined,
  outsiders: { faction?: string }[],
): FactionOpt[] {
  const out: FactionOpt[] = [];
  const seen = new Set<string>();
  for (const f of listed ?? []) {
    const n = f.name.trim();
    if (!n || seen.has(n.toLowerCase())) continue;
    seen.add(n.toLowerCase());
    out.push({ name: n, hue: f.hue });
  }
  for (const o of outsiders) {
    const n = (o.faction ?? '').trim();
    if (!n || seen.has(n.toLowerCase())) continue;
    seen.add(n.toLowerCase());
    out.push({ name: n, hue: factionHue(n) });
  }
  return out;
}

export function avatarUrl(slug: string, avatar?: string): string | null {
  if (!avatar) return null;
  if (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('/')) {
    return avatar;
  }
  return `/api/avatar/${encodeURIComponent(slug)}`;
}

export function monogram(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}
