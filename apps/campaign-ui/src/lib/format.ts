/** Display helpers */

const ROMAN = ['∅', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'] as const;

export function toRoman(n: number): string {
  if (n <= 0) return ROMAN[0]!;
  if (n < ROMAN.length) return ROMAN[n]!;
  return String(n);
}

export function harmPips(n: number, max = 3): boolean[] {
  return Array.from({ length: max }, (_, i) => i < Math.min(max, Math.max(0, n)));
}

export const WEIGHT_BAND: Record<1 | 2 | 3, string> = {
  1: 'Individual',
  2: 'Group',
  3: 'Pivotal',
};

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
