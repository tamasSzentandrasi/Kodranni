import type { TideFooting, TideSkirmishScale } from '@kodranni/domain';

/** Faces 7 and 13 are always in force and are not rows in this list. */
export type SceneTone = 'positive' | 'negative' | 'mixed';

export interface SceneFace {
  face: number;
  effect: string;
  tone: SceneTone;
  /** The line is for the Storyteller. The public board and the public roll card omit it. */
  hidden: boolean;
}

/** A hidden face that has come up. Desk only — never copied onto the public snapshot. */
export interface OmenWhisper {
  face: number;
  effect: string;
  rollId: string;
  at: string;
}

/** People resting apart from the rest of the table. */
export interface RestGroup {
  id: string;
  name: string;
  members: string[];
}

export interface TableMessageRef {
  platform: 'discord' | 'fluxer';
  channelId: string;
  messageId: string;
}

export interface OpenTide {
  size: TideSkirmishScale;
  footing: TideFooting;
  sideA: string;
  sideB: string;
  dyeA: string;
  dyeB: string;
  weightA: number;
  weightB: number;
  length: number;
  start: number;
  position: number;
  messageRef?: TableMessageRef;
}

/** Night's table. Kept in SQLite meta and omitted from the public snapshot. */
export interface TableState {
  sceneFaces: SceneFace[];
  sceneBoardRef?: TableMessageRef;
  tide: OpenTide | null;
  restGroups: RestGroup[];
  whispers: OmenWhisper[];
}

export const FIXED_OMEN_FACES: readonly SceneFace[] = [
  { face: 7, effect: 'Positive Consequence', tone: 'positive', hidden: false },
  { face: 13, effect: 'Negative Consequence', tone: 'negative', hidden: false },
];

export const TIDE_DYES: readonly { name: string; hex: string }[] = [
  { name: 'Blood', hex: '#a01818' },
  { name: 'Wine', hex: '#6e2438' },
  { name: 'Rust', hex: '#8c3d24' },
  { name: 'Ember', hex: '#c45c28' },
  { name: 'Ochre', hex: '#b8862e' },
  { name: 'Straw', hex: '#c6a45a' },
  { name: 'Moss', hex: '#5e6b3c' },
  { name: 'Pine', hex: '#2e4a3a' },
  { name: 'Sea', hex: '#3a5c6c' },
  { name: 'Slate', hex: '#5c6770' },
  { name: 'Iron', hex: '#6e655c' },
  { name: 'Bone', hex: '#d2c8b4' },
];

export function emptyTableState(): TableState {
  return { sceneFaces: [], tide: null, restGroups: [], whispers: [] };
}

export function tideDyeHex(hex: string): string | undefined {
  const found = TIDE_DYES.find((d) => d.hex.toLowerCase() === hex.trim().toLowerCase());
  return found?.hex;
}

function messageRef(raw: unknown): TableMessageRef | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Partial<TableMessageRef>;
  if (r.platform !== 'discord' && r.platform !== 'fluxer') return undefined;
  if (typeof r.channelId !== 'string' || !r.channelId) return undefined;
  if (typeof r.messageId !== 'string' || !r.messageId) return undefined;
  return { platform: r.platform, channelId: r.channelId, messageId: r.messageId };
}

function parseTide(raw: unknown): OpenTide | null {
  if (!raw || typeof raw !== 'object') return null;
  const t = raw as Partial<OpenTide>;
  if (t.size !== 'small' && t.size !== 'skirmish' && t.size !== 'battle') return null;
  if (
    t.footing !== 'equal' &&
    t.footing !== 'slightA' &&
    t.footing !== 'slightB' &&
    t.footing !== 'severeA' &&
    t.footing !== 'severeB'
  ) {
    return null;
  }
  if (typeof t.sideA !== 'string' || typeof t.sideB !== 'string') return null;
  if (typeof t.dyeA !== 'string' || typeof t.dyeB !== 'string') return null;
  if (!tideDyeHex(t.dyeA) || !tideDyeHex(t.dyeB)) return null;
  if (
    !Number.isInteger(t.weightA) ||
    !Number.isInteger(t.weightB) ||
    !Number.isInteger(t.length) ||
    !Number.isInteger(t.start) ||
    !Number.isInteger(t.position)
  ) {
    return null;
  }
  return {
    size: t.size,
    footing: t.footing,
    sideA: t.sideA,
    sideB: t.sideB,
    dyeA: tideDyeHex(t.dyeA)!,
    dyeB: tideDyeHex(t.dyeB)!,
    weightA: t.weightA!,
    weightB: t.weightB!,
    length: t.length!,
    start: t.start!,
    position: t.position!,
    messageRef: messageRef(t.messageRef),
  };
}

function sceneTone(raw: unknown): SceneTone {
  return raw === 'positive' || raw === 'negative' || raw === 'mixed' ? raw : 'mixed';
}

function parseGroups(raw: unknown): RestGroup[] {
  if (!Array.isArray(raw)) return [];
  const seenId = new Set<string>();
  const seenMember = new Set<string>();
  const groups: RestGroup[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const rec = row as Partial<RestGroup>;
    const id = typeof rec.id === 'string' ? rec.id.trim().slice(0, 40) : '';
    const name = typeof rec.name === 'string' ? rec.name.trim().slice(0, 40) : '';
    if (!/^[A-Za-z0-9_-]{1,40}$/.test(id) || !name || seenId.has(id)) continue;
    seenId.add(id);
    const members: string[] = [];
    if (Array.isArray(rec.members)) {
      for (const slug of rec.members) {
        if (typeof slug !== 'string' || !slug || seenMember.has(slug)) continue;
        seenMember.add(slug);
        members.push(slug.slice(0, 80));
      }
    }
    groups.push({ id, name, members });
    if (groups.length >= 12) break;
  }
  return groups;
}

function parseWhispers(raw: unknown): OmenWhisper[] {
  if (!Array.isArray(raw)) return [];
  const whispers: OmenWhisper[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const rec = row as Partial<OmenWhisper>;
    if (!Number.isInteger(rec.face) || rec.face! < 1 || rec.face! > 20) continue;
    if (typeof rec.effect !== 'string' || !rec.effect.trim()) continue;
    if (typeof rec.rollId !== 'string' || !rec.rollId) continue;
    if (typeof rec.at !== 'string' || !rec.at) continue;
    whispers.push({
      face: rec.face!,
      effect: rec.effect.trim().slice(0, 240),
      rollId: rec.rollId.slice(0, 80),
      at: rec.at.slice(0, 40),
    });
  }
  return whispers.slice(-12);
}

export function parseTableState(raw: unknown): TableState {
  if (!raw || typeof raw !== 'object') return emptyTableState();
  const o = raw as Partial<TableState>;
  const seen = new Set<number>();
  const sceneFaces: SceneFace[] = [];
  if (Array.isArray(o.sceneFaces)) {
    for (const row of o.sceneFaces) {
      if (!row || typeof row !== 'object') continue;
      const rec = row as Partial<SceneFace>;
      const face = rec.face;
      const effect = rec.effect;
      if (!Number.isInteger(face) || face! < 1 || face! > 20 || face === 7 || face === 13) continue;
      if (typeof effect !== 'string' || !effect.trim()) continue;
      if (seen.has(face!)) continue;
      seen.add(face!);
      sceneFaces.push({
        face: face!,
        effect: effect.trim().slice(0, 240),
        tone: sceneTone(rec.tone),
        hidden: rec.hidden === true,
      });
    }
  }
  return {
    sceneFaces,
    sceneBoardRef: messageRef(o.sceneBoardRef),
    tide: parseTide(o.tide),
    restGroups: parseGroups(o.restGroups),
    whispers: parseWhispers(o.whispers),
  };
}
