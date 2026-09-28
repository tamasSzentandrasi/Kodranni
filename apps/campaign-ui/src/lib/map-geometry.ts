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
  return { d, start, end, label, arrow };
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

export type HubPose = HubSpec & { x: number; y: number; r: number };
export type SeatPose = { id: string; x: number; y: number };

/** Radial seating: hubs on a ring, people on faction arcs, unaligned on an outer walk. */
export const ROSE_R = 164;
export const ROSE_CLEAR = 52;

const WELL_MIN = 280;
const WELL_SCALE = 2.15;
const PACK_GAP = 24;

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

function estimatedWell(count: number, plateW: number, plateH: number): number {
  const pack = plateClear(plateW, plateH) * Math.sqrt(Math.max(count, 1)) * 1.2 + 36;
  return Math.max(WELL_MIN, pack * WELL_SCALE);
}

function sunflower(
  hx: number,
  hy: number,
  members: SeatPerson[],
  plateW: number,
  plateH: number,
): SeatPose[] {
  if (members.length === 0) return [];
  if (members.length === 1) {
    return [{ id: members[0]!.id, x: hx - plateW / 2, y: hy - plateH / 2 }];
  }
  const golden = Math.PI * (3 - Math.sqrt(5));
  const scale = plateClear(plateW, plateH) * 1.12;
  return members.map((p, i) => {
    const r = scale * Math.sqrt(i + 0.55);
    const a = i * golden;
    return {
      id: p.id,
      x: hx + Math.cos(a) * r - plateW / 2,
      y: hy + Math.sin(a) * r - plateH / 2,
    };
  });
}

function orderHubs(
  hubs: HubSpec[],
  people: SeatPerson[],
  membersOf: Map<string, SeatPerson[]>,
): HubSpec[] {
  if (hubs.length < 2) return hubs.slice();
  const hubOf = (id: string) => {
    const p = people.find((x) => x.id === id);
    return p?.hubIds.find((h) => membersOf.has(h)) ?? '';
  };
  const ties = (a: string, b: string) => {
    let n = 0;
    for (const p of people) {
      if (hubOf(p.id) !== a) continue;
      for (const q of p.neighborIds ?? []) {
        if (hubOf(q) === b) n += 1;
      }
    }
    return n;
  };
  const left = hubs.slice();
  left.sort((a, b) => (membersOf.get(b.id)?.length ?? 0) - (membersOf.get(a.id)?.length ?? 0));
  const out: HubSpec[] = [left.shift()!];
  while (left.length) {
    const last = out[out.length - 1]!;
    left.sort((a, b) => {
      const tb = ties(last.id, b.id) + ties(b.id, last.id);
      const ta = ties(last.id, a.id) + ties(a.id, last.id);
      return tb - ta || (membersOf.get(b.id)?.length ?? 0) - (membersOf.get(a.id)?.length ?? 0);
    });
    out.push(left.shift()!);
  }
  return out;
}

function angleDelta(from: number, to: number): number {
  let d = to - from;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

/**
 * Polar force polish: circular order is the starting angle, not the result.
 * Springs along ties, ellipse collide, radial band, weak charge, soft
 * angular memory so houses stay in an arc without equal slots.
 */
export function polishAnnulus(
  seats: SeatPose[],
  people: SeatPerson[],
  plateW: number,
  plateH: number,
  ticks = 110,
): SeatPose[] {
  const minR = roseMinR(plateW, plateH);
  const maxR = minR + 620;
  const midR = minR + 120;
  const person = new Map(people.map((p) => [p.id, p]));
  const hubOf = (id: string) => person.get(id)?.hubIds[0] ?? '';
  const nodes = seats.map((s) => {
    const cx = s.x + plateW / 2;
    const cy = s.y + plateH / 2;
    const deg = person.get(s.id)?.neighborIds?.length ?? 0;
    const aligned = Boolean(hubOf(s.id));
    return {
      id: s.id,
      x: cx,
      y: cy,
      vx: 0,
      vy: 0,
      hub: hubOf(s.id),
      homeAng: Math.atan2(cy, cx),
      targetR: Math.max(minR, midR - Math.min(deg, 5) * 18 + (aligned ? 0 : 110)),
    };
  });
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const pairs: { a: (typeof nodes)[0]; b: (typeof nodes)[0]; rest: number; str: number }[] = [];
  const seen = new Set<string>();
  for (const p of people) {
    for (const q of p.neighborIds ?? []) {
      const key = p.id < q ? `${p.id}|${q}` : `${q}|${p.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const a = byId.get(p.id);
      const b = byId.get(q);
      if (!a || !b) continue;
      const same = Boolean(hubOf(p.id) && hubOf(p.id) === hubOf(q));
      const rest = same ? 160 : 500;
      pairs.push({ a, b, rest, str: same ? 0.085 : 0.022 });
    }
  }

  let alpha = 1;
  for (let t = 0; t < ticks; t++) {
    alpha *= 0.978;
    for (const n of nodes) {
      const r = Math.hypot(n.x, n.y) || 1;
      const ux = n.x / r;
      const uy = n.y / r;
      n.vx += ux * (n.targetR - r) * 0.018 * alpha;
      n.vy += uy * (n.targetR - r) * 0.018 * alpha;
      const ang = Math.atan2(n.y, n.x);
      const da = angleDelta(ang, n.homeAng);
      n.vx += -uy * da * r * 0.022 * alpha;
      n.vy += ux * da * r * 0.022 * alpha;
    }
    const centroids = new Map<string, { x: number; y: number; n: number; well: number }>();
    for (const n of nodes) {
      if (!n.hub) continue;
      const c = centroids.get(n.hub) ?? { x: 0, y: 0, n: 0, well: 0 };
      c.x += n.x;
      c.y += n.y;
      c.n += 1;
      centroids.set(n.hub, c);
    }
    centroids.forEach((c, id) => {
      c.x /= c.n;
      c.y /= c.n;
      c.well = estimatedWell(c.n, plateW, plateH);
      void id;
    });
    for (const n of nodes) {
      if (!n.hub) continue;
      const c = centroids.get(n.hub);
      if (!c) continue;
      n.vx += (c.x - n.x) * 0.12 * alpha;
      n.vy += (c.y - n.y) * 0.12 * alpha;
    }
    const hubIds = [...centroids.keys()];
    for (let i = 0; i < hubIds.length; i++) {
      for (let j = i + 1; j < hubIds.length; j++) {
        const ca = centroids.get(hubIds[i]!)!;
        const cb = centroids.get(hubIds[j]!)!;
        const dx = cb.x - ca.x;
        const dy = cb.y - ca.y;
        const dist = Math.hypot(dx, dy) || 1;
        const min = (ca.well + cb.well) * 0.42;
        if (dist >= min) continue;
        const push = ((min - dist) / dist) * 0.08 * alpha;
        for (const n of nodes) {
          if (n.hub === hubIds[i]) {
            n.vx -= dx * push;
            n.vy -= dy * push;
          } else if (n.hub === hubIds[j]) {
            n.vx += dx * push;
            n.vy += dy * push;
          }
        }
      }
    }
    for (const { a, b, rest, str } of pairs) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy) || 1;
      const f = ((dist - rest) / dist) * str * alpha;
      a.vx += dx * f;
      a.vy += dy * f;
      b.vx -= dx * f;
      b.vy -= dy * f;
    }
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]!;
        const b = nodes[j]!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < 560) {
          const rep = (520 / dist) * 0.014 * alpha;
          a.vx -= (dx / dist) * rep;
          a.vy -= (dy / dist) * rep;
          b.vx += (dx / dist) * rep;
          b.vy += (dy / dist) * rep;
        }
      }
    }
    for (const n of nodes) {
      n.vx *= 0.76;
      n.vy *= 0.76;
      n.x += n.vx;
      n.y += n.vy;
    }
    for (let k = 0; k < 4; k++) {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]!;
          const b = nodes[j]!;
          const p = ellipsePush(
            a.x - plateW / 2,
            a.y - plateH / 2,
            plateW,
            plateH,
            b.x - plateW / 2,
            b.y - plateH / 2,
            plateW,
            plateH,
          );
          if (!p) continue;
          a.x += p.x;
          a.y += p.y;
          b.x -= p.x;
          b.y -= p.y;
        }
      }
    }
    for (const n of nodes) {
      const r = Math.hypot(n.x, n.y) || 1;
      if (r < minR) {
        n.x *= minR / r;
        n.y *= minR / r;
      } else if (r > maxR) {
        n.x *= maxR / r;
        n.y *= maxR / r;
      }
    }
  }

  return nodes.map((n) => ({ id: n.id, x: n.x - plateW / 2, y: n.y - plateH / 2 }));
}

/** Barycentric order inside a group (Sugiyama-style crossing reduction). */
function barycenterOrder(members: SeatPerson[]): SeatPerson[] {
  const arr = members.slice();
  if (arr.length < 3) return arr;
  const nbr = new Map(arr.map((p) => [p.id, p.neighborIds ?? []]));
  for (let k = 0; k < 8; k++) {
    const idx = new Map(arr.map((p, i) => [p.id, i]));
    arr.sort((a, b) => {
      const mean = (p: SeatPerson) => {
        const hits = (nbr.get(p.id) ?? [])
          .map((id) => idx.get(id))
          .filter((v): v is number => v != null);
        if (!hits.length) return idx.get(p.id) ?? 0;
        return hits.reduce((s, v) => s + v, 0) / hits.length;
      };
      const d = mean(a) - mean(b);
      return d !== 0 ? d : a.id.localeCompare(b.id);
    });
  }
  return arr;
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
 * Around the rose: grouped circular order (crossings, houses together),
 * then a polar force polish (tie distance, density, readability).
 */
export function layoutRose(
  cx: number,
  cy: number,
  hubs: HubSpec[],
  people: SeatPerson[],
  plateW: number,
  plateH: number,
): { hubs: HubPose[]; seats: SeatPose[] } {
  const hubIds = new Set(hubs.map((h) => h.id));
  const membersOf = new Map<string, SeatPerson[]>();
  const unaligned: SeatPerson[] = [];
  for (const p of people) {
    const ids = p.hubIds.filter((id) => hubIds.has(id));
    if (ids.length === 0) {
      unaligned.push(p);
      continue;
    }
    const key = ids[0]!;
    const g = membersOf.get(key) ?? [];
    g.push(p);
    membersOf.set(key, g);
  }

  const ordered = orderHubs(hubs, people, membersOf);
  const groups = ordered.map((h) => ({
    hub: h,
    members: barycenterOrder(membersOf.get(h.id) ?? []),
  }));
  const wellRs = groups.map((g) => estimatedWell(g.members.length, plateW, plateH));
  const maxWell = wellRs.reduce((m, r) => Math.max(m, r), WELL_MIN);
  const ringR = Math.max(roseMinR(plateW, plateH) + maxWell * 0.48, 380);
  const weight = wellRs.map((r) => Math.max(r, 1));
  const sumW = weight.reduce((s, w) => s + w, 0) || 1;

  const seats: SeatPose[] = [];
  const posed: HubPose[] = [];
  let a = -Math.PI / 2;
  groups.forEach((g, i) => {
    const slice = (weight[i]! / sumW) * 2 * Math.PI;
    const mid = a + slice / 2;
    const hx = cx + Math.cos(mid) * ringR;
    const hy = cy + Math.sin(mid) * ringR;
    const packed = sunflower(hx, hy, g.members, plateW, plateH);
    seats.push(...packed);
    const well = wellFromSeats(packed, hx, hy, plateW, plateH);
    posed.push({ ...g.hub, x: well.cx, y: well.cy, r: well.r });
    a += slice;
  });

  const outer = ringR + maxWell * 0.62 + plateClear(plateW, plateH);
  const gapMids: number[] = [];
  if (groups.length === 0) {
    gapMids.push(-Math.PI / 2);
  } else {
    let b = -Math.PI / 2;
    groups.forEach((_, i) => {
      const slice = (weight[i]! / sumW) * 2 * Math.PI;
      gapMids.push(b + slice);
      b += slice;
    });
  }
  barycenterOrder(unaligned).forEach((p, i) => {
    const ang = gapMids[i % gapMids.length]! + (Math.floor(i / gapMids.length) - 0.35) * 0.22;
    const r = outer + Math.floor(i / Math.max(gapMids.length, 1)) * 2 * plateClear(plateW, plateH);
    seats.push({
      id: p.id,
      x: cx + Math.cos(ang) * r - plateW / 2,
      y: cy + Math.sin(ang) * r - plateH / 2,
    });
  });

  const polished = polishAnnulus(seats, people, plateW, plateH);
  const separated = separateSeats(polished, plateW, plateH, 24);
  const byId = new Map(separated.map((s) => [s.id, s]));
  posed.forEach((h, hi) => {
    const memberSeats = (groups[hi]?.members ?? [])
      .map((p) => byId.get(p.id))
      .filter((s): s is SeatPose => Boolean(s));
    const well = wellFromSeats(memberSeats, h.x, h.y, plateW, plateH);
    h.x = well.cx;
    h.y = well.cy;
    h.r = well.r;
  });
  return { hubs: posed, seats: separated };
}
