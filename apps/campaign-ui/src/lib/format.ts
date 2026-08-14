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

export const ECHO_PHASES: { id: string; label: string }[] = [
  { id: 'while_carried', label: 'While carried' },
  { id: 'on_resolve', label: 'On resolution' },
  { id: 'continuity', label: 'Continuity' },
];

export function phaseOf(fx: { kind: string; phase?: string }): string {
  if (fx.phase) return fx.phase;
  if (fx.kind === 'invoke_second_exertion' || fx.kind === 'load_cost') return 'while_carried';
  if (
    fx.kind === 'on_resolve_personal' ||
    fx.kind === 'on_resolve_group' ||
    fx.kind === 'pivotal_fortune' ||
    fx.kind === 'pivotal_myth'
  )
    return 'on_resolve';
  if (fx.kind === 'persist_legacy' || fx.kind === 'dies_with_bearer') return 'continuity';
  return 'while_carried';
}

export const FORTUNE_BLURBS: Record<string, string> = {
  vitality: 'People and health — how many hands remain, how much loss the group can still take.',
  cohesion: 'Trust and order within — whether the kinship still acts as one.',
  surplus: 'Food, tools, stores — the material cushion between ordinary winter and desperation.',
  standing: 'How outsiders see the community — treaties, fear, respect, and the weight of the name.',
  tradition: 'Shared memory and self-belief — lore, custom, and what the people still know themselves to be.',
};

/** Stable colour hash for faction chips. */
export function factionHue(faction: string): number {
  let h = 0;
  for (let i = 0; i < faction.length; i++) h = (h * 31 + faction.charCodeAt(i)) >>> 0;
  return h % 360;
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
