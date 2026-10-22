/** One time-leap proposal for a person. Desk-only. Absent from the public snapshot. */
export interface DegradeProposal {
  slug: string;
  mode: 'standard' | 'short';
  omen: number;
  pool: string[];
  picked: string[];
}

function names(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

/** Drop a damaged meta row rather than throwing the desk open. */
export function parseDegradeProposals(raw: unknown): Record<string, DegradeProposal> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, DegradeProposal> = {};
  for (const [slug, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') continue;
    const row = value as Partial<DegradeProposal>;
    if (row.mode !== 'standard' && row.mode !== 'short') continue;
    if (!Number.isInteger(row.omen)) continue;
    out[slug] = {
      slug,
      mode: row.mode,
      omen: row.omen,
      pool: names(row.pool),
      picked: names(row.picked),
    };
  }
  return out;
}
