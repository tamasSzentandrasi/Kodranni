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

export const ECHO_EFFECT_COLUMNS: { kind: string; header: string }[] = [
  { kind: 'invoke_second_exertion', header: 'Invoke' },
  { kind: 'weight_individual', header: 'Individual' },
  { kind: 'weight_group', header: 'Group' },
  { kind: 'weight_pivotal', header: 'Pivotal' },
  { kind: 'pivotal_fortune', header: 'Fortune' },
  { kind: 'pivotal_myth', header: 'Myth' },
  { kind: 'persist_legacy', header: 'Legacy' },
  { kind: 'dies_with_bearer', header: 'Dies with bearer' },
  { kind: 'custom', header: 'Custom' },
];
