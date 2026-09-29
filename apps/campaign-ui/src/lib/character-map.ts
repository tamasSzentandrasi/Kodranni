import {
  edgeCurvature,
  isDirectedEdge,
  isKinEdge,
  kinNeighborhood,
} from '@kodranni/store/relation-map';
import type { RelationMap, RelationMapNode } from '@kodranni/store/types';
import {
  edgeDraw,
  ellipsePush,
  keepOffRose,
  layoutRose,
  placeEdgeLabels,
  ROSE_R,
  type PlateBox,
} from './map-geometry';

const PLATE_W = 138;
const PLATE_H = 32;
const ZOOM_MIN = 0.48;
const ZOOM_MAX = 1.65;
const LAYOUT_MS = 520;

type LabMark = { x: number; y: number; text: string; color: string; dim: boolean };
type ArrowMark = { x: number; y: number; angle: number; dim: boolean };

function easeSmooth(t: number): number {
  return t * t * (3 - 2 * t);
}

function backHref(): string {
  const stored = document.documentElement.getAttribute('data-cmap-back-href');
  if (stored) return stored;
  try {
    const r = document.referrer ? new URL(document.referrer) : null;
    if (r && r.origin === location.origin) {
      const p = r.pathname;
      if (/^\/(community|characters)(\/|$)/.test(p) && p.indexOf('character-map') < 0) {
        return p + r.search;
      }
    }
  } catch {
    /* keep default */
  }
  return '/community/hierarchy/';
}

type SimNode = RelationMapNode & {
  homeX: number;
  homeY: number;
  fx?: number;
  fy?: number;
};

function firstName(text: string): string {
  return text.trim().split(/\s+/)[0] ?? text;
}

function plateEl(node: RelationMapNode): HTMLElement {
  const el = document.createElement(node.slug ? 'button' : 'span');
  if (node.slug) (el as HTMLButtonElement).type = 'button';
  el.className = 'member cmap-plate';
  if (!node.slug) el.classList.add('cmap-plate--bare');
  if (node.faction) el.classList.add('cmap-plate--faction');
  el.innerHTML = `<span class="member__stain" aria-hidden="true"></span><span class="member__glow" aria-hidden="true"></span><span class="member__name"></span>`;
  el.querySelector('.member__name')!.textContent = node.text;
  if (node.color && node.faction) {
    el.setAttribute('data-stain', 'true');
    el.style.setProperty('--stain', node.color);
  }
  el.dataset.id = node.id;
  if (node.slug) el.dataset.slug = node.slug;
  return el;
}

function parseMapJson(raw: string | null | undefined): RelationMap | null {
  if (!raw?.trim()) return null;
  try {
    const map = JSON.parse(raw) as RelationMap;
    if (!map?.nodes?.length) return null;
    return map;
  } catch {
    return null;
  }
}

type MapMeta = {
  campaign: string;
  groups: { id: string; name: string; kind: string }[];
  labels: { id: string; groupId: string; name: string; hue?: number }[];
  roster: { slug: string; labelIds: string[] }[];
};

function readMeta(): MapMeta {
  const el = document.getElementById('kod-map-meta');
  const text =
    el instanceof HTMLTemplateElement ? el.content.textContent : el?.textContent;
  try {
    const m = JSON.parse(text || '{}') as MapMeta;
    return {
      campaign: m.campaign ?? '',
      groups: m.groups ?? [],
      labels: m.labels ?? [],
      roster: m.roster ?? [],
    };
  } catch {
    return { campaign: '', groups: [], labels: [], roster: [] };
  }
}

function readMap(root: HTMLElement): RelationMap | null {
  const fromAttr = parseMapJson(root.getAttribute('data-map'));
  if (fromAttr) return fromAttr;
  const el = document.getElementById('kod-map-data');
  if (!el) return null;
  const text =
    el instanceof HTMLTemplateElement ? el.content.textContent : el.textContent;
  return parseMapJson(text);
}

function hideWait(root: HTMLElement) {
  const wait = root.querySelector('[data-cmap-wait]') as HTMLElement | null;
  if (wait) wait.hidden = true;
}

function showFail(root: HTMLElement, err: unknown) {
  hideWait(root);
  const empty = root.querySelector('[data-cmap-empty]') as HTMLElement | null;
  if (empty) {
    empty.hidden = false;
    const msg = err instanceof Error ? err.message : String(err);
    empty.textContent = `The map could not be drawn (${msg}).`;
  }
}

function boxOf(n: SimNode): PlateBox {
  return { x: n.x, y: n.y, w: n.width || PLATE_W, h: n.height || PLATE_H };
}

function clampPlate(n: SimNode) {
  const k = keepOffRose(n.x, n.y, n.width || PLATE_W, n.height || PLATE_H);
  n.x = k.x;
  n.y = k.y;
}

function settle(nodes: SimNode[], ticks: number) {
  for (let t = 0; t < ticks; t++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]!;
        const b = nodes[j]!;
        const p = ellipsePush(
          a.x,
          a.y,
          a.width || PLATE_W,
          a.height || PLATE_H,
          b.x,
          b.y,
          b.width || PLATE_W,
          b.height || PLATE_H,
        );
        if (!p) continue;
        if (a.fx == null) {
          a.x += p.x;
          a.y += p.y;
        }
        if (b.fx == null) {
          b.x -= p.x;
          b.y -= p.y;
        }
      }
    }
    for (const n of nodes) {
      if (n.fx != null && n.fy != null) {
        n.x = n.fx;
        n.y = n.fy;
        clampPlate(n);
        n.fx = n.x;
        n.fy = n.y;
        continue;
      }
      n.x += (n.homeX - n.x) * 0.08;
      n.y += (n.homeY - n.y) * 0.08;
      clampPlate(n);
    }
  }
}

function inkOf(color: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return '#f3eee4';
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const mix = (c: number) => Math.round(c * 0.28 + 243 * 0.72);
  const to = (c: number) => c.toString(16).padStart(2, '0');
  return `#${to(mix(r))}${to(mix(g))}${to(mix(b))}`;
}

export function bootMap(): void {
  const root = document.querySelector('.kod-cmap') as HTMLElement | null;
  const mount = root?.querySelector('[data-cmap-web]') as HTMLElement | null;
  if (!root || !mount) return;
  if (root.dataset.booted === '1') return;
  root.dataset.booted = '1';
  root.classList.add('is-in');
  const map = readMap(root);
  if (!map) {
    hideWait(root);
    return;
  }
  try {
    bootMap2d(root, mount, map);
    hideWait(root);
  } catch (err) {
    console.error('[kodranni] character map failed', err);
    showFail(root, err);
  }
}

function bootMap2d(root: HTMLElement, mount: HTMLElement, map: RelationMap): void {
  const findInput = (document.querySelector('[data-hall-q]') ||
    root.querySelector('[data-cmap-find]')) as HTMLInputElement | null;
  const familyBtn = document.querySelector('[data-cmap-family]') as HTMLButtonElement | null;
  const focusBox = root.querySelector('[data-cmap-focus]') as HTMLElement | null;
  const focusName = root.querySelector('[data-cmap-focus-name]') as HTMLElement | null;
  const sheetLink = root.querySelector('[data-cmap-sheet]') as HTMLAnchorElement | null;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let selected = root.getAttribute('data-person') || '';
  let family = false;
  let query = '';
  let panX = 0;
  let panY = 0;
  let scale = 1;
  let draggingField = false;
  let draggingPlate: SimNode | null = null;
  let lastX = 0;
  let lastY = 0;
  let anim = 0;
  let labs: LabMark[] = [];
  let arrows: ArrowMark[] = [];
  const wellEls = new Map<string, HTMLElement>();

  const meta = readMeta();
  const campaign = meta.campaign || root.getAttribute('data-campaign') || '';
  const catBtns = [...document.querySelectorAll('[data-hall-legend] [data-view-group]')] as HTMLButtonElement[];
  let catId = catBtns[0]?.getAttribute('data-view-group') || '';

  const nodes: SimNode[] = map.nodes
    .filter((n) => !n.faction)
    .map((n) => ({
      ...n,
      width: PLATE_W,
      height: PLATE_H,
      homeX: n.x,
      homeY: n.y,
    }));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const slugLabels = new Map(meta.roster.map((r) => [r.slug, r.labelIds]));

  const stage = document.createElement('div');
  stage.className = 'kod-cmap__stage';
  const rose = document.createElement('a');
  rose.className = 'kod-cmap__rose';
  rose.href = backHref();
  rose.setAttribute('data-cmap-back', '');
  rose.setAttribute('aria-label', 'Back to the hall');
  rose.setAttribute('data-tip', 'Back to the hall');
  rose.setAttribute('title', 'Back to the hall');
  const halo = document.createElement('span');
  halo.className = 'kod-cmap__halo';
  halo.setAttribute('aria-hidden', 'true');
  const glass = document.createElement('span');
  glass.className = 'kod-cmap__glass';
  const roseImg = document.createElement('img');
  roseImg.src = '/ornament/cmap-mark.jpg';
  roseImg.alt = '';
  const moon = document.createElement('span');
  moon.className = 'kod-cmap__moon';
  moon.setAttribute('aria-hidden', 'true');
  glass.append(roseImg, moon);
  const title = document.createElement('strong');
  title.className = 'kod-cmap__title';
  title.textContent = campaign;
  rose.append(halo, glass, title);
  rose.addEventListener('pointerdown', (ev) => ev.stopPropagation());
  rose.addEventListener('click', (ev) => ev.stopPropagation());
  const wellLayer = document.createElement('div');
  wellLayer.className = 'kod-cmap__wells';
  const hubLayer = document.createElement('div');
  hubLayer.className = 'kod-cmap__hubs';
  hubLayer.hidden = true;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'kod-cmap__edges');
  const plateLayer = document.createElement('div');
  plateLayer.className = 'kod-cmap__nodes';
  const hud = document.createElement('div');
  hud.className = 'kod-cmap__hud';
  const arrowHud = document.createElement('div');
  arrowHud.className = 'kod-cmap__hud-arrows';
  const labHud = document.createElement('div');
  labHud.className = 'kod-cmap__hud-labs';
  hud.append(arrowHud, labHud);
  const menu = document.createElement('div');
  menu.className = 'cmap-menu';
  menu.hidden = true;
  stage.appendChild(rose);
  stage.appendChild(wellLayer);
  stage.appendChild(hubLayer);
  stage.appendChild(svg);
  stage.appendChild(plateLayer);
  mount.replaceChildren(stage, hud);
  root.appendChild(menu);

  const plates = new Map<string, HTMLElement>();
  nodes.forEach((n) => {
    const el = plateEl(n);
    el.addEventListener('pointerdown', (ev) => {
      if (ev.button !== 0) return;
      ev.stopPropagation();
      draggingPlate = n;
      lastX = ev.clientX;
      lastY = ev.clientY;
      (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
    });
    el.addEventListener('click', (ev) => {
      ev.stopPropagation();
      select(n.slug || n.id);
    });
    el.addEventListener('contextmenu', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      select(n.slug || n.id);
      openMenu(ev.clientX, ev.clientY, n);
    });
    plates.set(n.id, el);
    plateLayer.appendChild(el);
  });

  function closeMenu() {
    menu.hidden = true;
  }

  function toggleFamily() {
    if (!selected) return;
    family = !family;
    refreshDock();
    layout(true);
    closeMenu();
  }

  function openMenu(x: number, y: number, n: SimNode) {
    const items: string[] = [`<button type="button" data-act="centre">Centre here</button>`];
    items.push(
      `<button type="button" data-act="family">${family ? 'All relations' : 'Show family'}</button>`,
    );
    if (n.slug) {
      items.push(
        `<a data-act="sheet" href="/characters/${encodeURIComponent(n.slug)}/">Open sheet</a>`,
      );
    }
    menu.innerHTML = items.join('');
    menu.hidden = false;
    menu.style.left = `${x + 6}px`;
    menu.style.top = `${y + 6}px`;
    menu.querySelector('[data-act="centre"]')?.addEventListener('click', () => {
      const vw = mount.clientWidth || 800;
      const vh = mount.clientHeight || 520;
      panX = vw / 2 - (n.x + PLATE_W / 2) * scale;
      panY = vh / 2 - (n.y + PLATE_H / 2) * scale;
      applyStage();
      closeMenu();
    });
    menu.querySelector('[data-act="family"]')?.addEventListener('click', () => toggleFamily());
  }
  document.addEventListener('pointerdown', (ev) => {
    if (!menu.contains(ev.target as Node)) closeMenu();
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') closeMenu();
  });

  function kinIds(): Set<string> {
    if (!selected) return new Set();
    return new Set(kinNeighborhood(map, selected).nodes.map((n) => n.id));
  }

  function hubIdsFor(n: SimNode): string[] {
    const inCat = (id: string) => meta.labels.some((l) => l.id === id && l.groupId === catId);
    const ids = (n.slug ? slugLabels.get(n.slug) ?? [] : []).filter(inCat);
    if (ids.length) return ids;
    const tail = n.text.trim().split(/\s+/).pop()?.toLowerCase() ?? '';
    if (tail.length < 3) return [];
    const hit = meta.labels.find(
      (l) => l.groupId === catId && l.hue != null && l.name.toLowerCase().includes(tail),
    );
    return hit ? [hit.id] : [];
  }

  let lastHubs: { id: string; name: string; hue: number; x: number; y: number; r: number }[] = [];

  function applyHomes() {
    const active = meta.labels.filter((l) => l.groupId === catId && l.hue != null);
    const people = nodes.map((n) => ({
      id: n.id,
      hubIds: hubIdsFor(n),
      neighborIds: map.edges
        .filter((e) => e.fromNode === n.id || e.toNode === n.id)
        .map((e) => (e.fromNode === n.id ? e.toNode : e.fromNode)),
    }));
    const posed = layoutRose(
      0,
      0,
      active.map((l) => ({ id: l.id, name: l.name, hue: l.hue ?? 0 })),
      people,
      PLATE_W,
      PLATE_H,
      map.edges.map((e) => ({
        from: e.fromNode,
        to: e.toNode,
        label: e.label ?? '',
        directed: isDirectedEdge(e),
      })),
    );
    lastHubs = posed.hubs;
    paintHubs(posed.hubs);
    const seat = new Map(posed.seats.map((s) => [s.id, s]));
    const kin = family ? kinIds() : new Set<string>();
    const focus = nodes.find((n) => n.id === selected || n.slug === selected);
    nodes.forEach((n) => {
      if (n.fx != null && n.fy != null) {
        n.homeX = n.fx;
        n.homeY = n.fy;
        return;
      }
      const s = seat.get(n.id);
      let hx = s?.x ?? n.homeX;
      let hy = s?.y ?? n.homeY;
      if (family && focus) {
        const fcx = focus.homeX;
        const fcy = focus.homeY;
        if (kin.has(n.id)) {
          hx = hx + (fcx - hx) * 0.28;
          hy = hy + (fcy - hy) * 0.28;
        } else {
          hx = hx + (hx - fcx) * 0.08;
          hy = hy + (hy - fcy) * 0.08;
        }
      }
      n.homeX = hx;
      n.homeY = hy;
    });
  }

  function paintHubs(hubs: { id: string; name: string; hue: number; x: number; y: number; r: number }[]) {
    const seen = new Set<string>();
    hubs.forEach((h) => {
      seen.add(h.id);
      let well = wellEls.get(h.id);
      if (!well) {
        well = document.createElement('div');
        well.className = 'kod-cmap__well';
        well.innerHTML = `<span class="kod-cmap__well-name"></span>`;
        wellEls.set(h.id, well);
        wellLayer.appendChild(well);
      }
      well.style.setProperty('--well-h', String(h.hue));
      const name = well.querySelector('.kod-cmap__well-name');
      if (name) name.textContent = h.name;
      well.style.left = `${h.x - h.r}px`;
      well.style.top = `${h.y - h.r}px`;
      well.style.width = `${h.r * 2}px`;
      well.style.height = `${h.r * 2}px`;
      well.classList.add('is-on');
    });
    wellEls.forEach((el, id) => {
      if (seen.has(id)) return;
      el.classList.remove('is-on');
      window.setTimeout(() => {
        if (el.classList.contains('is-on')) return;
        el.remove();
        wellEls.delete(id);
      }, LAYOUT_MS);
    });
  }

  function fitView() {
    const c = cameraForFit();
    panX = c.panX;
    panY = c.panY;
    scale = c.scale;
  }

  function applyHud() {
    while (arrowHud.childElementCount > arrows.length) arrowHud.removeChild(arrowHud.lastChild!);
    arrows.forEach((m, i) => {
      let el = arrowHud.children[i] as HTMLImageElement | undefined;
      if (!el) {
        el = document.createElement('img');
        el.className = 'kod-cmap__hud-arrow';
        el.src = '/ornament/cmap-arrow.png';
        el.alt = '';
        arrowHud.appendChild(el);
      }
      el.classList.toggle('is-dim', m.dim);
      const sx = panX + m.x * scale;
      const sy = panY + m.y * scale;
      const deg = (m.angle * 180) / Math.PI;
      el.style.transform = `translate(${sx}px, ${sy}px) translate(-50%, -50%) rotate(${deg}deg)`;
    });
    while (labHud.childElementCount > labs.length) labHud.removeChild(labHud.lastChild!);
    const pos = labs.map((m) => ({
      x: panX + m.x * scale,
      y: panY + m.y * scale,
    }));
    for (let i = 0; i < pos.length; i++) {
      for (let j = i + 1; j < pos.length; j++) {
        const a = pos[i]!;
        const b = pos[j]!;
        if (Math.abs(a.x - b.x) < 90 && Math.abs(a.y - b.y) < 16) {
          b.y += 15;
        }
      }
    }
    labs.forEach((m, i) => {
      let el = labHud.children[i] as HTMLElement | undefined;
      if (!el) {
        el = document.createElement('span');
        el.className = 'kod-cmap__hud-lab';
        labHud.appendChild(el);
      }
      el.textContent = m.text;
      el.style.color = m.color;
      el.classList.toggle('is-dim', m.dim);
      el.style.transform = `translate(${pos[i]!.x}px, ${pos[i]!.y}px) translate(-50%, -110%)`;
    });
  }

  function applyStage() {
    stage.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
    const visual = Math.max(0.84, Math.min(1.16, 0.92 + 0.12 * scale));
    const extra = visual / scale;
    plates.forEach((el) => {
      el.style.transform = `scale(${extra})`;
      el.style.transformOrigin = 'center center';
    });
    applyHud();
  }

  function drawEdges() {
    const ns = 'http://www.w3.org/2000/svg';
    svg.replaceChildren();
    labs = [];
    arrows = [];
    let minX = 0;
    let minY = 0;
    let maxX = 800;
    let maxY = 600;
    nodes.forEach((n) => {
      minX = Math.min(minX, n.x - 40);
      minY = Math.min(minY, n.y - 40);
      maxX = Math.max(maxX, n.x + PLATE_W + 40);
      maxY = Math.max(maxY, n.y + PLATE_H + 40);
    });
    svg.setAttribute('viewBox', `${minX} ${minY} ${maxX - minX} ${maxY - minY}`);
    svg.style.left = `${minX}px`;
    svg.style.top = `${minY}px`;
    svg.style.width = `${maxX - minX}px`;
    svg.style.height = `${maxY - minY}px`;

    const kin = family ? kinIds() : null;
    const focus = selected
      ? nodes.find((n) => n.id === selected || n.slug === selected)
      : undefined;
    function boxFor(id: string): PlateBox | undefined {
      const n = byId.get(id);
      if (n) return boxOf(n);
      const raw = map.nodes.find((m) => m.id === id);
      if (!raw?.faction) return;
      const hub = lastHubs.find((h) => h.name === raw.text);
      if (!hub) return;
      return { x: hub.x - 28, y: hub.y - 28, w: 56, h: 56 };
    }
    const drawn: {
      e: (typeof map.edges)[number];
      draw: ReturnType<typeof edgeDraw>;
      dim: boolean;
      lit: boolean;
    }[] = [];
    map.edges.forEach((e) => {
      const a = boxFor(e.fromNode);
      const b = boxFor(e.toNode);
      if (!a || !b) return;
      const blockers = nodes
        .filter((n) => n.id !== e.fromNode && n.id !== e.toNode)
        .map(boxOf);
      const draw = edgeDraw(
        a,
        b,
        edgeCurvature(map.edges, e),
        isDirectedEdge(e),
        8,
        blockers,
      );
      const onFocus = Boolean(
        focus && (e.fromNode === focus.id || e.toNode === focus.id),
      );
      const dimKin = kin && !(kin.has(e.fromNode) && kin.has(e.toNode) && isKinEdge(e));
      const dim = Boolean(dimKin) || Boolean(focus && !onFocus);
      const lit = Boolean(focus && onFocus && !dimKin);
      drawn.push({ e, draw, dim, lit });
    });
    const slots = placeEdgeLabels(
      drawn
        .filter((d) => d.e.label)
        .map((d) => ({
          id: d.e.id,
          start: d.draw.start,
          end: d.draw.end,
          ctrl: d.draw.ctrl,
          label: d.e.label ?? '',
          directed: isDirectedEdge(d.e),
        })),
      nodes.map(boxOf),
      ROSE_R + 8,
    );
    drawn.forEach((d) => {
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('d', d.draw.d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', d.e.color || '#8a8580');
      path.style.setProperty('--edge', d.e.color || '#8a8580');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-width', d.lit ? '3.15' : '2.1');
      if (d.lit) path.classList.add('is-lit');
      if (d.dim) path.classList.add('is-dim');
      svg.appendChild(path);
      if (d.draw.arrow) {
        arrows.push({
          x: d.draw.arrow.x,
          y: d.draw.arrow.y,
          angle: d.draw.arrow.angle,
          dim: d.dim,
        });
      }
      if (d.e.label) {
        const slot = slots.get(d.e.id) ?? d.draw.label;
        labs.push({
          x: slot.x,
          y: slot.y,
          text: d.e.label,
          color: inkOf(d.e.color || '#d8d0c4'),
          dim: d.dim,
        });
      }
    });
    applyHud();
  }

  function paintPlates() {
    const q = query.trim().toLowerCase();
    const kin = family ? kinIds() : null;
    const neighbor = new Set<string>();
    if (selected) {
      const focus = nodes.find((n) => n.id === selected || n.slug === selected);
      if (focus) {
        neighbor.add(focus.id);
        map.edges.forEach((e) => {
          if (e.fromNode === focus.id) neighbor.add(e.toNode);
          if (e.toNode === focus.id) neighbor.add(e.fromNode);
        });
      }
    }
    nodes.forEach((n) => {
      const el = plates.get(n.id);
      if (!el) return;
      el.style.left = `${n.x}px`;
      el.style.top = `${n.y}px`;
      const visual = Math.max(0.84, Math.min(1.16, 0.92 + 0.12 * scale));
      el.style.transform = `scale(${visual / scale})`;
      el.style.transformOrigin = 'center center';
      const lit = n.id === selected || n.slug === selected;
      el.classList.toggle('is-lit', lit);
      if (lit) el.setAttribute('data-lit', '');
      else el.removeAttribute('data-lit');
      let dim = false;
      if (q && !n.text.toLowerCase().includes(q) && !lit) dim = true;
      if (selected && !family && !neighbor.has(n.id) && !lit) dim = true;
      if (kin && !kin.has(n.id) && !lit) dim = true;
      el.classList.toggle('is-dim', dim);
    });
    applyStage();
    drawEdges();
  }

  function refreshDock() {
    const n = nodes.find((x) => x.id === selected || x.slug === selected);
    if (familyBtn) {
      if (n && !n.faction) {
        familyBtn.disabled = false;
        familyBtn.textContent = family ? 'All relations' : `Family of ${firstName(n.text)}`;
        familyBtn.setAttribute('aria-pressed', family ? 'true' : 'false');
      } else {
        familyBtn.disabled = true;
        familyBtn.textContent = 'Family';
        familyBtn.setAttribute('aria-pressed', 'false');
        family = false;
      }
    }
    if (!n || !focusBox || !focusName || !sheetLink) {
      if (focusBox) focusBox.hidden = true;
      return;
    }
    focusBox.hidden = false;
    focusName.textContent = n.text;
    if (n.slug) {
      sheetLink.hidden = false;
      sheetLink.href = `/characters/${encodeURIComponent(n.slug)}/`;
    } else {
      sheetLink.hidden = true;
      sheetLink.removeAttribute('href');
    }
  }

  function cameraForFit(): { panX: number; panY: number; scale: number } {
    let minX = -ROSE_R;
    let minY = -ROSE_R;
    let maxX = ROSE_R;
    let maxY = ROSE_R;
    lastHubs.forEach((h) => {
      minX = Math.min(minX, h.x - 48);
      minY = Math.min(minY, h.y - 48);
      maxX = Math.max(maxX, h.x + 48);
      maxY = Math.max(maxY, h.y + 48);
    });
    nodes.forEach((n) => {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + PLATE_W);
      maxY = Math.max(maxY, n.y + PLATE_H);
    });
    const bw = maxX - minX || 400;
    const bh = maxY - minY || 300;
    const vw = mount.clientWidth || 800;
    const vh = mount.clientHeight || 520;
    const pad = 64;
    const nextScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.min((vw - pad) / bw, (vh - pad) / bh)));
    return {
      scale: nextScale,
      panX: (vw - bw * nextScale) / 2 - minX * nextScale,
      panY: (vh - bh * nextScale) / 2 - minY * nextScale,
    };
  }

  function stopAnim() {
    if (anim) cancelAnimationFrame(anim);
    anim = 0;
  }

  function layout(animated: boolean, refit = false) {
    applyHomes();
    const from = nodes.map((n) => ({ x: n.x, y: n.y }));
    const panFrom = { panX, panY, scale };
    settle(nodes, 48);
    const to = nodes.map((n) => ({ x: n.x, y: n.y }));
    const panTo = refit ? cameraForFit() : panFrom;
    if (!animated || reduced) {
      nodes.forEach((n, i) => {
        n.x = to[i]!.x;
        n.y = to[i]!.y;
      });
      if (refit) {
        panX = panTo.panX;
        panY = panTo.panY;
        scale = panTo.scale;
      }
      paintPlates();
      return;
    }
    nodes.forEach((n, i) => {
      n.x = from[i]!.x;
      n.y = from[i]!.y;
    });
    stopAnim();
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / LAYOUT_MS);
      const e = easeSmooth(t);
      nodes.forEach((n, i) => {
        n.x = from[i]!.x + (to[i]!.x - from[i]!.x) * e;
        n.y = from[i]!.y + (to[i]!.y - from[i]!.y) * e;
      });
      panX = panFrom.panX + (panTo.panX - panFrom.panX) * e;
      panY = panFrom.panY + (panTo.panY - panFrom.panY) * e;
      scale = panFrom.scale + (panTo.scale - panFrom.scale) * e;
      paintPlates();
      if (t < 1) anim = requestAnimationFrame(tick);
      else anim = 0;
    };
    anim = requestAnimationFrame(tick);
  }

  function select(id: string) {
    selected = id;
    const url = new URL(location.href);
    const n = nodes.find((x) => x.id === id || x.slug === id);
    if (n?.slug) url.searchParams.set('person', n.slug);
    else url.searchParams.delete('person');
    history.replaceState({}, '', url.pathname + url.search);
    refreshDock();
    if (family) layout(true);
    else paintPlates();
  }

  function clearFocus() {
    if (!selected && !family) return;
    const wasFamily = family;
    selected = '';
    family = false;
    const url = new URL(location.href);
    url.searchParams.delete('person');
    history.replaceState({}, '', url.pathname + url.search);
    refreshDock();
    if (wasFamily) layout(true);
    else paintPlates();
  }

  function zoomBy(factor: number, mx: number, my: number) {
    const wx = (mx - panX) / scale;
    const wy = (my - panY) / scale;
    scale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, scale * factor));
    panX = mx - wx * scale;
    panY = my - wy * scale;
    applyStage();
  }

  familyBtn?.addEventListener('click', () => {
    if (familyBtn.disabled) return;
    toggleFamily();
  });

  function setSlideOpen(id: string, open: boolean) {
    document.querySelectorAll('.kod-rail [data-slide]').forEach((el) => {
      const mine = el.getAttribute('data-slide') === id && open;
      el.setAttribute('data-open', mine ? 'true' : 'false');
    });
    document.querySelectorAll('[data-slide-toggle]').forEach((btn) => {
      const mine = btn.getAttribute('data-slide-toggle') === id && open;
      btn.setAttribute('aria-expanded', mine ? 'true' : 'false');
    });
  }

  document.querySelectorAll('[data-slide-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-slide-toggle') || '';
      const slide = document.querySelector(`.kod-rail [data-slide="${CSS.escape(id)}"]`);
      const open = !(slide && slide.getAttribute('data-open') === 'true');
      setSlideOpen(id, open);
      if (open && id === 'find' && findInput) findInput.focus();
    });
  });

  function applyCategory(id: string) {
    catId = id;
    document.querySelectorAll('[data-view-group]').forEach((btn) => {
      const on = Boolean(id) && btn.getAttribute('data-view-group') === id;
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      const list = btn.parentElement?.querySelector('[data-faction-list]') as HTMLElement | null;
      if (list) list.hidden = !on;
    });
  }
  applyCategory(catId);
  document.querySelectorAll('[data-view-group]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const gid = btn.getAttribute('data-view-group') || '';
      applyCategory(catId === gid ? '' : gid);
      nodes.forEach((n) => {
        n.fx = undefined;
        n.fy = undefined;
      });
      layout(true, true);
    });
  });
  findInput?.addEventListener('input', () => {
    query = findInput.value;
    paintPlates();
  });
  findInput?.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter') return;
    const q = query.trim().toLowerCase();
    const hit = nodes.find((n) => n.text.toLowerCase().includes(q));
    if (hit) select(hit.slug || hit.id);
  });

  let fieldMoved = false;
  mount.addEventListener('pointerdown', (ev) => {
    if ((ev.target as HTMLElement).closest('.cmap-plate')) return;
    draggingField = true;
    fieldMoved = false;
    lastX = ev.clientX;
    lastY = ev.clientY;
    mount.setPointerCapture(ev.pointerId);
  });
  mount.addEventListener('pointermove', (ev) => {
    if (draggingPlate) {
      const dx = (ev.clientX - lastX) / scale;
      const dy = (ev.clientY - lastY) / scale;
      lastX = ev.clientX;
      lastY = ev.clientY;
      draggingPlate.x += dx;
      draggingPlate.y += dy;
      clampPlate(draggingPlate);
      draggingPlate.fx = draggingPlate.x;
      draggingPlate.fy = draggingPlate.y;
      draggingPlate.homeX = draggingPlate.x;
      draggingPlate.homeY = draggingPlate.y;
      paintPlates();
      return;
    }
    if (!draggingField) return;
    const mx = ev.clientX - lastX;
    const my = ev.clientY - lastY;
    if (Math.hypot(mx, my) > 6) fieldMoved = true;
    panX += mx;
    panY += my;
    lastX = ev.clientX;
    lastY = ev.clientY;
    applyStage();
  });
  mount.addEventListener('pointerup', () => {
    if (draggingPlate) {
      clampPlate(draggingPlate);
      draggingPlate.fx = draggingPlate.x;
      draggingPlate.fy = draggingPlate.y;
      draggingPlate = null;
      settle(nodes, 16);
      paintPlates();
    } else if (draggingField && !fieldMoved) {
      clearFocus();
    }
    draggingField = false;
  });
  mount.addEventListener(
    'wheel',
    (ev) => {
      ev.preventDefault();
      const rect = mount.getBoundingClientRect();
      zoomBy(ev.deltaY > 0 ? 0.92 : 1.08, ev.clientX - rect.left, ev.clientY - rect.top);
    },
    { passive: false },
  );
  document.addEventListener('keydown', (ev) => {
    const t = ev.target as HTMLElement | null;
    const typing =
      t &&
      (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
    if (typing) return;
    if (ev.key === '+' || ev.key === '=' || ev.key === 'Add') {
      ev.preventDefault();
      zoomBy(1.12, (mount.clientWidth || 800) / 2, (mount.clientHeight || 520) / 2);
    } else if (ev.key === '-' || ev.key === '_' || ev.key === 'Subtract') {
      ev.preventDefault();
      zoomBy(0.89, (mount.clientWidth || 800) / 2, (mount.clientHeight || 520) / 2);
    } else if (ev.key === 'Escape') {
      clearFocus();
    }
  });

  layout(false);
  fitView();
  paintPlates();
  refreshDock();
  if (selected) select(selected);
}

export { isKinEdge };
