/** Display helpers — Roman for small ranks; visual pips elsewhere. */

const ROMAN = ['∅', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'] as const;

export function toRoman(n: number): string {
  if (n <= 0) return ROMAN[0]!;
  if (n < ROMAN.length) return ROMAN[n]!;
  return String(n);
}

export function fortunePips(n: number, max = 3): boolean[] {
  return Array.from({ length: max }, (_, i) => i < n);
}

export function harmPips(n: number, max = 3): boolean[] {
  return Array.from({ length: max }, (_, i) => i < Math.min(max, Math.max(0, n)));
}
