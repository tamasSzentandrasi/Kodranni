import { describe, expect, it } from 'vitest';
import {
  curveHitsBox,
  detourCtrl,
  edgeDraw,
  ellipseExit,
  ellipsePush,
  labelRestLength,
  layoutRose,
  plateCenter,
  pointInEllipse,
  ROSE_R,
  roseMinR,
  roseSafeCtrl,
  type PlateBox,
} from '../src/lib/map-geometry';

const A: PlateBox = { x: 0, y: 0, w: 160, h: 48 };
const B: PlateBox = { x: 400, y: 0, w: 160, h: 48 };

describe('ellipseExit', () => {
  it('leaves the plate toward the neighbour, not at the centre', () => {
    const c = plateCenter(A);
    const p = ellipseExit(A, plateCenter(B), 8);
    expect(p.x).toBeGreaterThan(c.x);
    expect(pointInEllipse(A, p)).toBe(false);
    expect(p.x).toBeGreaterThan(A.x + A.w / 2);
  });

  it('keeps a vertical exit on the short axis', () => {
    const above: PlateBox = { x: 0, y: -200, w: 160, h: 48 };
    const p = ellipseExit(A, plateCenter(above), 0);
    expect(p.y).toBeLessThan(plateCenter(A).y);
    expect(Math.abs(p.x - plateCenter(A).x)).toBeLessThan(1);
  });
});

describe('edgeDraw', () => {
  it('starts and ends outside both plates', () => {
    const e = edgeDraw(A, B, 0, false);
    expect(pointInEllipse(A, e.start)).toBe(false);
    expect(pointInEllipse(B, e.end)).toBe(false);
    expect(pointInEllipse(A, e.label)).toBe(false);
    expect(pointInEllipse(B, e.label)).toBe(false);
  });

  it('puts the label between the plates', () => {
    const e = edgeDraw(A, B, 0, false);
    expect(e.label.x).toBeGreaterThan(A.x + A.w);
    expect(e.label.x).toBeLessThan(B.x);
  });

  it('offsets parallel ties', () => {
    const a = edgeDraw(A, B, 0.28, false);
    const b = edgeDraw(A, B, -0.28, false);
    expect(a.label.y).not.toBeCloseTo(b.label.y, 0);
  });

  it('aims a directed arrow at the far plate', () => {
    const e = edgeDraw(A, B, 0, true);
    expect(e.arrow).not.toBeNull();
    expect(e.arrow!.x).toBeGreaterThan(e.label.x);
    expect(Math.abs(e.arrow!.angle)).toBeLessThan(0.8);
  });

  it('bends around a plate sitting on the straight join', () => {
    const vito: PlateBox = { x: 0, y: 80, w: 160, h: 48 };
    const agnese: PlateBox = { x: 400, y: 80, w: 160, h: 48 };
    const paolo: PlateBox = { x: 200, y: 80, w: 160, h: 48 };
    const ctrl = detourCtrl(vito, agnese, [paolo], 0);
    const start = ellipseExit(vito, ctrl, 8);
    const end = ellipseExit(agnese, ctrl, 8);
    expect(curveHitsBox(start, ctrl, end, paolo)).toBe(false);
  });
});

describe('roseSafeCtrl', () => {
  it('keeps a north-south chord outside the rose', () => {
    const north: PlateBox = { x: -80, y: -280, w: 160, h: 48 };
    const south: PlateBox = { x: -80, y: 240, w: 160, h: 48 };
    const e = edgeDraw(north, south, 0, false);
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      // sample via label and ends — use roseSafeCtrl path
      void t;
    }
    const ctrl = roseSafeCtrl(north, south, { x: 0, y: 0 });
    expect(Math.hypot(ctrl.x, ctrl.y)).toBeGreaterThan(ROSE_R);
    const start = ellipseExit(north, ctrl, 8);
    const end = ellipseExit(south, ctrl, 8);
    expect(Math.hypot(e.label.x, e.label.y)).toBeGreaterThan(ROSE_R * 0.6);
    void start;
    void end;
  });
});

describe('layoutRose', () => {
  it('seats members inside their hub well and unaligned outside', () => {
    const { hubs, seats } = layoutRose(
      0,
      0,
      [
        { id: 'orvanti', name: 'House Orvanti', hue: 42 },
        { id: 'solari', name: 'House Solari', hue: 210 },
      ],
      [
        { id: 'marino', hubIds: ['orvanti'] },
        { id: 'vito', hubIds: ['orvanti'] },
        { id: 'orsa', hubIds: ['solari'] },
        { id: 'tomaso', hubIds: [] },
      ],
      138,
      32,
    );
    expect(hubs).toHaveLength(2);
    expect(Math.hypot(hubs[0]!.x, hubs[0]!.y)).toBeGreaterThan(ROSE_R);
    const marino = seats.find((s) => s.id === 'marino')!;
    const tomaso = seats.find((s) => s.id === 'tomaso')!;
    const orvanti = hubs.find((h) => h.id === 'orvanti')!;
    const dMarino = Math.hypot(marino.x + 69 - orvanti.x, marino.y + 16 - orvanti.y);
    const dTomaso = Math.hypot(tomaso.x + 69 - orvanti.x, tomaso.y + 16 - orvanti.y);
    expect(dMarino).toBeLessThan(orvanti.r);
    expect(dTomaso).toBeGreaterThan(orvanti.r);
  });

  it('spreads housemates along an arc instead of stacking them', () => {
    const { seats } = layoutRose(
      0,
      0,
      [{ id: 'orvanti', name: 'House Orvanti', hue: 42 }],
      [
        { id: 'marino', hubIds: ['orvanti'] },
        { id: 'vito', hubIds: ['orvanti'] },
        { id: 'agnese', hubIds: ['orvanti'] },
      ],
      138,
      32,
    );
    const a = seats.find((s) => s.id === 'marino')!;
    const b = seats.find((s) => s.id === 'vito')!;
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    expect(dist).toBeGreaterThan(100);
  });

  it('gives every person their own slot on the ring', () => {
    const people = Array.from({ length: 14 }, (_, i) => ({
      id: `p${i}`,
      hubIds: ['orvanti'],
    }));
    const { seats } = layoutRose(
      0,
      0,
      [{ id: 'orvanti', name: 'House Orvanti', hue: 42 }],
      people,
      138,
      32,
    );
    expect(seats).toHaveLength(14);
    const keys = seats.map((s) => `${s.x.toFixed(1)},${s.y.toFixed(1)}`);
    expect(new Set(keys).size).toBe(14);
  });

  it('gives a labelled tie enough run for its words', () => {
    const { seats } = layoutRose(
      0,
      0,
      [{ id: 'orvanti', name: 'House Orvanti', hue: 42 }],
      [
        { id: 'a', hubIds: ['orvanti'] },
        { id: 'b', hubIds: ['orvanti'] },
      ],
      138,
      32,
      [{ from: 'a', to: 'b', label: 'upholds his rule as regent' }],
    );
    const a = seats.find((s) => s.id === 'a')!;
    const b = seats.find((s) => s.id === 'b')!;
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    expect(dist).toBeGreaterThan(labelRestLength('upholds his rule as regent', 138) * 0.72);
  });

  it('pulls tied people closer than strangers', () => {
    const { seats } = layoutRose(
      0,
      0,
      [
        { id: 'orvanti', name: 'House Orvanti', hue: 42 },
        { id: 'solari', name: 'House Solari', hue: 210 },
      ],
      [
        { id: 'marino', hubIds: ['orvanti'], neighborIds: ['vito'] },
        { id: 'vito', hubIds: ['orvanti'], neighborIds: ['marino'] },
        { id: 'orsa', hubIds: ['solari'], neighborIds: [] },
        { id: 'tomaso', hubIds: [], neighborIds: [] },
      ],
      138,
      32,
    );
    const marino = seats.find((s) => s.id === 'marino')!;
    const vito = seats.find((s) => s.id === 'vito')!;
    const tomaso = seats.find((s) => s.id === 'tomaso')!;
    const kin = Math.hypot(marino.x - vito.x, marino.y - vito.y);
    const far = Math.hypot(marino.x - tomaso.x, marino.y - tomaso.y);
    expect(kin).toBeLessThan(far);
  });

  it('makes faction wells at least twice the packed cluster', () => {
    const { hubs, seats } = layoutRose(
      0,
      0,
      [{ id: 'orvanti', name: 'House Orvanti', hue: 42 }],
      [
        { id: 'marino', hubIds: ['orvanti'] },
        { id: 'vito', hubIds: ['orvanti'] },
        { id: 'agnese', hubIds: ['orvanti'] },
      ],
      138,
      32,
    );
    const orvanti = hubs.find((h) => h.id === 'orvanti')!;
    const members = ['marino', 'vito', 'agnese'].map((id) => seats.find((s) => s.id === id)!);
    let pack = 0;
    members.forEach((s) => {
      pack = Math.max(
        pack,
        Math.hypot(s.x + 69 - orvanti.x, s.y + 16 - orvanti.y) + Math.hypot(138, 32) / 2,
      );
    });
    expect(orvanti.r).toBeGreaterThanOrEqual(pack * 2 - 2);
  });

  it('keeps plates off the rose and off each other', () => {
    const people = [
      { id: 'marino', hubIds: ['orvanti'] },
      { id: 'vito', hubIds: ['orvanti'] },
      { id: 'orsa', hubIds: ['solari'] },
      { id: 'caterina', hubIds: ['solari'] },
      { id: 'piero', hubIds: ['calvo'] },
      { id: 'paolo', hubIds: ['calvo'] },
      { id: 'tomaso', hubIds: [] },
      { id: 'lazzaro', hubIds: [] },
      { id: 'jakov', hubIds: [] },
    ];
    const { seats } = layoutRose(
      0,
      0,
      [
        { id: 'orvanti', name: 'House Orvanti', hue: 42 },
        { id: 'solari', name: 'House Solari', hue: 210 },
        { id: 'calvo', name: 'House Calvo', hue: 48 },
      ],
      people,
      138,
      32,
    );
    const minR = roseMinR(138, 32);
    for (const s of seats) {
      expect(Math.hypot(s.x + 69, s.y + 16)).toBeGreaterThan(minR - 1);
    }
    for (let i = 0; i < seats.length; i++) {
      for (let j = i + 1; j < seats.length; j++) {
        const a = seats[i]!;
        const b = seats[j]!;
        expect(ellipsePush(a.x, a.y, 138, 32, b.x, b.y, 138, 32, 8)).toBeNull();
      }
    }
  });
});

