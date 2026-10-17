import type { OpenTide, SceneFace, TableState } from '@kodranni/store';
import { FIXED_OMEN_FACES, TIDE_DYES } from '@kodranni/store';
import { esc } from './escape.js';

export interface SessionSceneLine {
  face: number;
  effect: string;
  fixed: boolean;
}

export interface SessionDieFace {
  face: number;
  effect: string;
  tone: 'positive' | 'negative' | 'mixed' | '';
  fixed: boolean;
  /** Storyteller board only. The public die leaves a whisper face blank. */
  whisper: boolean;
}

export interface SessionTideView {
  sideA: string;
  sideB: string;
  size: OpenTide['size'];
  sizeLabel: string;
  footing: OpenTide['footing'];
  footingLabel: string;
  position: number;
  length: number;
  marker: string;
  dyeA: string;
  dyeB: string;
}

/** What a player reads on the Session tab. No inbox, no bind, no whisper lines. */
export interface SessionReading {
  scene: SessionSceneLine[];
  die: SessionDieFace[];
  tide: SessionTideView | null;
}

const SIZE_LABEL: Record<OpenTide['size'], string> = {
  small: 'Small skirmish',
  skirmish: 'Skirmish',
  battle: 'Battle',
};

export function tideMarkerWords(tide: {
  sideA: string;
  sideB: string;
  position: number;
  length: number;
}): string {
  if (tide.position <= 0) return `${tide.sideA} has collapsed.`;
  if (tide.position >= tide.length) return `${tide.sideB} has collapsed.`;
  return `The marker stands at ${tide.position} of ${tide.length}.`;
}

function footingLabel(tide: OpenTide): string {
  switch (tide.footing) {
    case 'equal':
      return 'Equal footing';
    case 'slightA':
      return `${tide.sideA} at a slight disadvantage`;
    case 'slightB':
      return `${tide.sideB} at a slight disadvantage`;
    case 'severeA':
      return `${tide.sideA} at a severe disadvantage`;
    case 'severeB':
      return `${tide.sideB} at a severe disadvantage`;
  }
}

/** Same dye twice: the second fill steps toward parchment, as the book describes. */
export function lightenHex(hex: string, amount = 0.28): string {
  const n = Number.parseInt(hex.replace('#', ''), 16);
  const mix = (channel: number, toward: number) => Math.round(channel + (toward - channel) * amount);
  const r = mix((n >> 16) & 255, 0xf4);
  const g = mix((n >> 8) & 255, 0xef);
  const b = mix(n & 255, 0xe6);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export function tideFill(dyeA: string, dyeB: string): { a: string; b: string } {
  if (dyeA.toLowerCase() === dyeB.toLowerCase()) return { a: dyeA, b: lightenHex(dyeB) };
  return { a: dyeA, b: dyeB };
}

function blankFace(face: number): SessionDieFace {
  return { face, effect: '', tone: '', fixed: false, whisper: false };
}

function lockedFace(row: SceneFace, tone: 'positive' | 'negative'): SessionDieFace {
  return { face: row.face, effect: row.effect, tone, fixed: true, whisper: false };
}

/** Twenty faces, secrets included. The public reading blanks those cells. */
export function storytellerDie(state: TableState): SessionDieFace[] {
  const byFace = new Map(state.sceneFaces.map((row) => [row.face, row]));
  return Array.from({ length: 20 }, (_, index) => {
    const face = index + 1;
    if (face === 7) return lockedFace(FIXED_OMEN_FACES[0]!, 'positive');
    if (face === 13) return lockedFace(FIXED_OMEN_FACES[1]!, 'negative');
    const row = byFace.get(face);
    if (!row) return blankFace(face);
    return {
      face,
      effect: row.effect,
      tone: row.tone,
      fixed: false,
      whisper: row.hidden,
    };
  });
}

export function publicDie(state: TableState): SessionDieFace[] {
  return storytellerDie(state).map((face) =>
    face.whisper ? blankFace(face.face) : face,
  );
}

export function sessionReading(state: TableState): SessionReading {
  const stored = [...state.sceneFaces].filter((row) => !row.hidden).sort((a, b) => a.face - b.face);
  const tide = state.tide;
  return {
    scene: [
      ...FIXED_OMEN_FACES.map((row) => ({ face: row.face, effect: row.effect, fixed: true })),
      ...stored.map((row) => ({ face: row.face, effect: row.effect, fixed: false })),
    ],
    die: publicDie(state),
    tide: tide
      ? {
          sideA: tide.sideA,
          sideB: tide.sideB,
          size: tide.size,
          sizeLabel: SIZE_LABEL[tide.size],
          footing: tide.footing,
          footingLabel: footingLabel(tide),
          position: tide.position,
          length: tide.length,
          marker: tideMarkerWords(tide),
          dyeA: tide.dyeA,
          dyeB: tide.dyeB,
        }
      : null,
  };
}

function faceClass(face: SessionDieFace): string {
  const parts = ['omen-face'];
  if (face.tone) parts.push(`omen-face--${face.tone}`);
  if (face.fixed) parts.push('is-locked');
  if (face.whisper) parts.push('is-whisper');
  return parts.join(' ');
}

/** The Guidebook’s omen die: icosahedron and the eye. */
export function omenMarkSvg(): string {
  return `<svg class="omen-mark__svg" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
    <path d="M 4.77 9.06 L 16 4.77 L 27.23 9.06 L 27.23 22.94 L 16 27.23 L 4.77 22.94 Z" fill="currentColor" fill-opacity="0.16" stroke="currentColor" stroke-width="1.42" stroke-linejoin="round"/>
    <path d="M 16 27.23 L 9.06 16 L 22.94 16 Z" fill="currentColor" fill-opacity="0.12"/>
    <path d="M 16 27.23 L 9.06 16 L 4.77 22.94 Z" fill="currentColor" fill-opacity="0.1"/>
    <path d="M 16 27.23 L 22.94 16 L 27.23 22.94 Z" fill="currentColor" fill-opacity="0.14"/>
    <path d="M 16 4.77 L 9.06 16 L 22.94 16 Z" fill="currentColor" fill-opacity="0.18"/>
    <path d="M 16 4.77 L 9.06 16 L 4.77 9.06 Z" fill="currentColor" fill-opacity="0.1"/>
    <path d="M 16 4.77 L 22.94 16 L 27.23 9.06 Z" fill="currentColor" fill-opacity="0.14"/>
    <path d="M 9.06 16 L 4.77 22.94 L 4.77 9.06 Z" fill="currentColor" fill-opacity="0.08"/>
    <path d="M 22.94 16 L 27.23 22.94 L 27.23 9.06 Z" fill="currentColor" fill-opacity="0.1"/>
    <path d="M 16 27.23 L 9.06 16 M 16 27.23 L 22.94 16 M 16 27.23 L 4.77 22.94 M 16 27.23 L 27.23 22.94 M 16 4.77 L 9.06 16 M 16 4.77 L 22.94 16 M 16 4.77 L 4.77 9.06 M 16 4.77 L 27.23 9.06 M 9.06 16 L 22.94 16 M 9.06 16 L 4.77 22.94 M 9.06 16 L 4.77 9.06 M 22.94 16 L 27.23 22.94 M 22.94 16 L 27.23 9.06 M 4.77 22.94 L 4.77 9.06 M 27.23 22.94 L 27.23 9.06" fill="none" stroke="currentColor" stroke-width="1.05" stroke-linecap="round"/>
    <path d="M 12.7 19.74 Q 16 17.64 19.3 19.74 Q 16 21.84 12.7 19.74 Z" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.05" stroke-linejoin="round"/>
    <circle cx="16" cy="19.74" r="1.15" fill="currentColor"/>
  </svg>`;
}

export function omenHeadHtml(): string {
  return `<header class="omen-head"><span class="omen-mark" aria-hidden="true">${omenMarkSvg()}</span><div><h2>Omens</h2><p class="omen-kicker">Twenty faces. Seven and thirteen stay sealed.</p></div></header>`;
}

/** Two waves and the marker. Same mark on the player board and the desk. */
export function tideMarkSvg(): string {
  return `<svg class="session-glyph__svg" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
    <path d="M3 13.2C5.4 10 7.6 10 10 13.2S14.6 16.4 17 13.2 21.6 10 24 13.2 28.6 16.4 29.5 14.6" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round"/>
    <path d="M3 20.2C5.4 17 7.6 17 10 20.2S14.6 23.4 17 20.2 21.6 17 24 20.2 28.6 23.4 29.5 21.6" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" opacity="0.72"/>
    <path d="M16 5.4 18.25 9.1 16 12.8 13.75 9.1Z" fill="currentColor"/>
  </svg>`;
}

export function tideHeadHtml(): string {
  return `<h2 class="session-head"><span class="session-glyph" aria-hidden="true">${tideMarkSvg()}</span> The Tide</h2>`;
}

/**
 * Seats for faces 1–20. x is in triangle widths, y in heights.
 * Neighbours share a full edge: a down under an up has the same x and y+1,
 * and a down beside an up has the same y and x ± 0.5.
 * Keep apps/campaign-ui/public/session.js dieHtml on this same table.
 */
const OMEN_NET: readonly (readonly [number, number, 'up' | 'down'])[] = [
  [1, 0, 'up'],
  [0.5, 1, 'up'],
  [1, 1, 'down'],
  [1.5, 1, 'up'],
  [0, 2, 'up'],
  [0.5, 2, 'down'],
  [1, 2, 'up'],
  [1.5, 2, 'down'],
  [2, 2, 'up'],
  [0.5, 3, 'up'],
  [1, 3, 'down'],
  [1.5, 3, 'up'],
  [0.5, 4, 'down'],
  [1, 4, 'up'],
  [1.5, 4, 'down'],
  [0.5, 5, 'up'],
  [1, 5, 'down'],
  [1.5, 5, 'up'],
  [0.5, 6, 'down'],
  [1, 6, 'up'],
];

/** The d20 net. The line is edited in the lectern under it. Faces 7 and 13 stay sealed. */
export function omenDieHtml(die: SessionDieFace[], opts?: { edit?: boolean }): string {
  const edit = Boolean(opts?.edit);
  const cells = die
    .map((face) => {
      const seat = OMEN_NET[face.face - 1] ?? OMEN_NET[0]!;
      const [x, y, point] = seat;
      const line = face.effect
        ? `<span class="omen-face__line">${esc(face.effect)}</span>`
        : '';
      const veil = face.whisper ? '<span class="omen-face__veil" title="Whisper"></span>' : '';
      const body = `<span class="omen-face__n">${esc(face.face)}</span>${line}${veil}`;
      const inner =
        edit && !face.fixed
          ? `<button type="button" class="omen-face__hit" data-omen-open aria-label="Face ${esc(face.face)}">${body}</button>`
          : body;
      const title = face.effect ? ` title="${esc(face.effect)}"` : '';
      return `<li class="${faceClass(face)}" data-face="${esc(face.face)}" data-tone="${esc(face.tone)}" data-point="${point}" style="--x:${x};--y:${y}"${face.whisper ? ' data-whisper="1"' : ''}${title}>${inner}</li>`;
    })
    .join('');
  return `<ol class="omen-die"${edit ? ' data-omen-edit' : ''}>${cells}</ol>`;
}

/** Guidebook Tide bar. Colours follow the two dyes. The marker sits at position / length. */
export function tideBarHtml(tide: {
  sideA: string;
  sideB: string;
  position: number;
  length: number;
  dyeA: string;
  dyeB: string;
  marker: string;
}): string {
  const at = tide.length > 0 ? (tide.position / tide.length) * 100 : 0;
  const fill = tideFill(tide.dyeA, tide.dyeB);
  return `<div class="kod-tide" style="--tide-at: ${at.toFixed(1)}%; --tide-a: ${esc(fill.a)}; --tide-b: ${esc(fill.b)}" aria-label="${esc(tide.marker)}">
    <div class="kod-tide__labels">
      <span class="kod-tide__label kod-tide__label--a">${esc(tide.sideA)} · 0</span>
      <span class="kod-tide__label kod-tide__label--mid">${esc(tide.position)} of ${esc(tide.length)}</span>
      <span class="kod-tide__label kod-tide__label--b">${esc(tide.length)} · ${esc(tide.sideB)}</span>
    </div>
    <div class="kod-tide__rail">
      <div class="kod-tide__track">
        <div class="kod-tide__fill kod-tide__fill--a"></div>
        <div class="kod-tide__fill kod-tide__fill--b"></div>
      </div>
      <div class="kod-tide__marker" aria-hidden="true">
        <span class="kod-tide__marker-head"></span>
        <span class="kod-tide__marker-stem"></span>
        <span class="kod-tide__marker-foot"></span>
      </div>
    </div>
    <p class="kod-tide__readout">${esc(tide.marker)}</p>
  </div>`;
}

function tideBlock(tide: SessionTideView | null): string {
  if (!tide) return '<p data-session-tide-empty>No Tide is open.</p>';
  return tideBarHtml(tide);
}

/** Shared board. Players see this. The Storyteller’s die is the same object, editable. */
export function sessionSharedHtml(reading: SessionReading): string {
  return `<section class="kod-plate session-board" data-session-board data-session-poll="1">
    ${omenHeadHtml()}
    <div class="omen-stage"><div data-session-scene>${omenDieHtml(reading.die)}</div></div>
    ${tideHeadHtml()}
    <div data-session-tide>${tideBlock(reading.tide)}</div>
  </section>`;
}

/** Archive and a parked hostname. Last night’s faces and Tide stay off this page. */
export function sessionBetweenHtml(): string {
  return `<section class="kod-plate" data-session-between>
    <h2>Session</h2>
    <p>The table is between sessions.</p>
  </section>`;
}

export const TIDE_DYE_LIST = TIDE_DYES;
