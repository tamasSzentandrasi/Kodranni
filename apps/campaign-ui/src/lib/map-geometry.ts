/** World box: top-left origin, same space as JSON Canvas x/y. */
export type PlateBox = { x: number; y: number; w: number; h: number };

export type Pt = { x: number; y: number };

export function plateCenter(b: PlateBox): Pt {
  return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
}

/**
 * Where a ray from the plate centre toward `toward` leaves the nameplate
 * silhouette (ellipse fitted to the box), plus a little air.
 */
export function ellipseExit(b: PlateBox, toward: Pt, air = 8): Pt {
  const c = plateCenter(b);
  const rx = b.w / 2;
  const ry = b.h / 2;
  const dx = toward.x - c.x;
  const dy = toward.y - c.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return { x: c.x + rx + air, y: c.y };
  const nx = dx / len;
  const ny = dy / len;
  const t = 1 / Math.hypot(nx / rx, ny / ry);
  return { x: c.x + nx * (t + air), y: c.y + ny * (t + air) };
}

export function quadPoint(a: Pt, ctrl: Pt, b: Pt, t: number): Pt {
  const u = 1 - t;
  return {
    x: u * u * a.x + 2 * u * t * ctrl.x + t * t * b.x,
    y: u * u * a.y + 2 * u * t * ctrl.y + t * t * b.y,
  };
}

export function quadTangent(a: Pt, ctrl: Pt, b: Pt, t: number): Pt {
  const dx = 2 * (1 - t) * (ctrl.x - a.x) + 2 * t * (b.x - ctrl.x);
  const dy = 2 * (1 - t) * (ctrl.y - a.y) + 2 * t * (b.y - ctrl.y);
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

export type EdgeDraw = {
  d: string;
  start: Pt;
  end: Pt;
  ctrl: Pt;
  label: Pt;
  arrow: { x: number; y: number; angle: number } | null;
};

/** Clipped quadratic from plate A to plate B. Curvature offsets parallel ties. */
export function edgeDraw(
  from: PlateBox,
  to: PlateBox,
  curvature: number,
  directed: boolean,
  air = 8,
  blockers: PlateBox[] = [],
): EdgeDraw {
  const ctrl = roseSafeCtrl(from, to, detourCtrl(from, to, blockers, curvature));
  const start = ellipseExit(from, ctrl, air);
  const end = ellipseExit(to, ctrl, air);
  const d = `M ${start.x} ${start.y} Q ${ctrl.x} ${ctrl.y} ${end.x} ${end.y}`;
  const labelT = 0.5 + Math.max(-0.18, Math.min(0.18, curvature * 0.5));
  const label = quadPoint(start, ctrl, end, labelT);
  let arrow: EdgeDraw['arrow'] = null;
  if (directed) {
    const tan = quadTangent(start, ctrl, end, 0.92);
    const tip = quadPoint(start, ctrl, end, 0.92);
    arrow = { x: tip.x, y: tip.y, angle: Math.atan2(tan.y, tan.x) };
  }
  return { d, start, end, ctrl, label, arrow };
}

export function pointInEllipse(b: PlateBox, p: Pt): boolean {
  const c = plateCenter(b);
  const rx = b.w / 2;
  const ry = b.h / 2;
  const nx = (p.x - c.x) / rx;
  const ny = (p.y - c.y) / ry;
  return nx * nx + ny * ny <= 1;
}

export function curveHitsBox(start: Pt, ctrl: Pt, end: Pt, box: PlateBox): boolean {
  for (let i = 1; i < 14; i++) {
    if (pointInEllipse(box, quadPoint(start, ctrl, end, i / 14))) return true;
  }
  return false;
}

function baseCtrl(a: Pt, b: Pt, curvature: number): Pt {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  return {
    x: mx + (-dy / len) * curvature * len,
    y: my + (dx / len) * curvature * len,
  };
}

/** Push the control point off any blocking plate the curve would enter. */
export function detourCtrl(
  from: PlateBox,
  to: PlateBox,
  blockers: PlateBox[],
  curvature: number,
): Pt {
  const a = plateCenter(from);
  const b = plateCenter(to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  let ctrl = baseCtrl(a, b, curvature);
  const start0 = ellipseExit(from, ctrl, 8);
  const end0 = ellipseExit(to, ctrl, 8);
  const hit = blockers.find((box) => curveHitsBox(start0, ctrl, end0, box));
  if (!hit) return ctrl;
  const c = plateCenter(hit);
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  let awayX = mx - c.x;
  let awayY = my - c.y;
  if (Math.hypot(awayX, awayY) < 12) {
    awayX = -dy;
    awayY = dx;
  }
  const awayLen = Math.hypot(awayX, awayY) || 1;
  let bump = Math.max(hit.w, hit.h) * 0.7 + 40;
  for (let k = 0; k < 8; k++) {
    const cand = {
      x: mx + (awayX / awayLen) * bump,
      y: my + (awayY / awayLen) * bump,
    };
    const s = ellipseExit(from, cand, 8);
    const e = ellipseExit(to, cand, 8);
    if (!blockers.some((box) => curveHitsBox(s, cand, e, box))) return cand;
    bump += 24;
  }
  return {
    x: mx + (awayX / awayLen) * bump,
    y: my + (awayY / awayLen) * bump,
  };
}

export type HubSpec = { id: string; name: string; hue: number };
export type SeatPerson = { id: string; hubIds: string[]; neighborIds?: string[] };
export type SeatTie = { from: string; to: string; label?: string; directed?: boolean };

export type HubPose = HubSpec & { x: number; y: number; r: number };
export type SeatPose = { id: string; x: number; y: number };

/** Calibrated for Bellefair nameplates ~138×32 and horizontal edge type. */
const SIB_AIR = 36;
const LAYER_AIR = 48;
const LAYER_PER_GLYPH = 2.8;
const SECTOR_AIR = 44;
const LABEL_EM = 7.4;
const LABEL_H = 16;
const PUSH_RANGE = 260;
const PUSH_G = 7200;
const LABEL_SPAN_MAX = 360;

/** Radial seating: hubs on a ring, people on faction arcs, unaligned on an outer walk. */
export const ROSE_R = 164;
export const ROSE_CLEAR = 52;

const WELL_MIN = 280;
const WELL_SCALE = 2.15;
const PACK_GAP = 32;

/** Circumradius of an axis-aligned plate, plus air — packing quantum. */
export function plateClear(w: number, h: number, gap = PACK_GAP): number {
  return Math.hypot(w, h) / 2 + gap;
}

export function roseMinR(w: number, h: number): number {
  return ROSE_R + ROSE_CLEAR + plateClear(w, h, 8);
}

/** Push an axis-aligned plate so its centre stays outside the rose. */
export function keepOffRose(x: number, y: number, w: number, h: number, roseR?: number): Pt {
  const need = roseR ?? roseMinR(w, h);
  const cx = x + w / 2;
  const cy = y + h / 2;
  const r = Math.hypot(cx, cy);
  if (r >= need) return { x, y };
  const s = need / (r || 1e-6);
  return { x: cx * s - w / 2, y: cy * s - h / 2 };
}

/**
 * Axis-aligned ellipse overlap (d3-force collide, unequal x/y radii).
 * Returns a half-push for each centre, or null if they already clear.
 */
export function ellipsePush(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
  gap = PACK_GAP,
): Pt | null {
  const acx = ax + aw / 2;
  const acy = ay + ah / 2;
  const bcx = bx + bw / 2;
  const bcy = by + bh / 2;
  const rx = (aw + bw) / 2 + gap;
  const ry = (ah + bh) / 2 + gap;
  const nx = (acx - bcx) / rx;
  const ny = (acy - bcy) / ry;
  const d2 = nx * nx + ny * ny;
  if (d2 >= 1) return null;
  if (d2 < 1e-8) return { x: rx * 0.5, y: 0 };
  const d = Math.sqrt(d2);
  const m = (1 - d) * 0.5;
  return { x: (nx / d) * m * rx, y: (ny / d) * m * ry };
}

export function separateSeats(
  seats: SeatPose[],
  plateW: number,
  plateH: number,
  ticks = 48,
): SeatPose[] {
  const out = seats.map((s) => ({ ...s }));
  for (let t = 0; t < ticks; t++) {
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        const a = out[i]!;
        const b = out[j]!;
        const p = ellipsePush(a.x, a.y, plateW, plateH, b.x, b.y, plateW, plateH);
        if (!p) continue;
        a.x += p.x;
        a.y += p.y;
        b.x -= p.x;
        b.y -= p.y;
      }
    }
    for (const s of out) {
      const k = keepOffRose(s.x, s.y, plateW, plateH);
      s.x = k.x;
      s.y = k.y;
    }
  }
  return out;
}

/** Local inverse-square push so plates clear, then min chord for each label. */
export function relaxSeats(
  seats: SeatPose[],
  ties: SeatTie[],
  plateW: number,
  plateH: number,
): SeatPose[] {
  const out = seats.map((s) => ({ ...s }));
  const byId = new Map(out.map((s) => [s.id, s]));
  for (let t = 0; t < 22; t++) {
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        const a = out[i]!;
        const b = out[j]!;
        const acx = a.x + plateW / 2;
        const acy = a.y + plateH / 2;
        const bcx = b.x + plateW / 2;
        const bcy = b.y + plateH / 2;
        const dx = bcx - acx;
        const dy = bcy - acy;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist > PUSH_RANGE) continue;
        const f = PUSH_G / (dist * dist + 90);
        const ux = dx / dist;
        const uy = dy / dist;
        a.x -= ux * f;
        a.y -= uy * f;
        b.x += ux * f;
        b.y += uy * f;
      }
    }
    for (const s of out) {
      const k = keepOffRose(s.x, s.y, plateW, plateH);
      s.x = k.x;
      s.y = k.y;
    }
  }
  for (let n = 0; n < 5; n++) {
    for (const t of ties) {
      const a = byId.get(t.from);
      const b = byId.get(t.to);
      if (!a || !b) continue;
      const acx = a.x + plateW / 2;
      const acy = a.y + plateH / 2;
      const bcx = b.x + plateW / 2;
      const bcy = b.y + plateH / 2;
      const dist = Math.hypot(bcx - acx, bcy - acy) || 1;
      const need = Math.min(LABEL_SPAN_MAX, labelRestLength(t.label ?? '', plateW));
      if (dist >= need) continue;
      const push = Math.min(48, (need - dist) / 2);
      const ux = (bcx - acx) / dist;
      const uy = (bcy - acy) / dist;
      a.x -= ux * push;
      a.y -= uy * push;
      b.x += ux * push;
      b.y += uy * push;
    }
  }
  return separateSeats(out, plateW, plateH, 20);
}

function wellFromSeats(
  seats: SeatPose[],
  fallbackX: number,
  fallbackY: number,
  plateW: number,
  plateH: number,
): { cx: number; cy: number; r: number } {
  if (!seats.length) return { cx: fallbackX, cy: fallbackY, r: WELL_MIN };
  let hx = 0;
  let hy = 0;
  seats.forEach((s) => {
    hx += s.x + plateW / 2;
    hy += s.y + plateH / 2;
  });
  hx /= seats.length;
  hy /= seats.length;
  const half = Math.hypot(plateW, plateH) / 2;
  let pack = 0;
  seats.forEach((s) => {
    const d = Math.hypot(s.x + plateW / 2 - hx, s.y + plateH / 2 - hy) + half;
    pack = Math.max(pack, d + 28);
  });
  return { cx: hx, cy: hy, r: Math.max(WELL_MIN, pack * WELL_SCALE) };
}

function labelWidth(text: string): number {
  return Math.max(24, (text ?? '').trim().length * LABEL_EM);
}

export function labelRestLength(label: string, plateW: number): number {
  return Math.max(plateW + SIB_AIR, plateW * 0.45 + labelWidth(label) + 28);
}

function glyphs(label: string): number {
  return (label ?? '').trim().length;
}

type Tidy = {
  id: string;
  children: Tidy[];
  x: number;
  minX: number;
  maxX: number;
  depth: number;
};

function leftContour(n: Tidy): number[] {
  const out: number[] = [];
  const walk = (v: Tidy, d: number) => {
    out[d] = out[d] == null ? v.x : Math.min(out[d]!, v.x);
    v.children.forEach((c) => walk(c, d + 1));
  };
  walk(n, 0);
  return out;
}

function rightContour(n: Tidy): number[] {
  const out: number[] = [];
  const walk = (v: Tidy, d: number) => {
    out[d] = out[d] == null ? v.x : Math.max(out[d]!, v.x);
    v.children.forEach((c) => walk(c, d + 1));
  };
  walk(n, 0);
  return out;
}

function shiftTree(n: Tidy, dx: number) {
  n.x += dx;
  n.minX += dx;
  n.maxX += dx;
  n.children.forEach((c) => shiftTree(c, dx));
}

/** Walker / Buchheim n-ary tidy: siblings along x, generations along depth. */
function tidyLayout(root: Tidy, sibGap: number) {
  const rec = (n: Tidy, depth: number) => {
    n.depth = depth;
    n.children.forEach((c) => rec(c, depth + 1));
    if (!n.children.length) {
      n.x = 0;
      n.minX = 0;
      n.maxX = 0;
      return;
    }
    let packedRight: number[] = [];
    n.children.forEach((c, i) => {
      if (i === 0) {
        packedRight = rightContour(c);
        return;
      }
      const left = leftContour(c);
      let sep = sibGap;
      const dmax = Math.min(packedRight.length, left.length);
      for (let d = 0; d < dmax; d++) {
        sep = Math.max(sep, packedRight[d]! + sibGap - left[d]!);
      }
      shiftTree(c, sep);
      const right = rightContour(c);
      for (let d = 0; d < right.length; d++) {
        packedRight[d] = Math.max(packedRight[d] ?? -Infinity, right[d]!);
      }
    });
    const first = n.children[0]!;
    const last = n.children[n.children.length - 1]!;
    n.x = (first.x + last.x) / 2;
    n.minX = Math.min(first.minX, n.x);
    n.maxX = Math.max(last.maxX, n.x);
    n.children.forEach((c) => {
      n.minX = Math.min(n.minX, c.minX);
      n.maxX = Math.max(n.maxX, c.maxX);
    });
  };
  rec(root, 0);
}

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items.slice()];
  const out: T[][] = [];
  items.forEach((item, i) => {
    const rest = items.slice(0, i).concat(items.slice(i + 1));
    for (const p of permutations(rest)) out.push([item, ...p]);
  });
  return out;
}

function circleCross(order: string[], edges: { a: string; b: string }[]): number {
  const idx = new Map(order.map((id, i) => [id, i]));
  const between = (i: number, j: number, k: number) => (i < j ? k > i && k < j : k > i || k < j);
  let c = 0;
  for (let i = 0; i < edges.length; i++) {
    const a = idx.get(edges[i]!.a);
    const b = idx.get(edges[i]!.b);
    if (a == null || b == null || a === b) continue;
    for (let j = i + 1; j < edges.length; j++) {
      const c0 = idx.get(edges[j]!.a);
      const d = idx.get(edges[j]!.b);
      if (c0 == null || d == null || c0 === d) continue;
      if (a === c0 || a === d || b === c0 || b === d) continue;
      if (between(a, b, c0) !== between(a, b, d)) c += 1;
    }
  }
  return c;
}

function spanningChildren(
  ids: Set<string>,
  root: string,
  ties: SeatTie[],
): Map<string, string[]> {
  const parent = new Map<string, string>();
  const kids = new Map<string, string[]>([...ids].map((id) => [id, []]));
  const seen = new Set<string>([root]);
  const ranked = ties
    .filter((t) => ids.has(t.from) && ids.has(t.to) && t.from !== t.to)
    .slice()
    .sort((a, b) => glyphs(a.label ?? '') - glyphs(b.label ?? '') || a.from.localeCompare(b.from));
  let grew = true;
  while (grew) {
    grew = false;
    for (const t of ranked) {
      const aIn = seen.has(t.from);
      const bIn = seen.has(t.to);
      if (aIn === bIn) continue;
      const p = aIn ? t.from : t.to;
      const c = aIn ? t.to : t.from;
      seen.add(c);
      parent.set(c, p);
      kids.get(p)!.push(c);
      grew = true;
    }
  }
  for (const id of ids) {
    if (id === root || seen.has(id)) continue;
    seen.add(id);
    parent.set(id, root);
    kids.get(root)!.push(id);
  }
  kids.forEach((list) => list.sort((a, b) => a.localeCompare(b)));
  return kids;
}

type Cluster = {
  id: string;
  hub: HubSpec | null;
  ids: string[];
  cores: string[];
  root: string;
  tidy: Tidy;
  width: number;
  maxDepth: number;
};

function aabbHit(a: PlateBox, b: PlateBox): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function placeEdgeLabels(
  items: {
    id: string;
    start: Pt;
    end: Pt;
    ctrl: Pt;
    label: string;
    directed: boolean;
  }[],
  plates: PlateBox[],
  roseR: number,
): Map<string, Pt> {
  const taken: PlateBox[] = [];
  const out = new Map<string, Pt>();
  const ranked = items.slice().sort((a, b) => glyphs(b.label) - glyphs(a.label));
  for (const it of ranked) {
    const w = labelWidth(it.label);
    const tanMid = quadTangent(it.start, it.ctrl, it.end, 0.5);
    const bulge = { x: -tanMid.y, y: tanMid.x };
    const ctrlSide =
      (it.ctrl.x - (it.start.x + it.end.x) / 2) * bulge.x +
        (it.ctrl.y - (it.start.y + it.end.y) / 2) * bulge.y >=
      0
        ? 1
        : -1;
    const ts = it.directed ? [0.42, 0.5, 0.58, 0.34] : [0.5, 0.4, 0.6, 0.35];
    const offs = [14, 22, 30];
    const signs = it.directed ? [ctrlSide, -ctrlSide] : [ctrlSide, -ctrlSide];
    let best: { x: number; y: number; score: number } | null = null;
    for (const t of ts) {
      const mid = quadPoint(it.start, it.ctrl, it.end, t);
      const tan = quadTangent(it.start, it.ctrl, it.end, t);
      const nx = -tan.y;
      const ny = tan.x;
      const nlen = Math.hypot(nx, ny) || 1;
      for (const sign of signs) {
        for (const off of offs) {
          const x = mid.x + (nx / nlen) * sign * off;
          const y = mid.y + (ny / nlen) * sign * off;
          if (Math.hypot(x, y) < roseR + 12) continue;
          const box: PlateBox = { x: x - w / 2, y: y - LABEL_H / 2, w, h: LABEL_H };
          if (plates.some((p) => aabbHit(box, p))) continue;
          if (taken.some((p) => aabbHit(box, p))) continue;
          let score = off + Math.abs(t - 0.5) * 20;
          if (it.directed && sign === ctrlSide) score -= 8;
          if (!best || score < best.score) best = { x, y, score };
        }
      }
    }
    if (best) {
      out.set(it.id, { x: best.x, y: best.y });
      taken.push({ x: best.x - w / 2, y: best.y - LABEL_H / 2, w, h: LABEL_H });
    }
  }
  return out;
}

function distOriginToSeg(a: Pt, b: Pt): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, -(a.x * dx + a.y * dy) / len2));
  return Math.hypot(a.x + t * dx, a.y + t * dy);
}

function minHypotOnCurve(start: Pt, ctrl: Pt, end: Pt): number {
  let m = Infinity;
  for (let i = 0; i <= 16; i++) {
    const p = quadPoint(start, ctrl, end, i / 16);
    m = Math.min(m, Math.hypot(p.x, p.y));
  }
  return m;
}

function shortMidAngle(a: Pt, b: Pt): number {
  const aa = Math.atan2(a.y, a.x);
  const bb = Math.atan2(b.y, b.x);
  let d = bb - aa;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return aa + d / 2;
}

/** If the chord would enter the rose, bulge the control point around the outside. */
export function roseSafeCtrl(from: PlateBox, to: PlateBox, ctrl: Pt, roseR = ROSE_R + ROSE_CLEAR): Pt {
  const a = plateCenter(from);
  const b = plateCenter(to);
  if (distOriginToSeg(a, b) >= roseR && minHypotOnCurve(ellipseExit(from, ctrl, 8), ctrl, ellipseExit(to, ctrl, 8)) >= roseR) {
    return ctrl;
  }
  const mid = shortMidAngle(a, b);
  let r = roseR + 28;
  for (let k = 0; k < 10; k++) {
    const cand = { x: Math.cos(mid) * r, y: Math.sin(mid) * r };
    const s = ellipseExit(from, cand, 8);
    const e = ellipseExit(to, cand, 8);
    if (minHypotOnCurve(s, cand, e) >= roseR) return cand;
    r += 22;
  }
  return { x: Math.cos(mid) * r, y: Math.sin(mid) * r };
}

/**
 * BFS claim → Buchheim tidy tree → polar wrap → exact cluster order.
 * Satellites hang outward; wells cover in-lens cores only.
 */
export function layoutRose(
  cx: number,
  cy: number,
  hubs: HubSpec[],
  people: SeatPerson[],
  plateW: number,
  plateH: number,
  ties: SeatTie[] = [],
): { hubs: HubPose[]; seats: SeatPose[] } {
  const hubSet = new Set(hubs.map((h) => h.id));
  const byPerson = new Map(people.map((p) => [p.id, p]));
  const nbr = (id: string) => {
    const p = byPerson.get(id);
    const fromTies = ties
      .filter((t) => t.from === id || t.to === id)
      .map((t) => (t.from === id ? t.to : t.from));
    return [...new Set([...(p?.neighborIds ?? []), ...fromTies])];
  };
  const inLens = people.filter((p) => p.hubIds.some((h) => hubSet.has(h)));
  const claim = new Map<string, string>();
  const q: string[] = [];
  for (const p of inLens) {
    claim.set(p.id, p.id);
    q.push(p.id);
  }
  for (let i = 0; i < q.length; i++) {
    const id = q[i]!;
    for (const n of nbr(id)) {
      if (claim.has(n) || !byPerson.has(n)) continue;
      claim.set(n, claim.get(id)!);
      q.push(n);
    }
  }

  const clusterIds = new Map<string, string[]>();
  const coresOf = new Map<string, string[]>();
  for (const p of people) {
    const origin = claim.get(p.id);
    if (!origin) continue;
    const originP = byPerson.get(origin)!;
    const hub = originP.hubIds.find((h) => hubSet.has(h)) ?? origin;
    const list = clusterIds.get(hub) ?? [];
    list.push(p.id);
    clusterIds.set(hub, list);
    if (origin === p.id) {
      const cores = coresOf.get(hub) ?? [];
      cores.push(p.id);
      coresOf.set(hub, cores);
    }
  }
  const islands: string[][] = [];
  const seenIsle = new Set<string>();
  for (const p of people) {
    if (claim.has(p.id) || seenIsle.has(p.id)) continue;
    const comp: string[] = [];
    const stack = [p.id];
    seenIsle.add(p.id);
    while (stack.length) {
      const id = stack.pop()!;
      comp.push(id);
      for (const n of nbr(id)) {
        if (claim.has(n) || seenIsle.has(n) || !byPerson.has(n)) continue;
        seenIsle.add(n);
        stack.push(n);
      }
    }
    islands.push(comp);
  }

  const sibGap = plateW + SIB_AIR;
  const clusters: Cluster[] = [];
  const makeCluster = (id: string, hub: HubSpec | null, ids: string[], cores: string[]) => {
    const idSet = new Set(ids);
    const deg = new Map(ids.map((i) => [i, 0]));
    const cross = new Map(ids.map((i) => [i, 0]));
    for (const t of ties) {
      const aIn = idSet.has(t.from);
      const bIn = idSet.has(t.to);
      if (aIn && bIn) {
        deg.set(t.from, (deg.get(t.from) ?? 0) + 1);
        deg.set(t.to, (deg.get(t.to) ?? 0) + 1);
      } else if (aIn) cross.set(t.from, (cross.get(t.from) ?? 0) + 1);
      else if (bIn) cross.set(t.to, (cross.get(t.to) ?? 0) + 1);
    }
    const pool = cores.length ? cores : ids;
    const root = pool.slice().sort((a, b) => {
      const d = (deg.get(b) ?? 0) - (deg.get(a) ?? 0);
      if (d) return d;
      const c = (cross.get(b) ?? 0) - (cross.get(a) ?? 0);
      return c || a.localeCompare(b);
    })[0]!;
    const kids = spanningChildren(idSet, root, ties);
    const nodes = new Map<string, Tidy>();
    const build = (nid: string): Tidy => {
      const n: Tidy = {
        id: nid,
        children: [],
        x: 0,
        minX: 0,
        maxX: 0,
        depth: 0,
      };
      nodes.set(nid, n);
      n.children = (kids.get(nid) ?? []).map(build);
      return n;
    };
    const tidy = build(root);
    tidyLayout(tidy, sibGap);
    let maxDepth = 0;
    const walk = (n: Tidy) => {
      maxDepth = Math.max(maxDepth, n.depth);
      n.children.forEach(walk);
    };
    walk(tidy);
    clusters.push({
      id,
      hub,
      ids,
      cores,
      root,
      tidy,
      width: tidy.maxX - tidy.minX,
      maxDepth,
    });
  };

  for (const h of hubs) {
    const ids = clusterIds.get(h.id);
    if (!ids?.length) continue;
    makeCluster(h.id, h, ids, coresOf.get(h.id) ?? []);
  }
  islands.forEach((ids, i) => makeCluster(`island-${i}`, null, ids, []));

  const layerGap = (cl: Cluster): number => {
    let extra = 0;
    const idSet = new Set(cl.ids);
    for (const t of ties) {
      if (!idSet.has(t.from) || !idSet.has(t.to)) continue;
      extra = Math.max(extra, glyphs(t.label ?? '') * LAYER_PER_GLYPH);
    }
    return plateH + LAYER_AIR + extra;
  };

  const widths = clusters.map((cl) => cl.width + plateW);
  const pads = clusters.length * SECTOR_AIR;
  const r0 = Math.max(
    roseMinR(plateW, plateH) + 12,
    (widths.reduce((s, w) => s + w, 0) + pads) / (2 * Math.PI),
  );

  const dual = ties
    .map((t) => {
      const ca = clusters.find((c) => c.ids.includes(t.from));
      const cb = clusters.find((c) => c.ids.includes(t.to));
      if (!ca || !cb || ca.id === cb.id) return null;
      return { a: ca.id, b: cb.id };
    })
    .filter((x): x is { a: string; b: string } => Boolean(x));

  const ids = clusters.map((c) => c.id);
  let bestOrder = ids;
  let bestCross = Infinity;
  if (ids.length <= 7) {
    for (const perm of permutations(ids)) {
      const c = circleCross(perm, dual);
      if (c < bestCross || (c === bestCross && perm.join() < bestOrder.join())) {
        bestCross = c;
        bestOrder = perm;
      }
    }
  }
  const ordered = bestOrder.map((id) => clusters.find((c) => c.id === id)!);

  const seats: SeatPose[] = [];
  let ang = -Math.PI / 2;
  ordered.forEach((cl) => {
    const span = (cl.width + plateW + SECTOR_AIR) / r0;
    const mid = ang + span / 2;
    const lg = layerGap(cl);
    const xMid = (cl.tidy.minX + cl.tidy.maxX) / 2;
    const walk = (n: Tidy) => {
      const r = r0 + n.depth * lg;
      const th = mid + (n.x - xMid) / Math.max(r, 1);
      seats.push({
        id: n.id,
        x: cx + Math.cos(th) * r - plateW / 2,
        y: cy + Math.sin(th) * r - plateH / 2,
      });
      n.children.forEach(walk);
    };
    walk(cl.tidy);
    ang += span;
  });

  const separated = relaxSeats(seats, ties, plateW, plateH);
  const posed: HubPose[] = [];
  const wells: { x: number; y: number; r: number }[] = [];
  const coreAll = new Set<string>();
  for (const h of hubs) {
    const cl = clusters.find((c) => c.hub?.id === h.id);
    const coreIds = new Set(cl?.cores ?? []);
    coreIds.forEach((id) => coreAll.add(id));
    const coreSeats = separated.filter((s) => coreIds.has(s.id));
    const well = wellFromSeats(coreSeats, 0, 0, plateW, plateH);
    posed.push({ ...h, x: well.cx, y: well.cy, r: well.r });
    if (coreSeats.length) wells.push({ x: well.cx, y: well.cy, r: well.r });
  }
  for (const s of separated) {
    if (coreAll.has(s.id)) continue;
    let cxp = s.x + plateW / 2;
    let cyp = s.y + plateH / 2;
    for (const w of wells) {
      const dx = cxp - w.x;
      const dy = cyp - w.y;
      const dist = Math.hypot(dx, dy);
      if (dist >= w.r + 8) continue;
      if (dist < 1e-6) {
        cxp = w.x + w.r + 8;
        cyp = w.y;
        continue;
      }
      cxp = w.x + (dx / dist) * (w.r + 8);
      cyp = w.y + (dy / dist) * (w.r + 8);
    }
    s.x = cxp - plateW / 2;
    s.y = cyp - plateH / 2;
    const k = keepOffRose(s.x, s.y, plateW, plateH);
    s.x = k.x;
    s.y = k.y;
  }
  return { hubs: posed, seats: separated };
}
