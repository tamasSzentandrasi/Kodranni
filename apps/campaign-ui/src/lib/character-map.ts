import {
  edgeCurvature,
  isDirectedEdge,
  isKinEdge,
  kinNeighborhood,
} from '@kodranni/store/relation-map';
import type { RelationMap, RelationMapEdge, RelationMapNode } from '@kodranni/store/types';

type GraphFactory = {
  new (el: HTMLElement, cfg?: Record<string, unknown>): GraphApi;
  (cfg?: Record<string, unknown>): (el: HTMLElement) => GraphApi;
};

// 3d-force-graph chain; kept loose so CJS/ESM builds both type-check.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GraphApi = any;

type GNode = RelationMapNode & { id: string; x?: number; y?: number; z?: number };
type GLink = RelationMapEdge & {
  source: string | GNode;
  target: string | GNode;
  curvature: number;
  directed: boolean;
};

let providedGraph: GraphFactory | null = null;
let liveGraph: GraphApi | null = null;

/** Archive / live IIFE injects 3d-force-graph so the page does not wait on Vite. */
export function provideForceGraph3D(mod: unknown): void {
  const rec = mod as { default?: GraphFactory };
  providedGraph = rec.default ?? (mod as GraphFactory);
}

function firstName(text: string): string {
  return text.trim().split(/\s+/)[0] ?? text;
}

function plateEl(node: GNode): HTMLElement {
  const el = document.createElement(node.slug ? 'button' : 'span');
  if (node.slug) (el as HTMLButtonElement).type = 'button';
  el.className = 'member cmap-plate';
  if (node.slug) el.classList.add('cmap-plate--sheet');
  else el.classList.add('cmap-plate--bare');
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

function seedCloud(count: number, i: number): { x: number; y: number; z: number } {
  if (count <= 1) return { x: 0, y: 0, z: 0 };
  const y = 1 - (i / (count - 1)) * 2;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = Math.PI * (3 - Math.sqrt(5)) * i;
  const s = 78;
  return { x: r * Math.cos(theta) * s, y: y * s, z: r * Math.sin(theta) * s };
}

/** Drop JSON Canvas x/y so d3-force-3d places people in space, not on a flat page. */
function toGraph(map: RelationMap): { nodes: GNode[]; links: GLink[] } {
  const nodes = map.nodes.map((n, i) => {
    const seed = seedCloud(map.nodes.length, i);
    const node: GNode = {
      id: n.id,
      type: n.type,
      text: n.text,
      width: n.width,
      height: n.height,
      color: n.color,
      slug: n.slug,
      faction: n.faction,
      x: n.x * 0.14,
      y: -n.y * 0.14,
      z: seed.z * 0.85,
    };
    return node;
  });
  const links: GLink[] = map.edges.map((e) => ({
    ...e,
    source: e.fromNode,
    target: e.toNode,
    curvature: edgeCurvature(map.edges, e),
    directed: isDirectedEdge(e),
  }));
  return { nodes, links };
}

function nodeId(ref: string | GNode): string {
  return typeof ref === 'object' ? ref.id : String(ref);
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

async function loadForceGraph(): Promise<GraphFactory | null> {
  if (providedGraph) return providedGraph;
  try {
    const mod = await import('3d-force-graph');
    const rec = mod as { default?: GraphFactory };
    return rec.default ?? (mod as GraphFactory);
  } catch (err) {
    console.error('[kodranni] 3D map library failed to load', err);
    return null;
  }
}

function waitForSize(el: HTMLElement): Promise<void> {
  if (el.clientWidth >= 64 && el.clientHeight >= 64) return Promise.resolve();
  el.style.minHeight = el.style.minHeight || '28rem';
  return new Promise((resolve) => {
    const done = () => {
      ro.disconnect();
      resolve();
    };
    const ro = new ResizeObserver(() => {
      if (el.clientWidth >= 64 && el.clientHeight >= 64) done();
    });
    ro.observe(el);
    requestAnimationFrame(() => {
      if (el.clientWidth >= 64 && el.clientHeight >= 64) done();
    });
    setTimeout(done, 1500);
  });
}

function probeWebGL(mount: HTMLElement): { canvas: HTMLCanvasElement; gl: WebGL2RenderingContext } | null {
  const canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  mount.appendChild(canvas);
  const gl = canvas.getContext('webgl2');
  if (gl) return { canvas, gl };
  canvas.remove();
  return null;
}

export function bootMap(): void {
  void bootMapAsync();
}

async function bootMapAsync(): Promise<void> {
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

  await waitForSize(mount);

  const fg = await loadForceGraph();
  const surface = probeWebGL(mount);
  if (fg && surface) {
    try {
      bootMap3d(root, mount, map, fg, surface);
      return;
    } catch (err) {
      console.warn('[kodranni] WebGL map failed, using CSS 3D', err);
      surface.canvas.remove();
    }
  } else {
    surface?.canvas.remove();
  }

  try {
    bootMapCss3d(root, mount, map);
  } catch (err) {
    console.error('[kodranni] character map failed', err);
    showFail(root, err);
  }
}

function makeGraph(
  mount: HTMLElement,
  FG: GraphFactory,
  surface: { canvas: HTMLCanvasElement; gl: WebGL2RenderingContext },
) {
  const graph = new FG(mount, {
    controlType: 'orbit',
    rendererConfig: {
      canvas: surface.canvas,
      context: surface.gl,
      antialias: false,
      alpha: true,
    },
  });
  graph.renderer?.()?.setPixelRatio?.(1);
  liveGraph = graph;
  window.addEventListener(
    'pagehide',
    () => {
      try {
        graph._destructor?.();
      } catch {
        /* ignore */
      }
      if (liveGraph === graph) liveGraph = null;
    },
    { once: true },
  );
  return graph;
}

function bootMap3d(
  root: HTMLElement,
  mount: HTMLElement,
  map: RelationMap,
  fg: GraphFactory,
  surface: { canvas: HTMLCanvasElement; gl: WebGL2RenderingContext },
): void {
  const findInput = root.querySelector('[data-cmap-find]') as HTMLInputElement | null;
  const familyBtn = root.querySelector('[data-cmap-family]') as HTMLButtonElement | null;
  const focusBox = root.querySelector('[data-cmap-focus]') as HTMLElement | null;
  const focusName = root.querySelector('[data-cmap-focus-name]') as HTMLElement | null;
  const sheetLink = root.querySelector('[data-cmap-sheet]') as HTMLAnchorElement | null;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let selected = root.getAttribute('data-person') || '';
  let family = false;
  let query = '';
  let painted = false;

  const Graph = makeGraph(mount, fg, surface) as GraphApi;
  const hud = document.createElement('div');
  hud.className = 'kod-cmap__hud';
  mount.appendChild(hud);
  const plateLayer = document.createElement('div');
  plateLayer.className = 'kod-cmap__hud-plates';
  const labelLayer = document.createElement('div');
  labelLayer.className = 'kod-cmap__hud-labels';
  hud.appendChild(labelLayer);
  hud.appendChild(plateLayer);
  const plates = new Map<string, HTMLElement>();
  const labels = new Map<string, HTMLElement>();

  Graph.backgroundColor('#141210')
    .showNavInfo(false)
    .nodeId('id')
    .nodeLabel(() => '')
    .nodeOpacity(0.75)
    .nodeRelSize(5.5)
    .nodeColor((n: GNode) => n.color || '#c4bfb6')
    .linkSource('source')
    .linkTarget('target')
    .linkColor((l: GLink) => l.color || '#8a8580')
    .linkWidth((l: GLink) => (isHotLink(l) ? 1.6 : 0.85))
    .linkOpacity(0.92)
    .linkCurvature((l: GLink) => l.curvature || 0)
    .linkDirectionalArrowLength((l: GLink) => (l.directed ? 3.6 : 0))
    .linkDirectionalArrowRelPos(0.88)
    .linkDirectionalArrowColor((l: GLink) => l.color || '#8a8580')
    .d3VelocityDecay(0.4)
    .cooldownTicks(reduced ? 0 : 110)
    .warmupTicks(reduced ? 80 : 20)
    .enableNodeDrag(true)
    .numDimensions(3)
    .onNodeClick((node: GNode) => select(node.slug || node.id));

  const w = mount.clientWidth || 800;
  const h = mount.clientHeight || 520;
  Graph.width(w).height(h);
  const charge = Graph.d3Force('charge') as { strength?: (n: number) => unknown } | undefined;
  charge?.strength?.(-260);
  const linkF = Graph.d3Force('link') as { distance?: (n: number) => unknown } | undefined;
  linkF?.distance?.(90);

  function isHotLink(l: GLink): boolean {
    if (!selected) return false;
    const s = nodeId(l.source);
    const t = nodeId(l.target);
    const a = map.nodes.find((n) => n.id === s);
    const b = map.nodes.find((n) => n.id === t);
    return a?.id === selected || a?.slug === selected || b?.id === selected || b?.slug === selected;
  }

  function currentData(): RelationMap {
    if (!family || !selected) return map;
    return kinNeighborhood(map, selected);
  }

  function rebuildHud(data: RelationMap) {
    plateLayer.replaceChildren();
    labelLayer.replaceChildren();
    plates.clear();
    labels.clear();
    data.nodes.forEach((n) => {
      const el = plateEl(n);
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        select(n.slug || n.id);
      });
      plates.set(n.id, el);
      plateLayer.appendChild(el);
    });
    data.edges.forEach((e) => {
      if (!e.label) return;
      const lab = document.createElement('span');
      lab.className = 'kod-cmap__hud-lab';
      lab.textContent = e.label;
      lab.style.color = e.color || '#c4bfb6';
      labels.set(e.id, lab);
      labelLayer.appendChild(lab);
    });
  }

  function paintPlates() {
    const q = query.trim().toLowerCase();
    const data = currentData();
    const neighbor = new Set<string>();
    if (selected) {
      const focus = data.nodes.find((n) => n.id === selected || n.slug === selected);
      if (focus) {
        neighbor.add(focus.id);
        data.edges.forEach((e) => {
          if (e.fromNode === focus.id) neighbor.add(e.toNode);
          if (e.toNode === focus.id) neighbor.add(e.fromNode);
        });
      }
    }
    plates.forEach((el, id) => {
      const n = data.nodes.find((x) => x.id === id);
      const slug = el.dataset.slug;
      const lit = id === selected || slug === selected;
      el.classList.toggle('is-lit', lit);
      if (lit) el.setAttribute('data-lit', '');
      else el.removeAttribute('data-lit');
      let dim = false;
      if (q && n && !n.text.toLowerCase().includes(q) && !lit) dim = true;
      if (selected && !neighbor.has(id) && !lit) dim = true;
      el.classList.toggle('is-dim', dim);
    });
  }

  function syncHud() {
    const g = Graph.graphData() as { nodes: (GNode & { __threeObj?: { position: { x: number; y: number; z: number } } })[]; links: GLink[] };
    const cam = Graph.camera?.();
    g.nodes.forEach((n) => {
      const el = plates.get(n.id);
      const p = n.__threeObj?.position;
      const x = p?.x ?? n.x;
      const y = p?.y ?? n.y;
      const z = p?.z ?? n.z;
      if (!el || x == null || y == null || z == null) return;
      const c = Graph.graph2ScreenCoords(x, y, z);
      el.style.transform = `translate(${c.x}px, ${c.y}px) translate(-50%, -50%)`;
      if (cam?.position) {
        const dist = Math.hypot(cam.position.x - x, cam.position.y - y, cam.position.z - z);
        el.style.scale = String(Math.max(0.62, Math.min(1.15, 140 / Math.max(50, dist))));
      }
    });
    g.links.forEach((l) => {
      const el = labels.get(l.id);
      if (!el) return;
      const s = l.source as GNode;
      const t = l.target as GNode;
      if (s.x == null || t.x == null) return;
      const a = Graph.graph2ScreenCoords(s.x, s.y!, s.z!);
      const b = Graph.graph2ScreenCoords(t.x, t.y!, t.z!);
      el.style.transform = `translate(${(a.x + b.x) / 2}px, ${(a.y + b.y) / 2}px) translate(-50%, -50%)`;
      el.classList.toggle('is-dim', selected ? !isHotLink(l) : false);
    });
  }

  function refreshDock() {
    const n = map.nodes.find((x) => x.id === selected || x.slug === selected);
    if (familyBtn) {
      if (n && !n.faction) {
        familyBtn.disabled = false;
        familyBtn.textContent = family ? 'All relations' : `Family of ${firstName(n.text)}`;
      } else {
        familyBtn.disabled = true;
        familyBtn.textContent = 'Family';
        family = false;
      }
    }
    if (!n || !focusBox || !focusName || !sheetLink) return;
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

  function applyGraph() {
    const data = currentData();
    rebuildHud(data);
    Graph.graphData(toGraph(data));
    requestAnimationFrame(() => {
      paintPlates();
      syncHud();
    });
  }

  function flyTo(id: string) {
    const nodes = Graph.graphData().nodes as GNode[];
    const n = nodes.find((x) => x.id === id || x.slug === id);
    if (!n || n.x == null) return;
    const dist = 220;
    const ms = reduced ? 0 : 900;
    Graph.cameraPosition({ x: n.x + 40, y: n.y! + 36, z: n.z! + dist }, n, ms);
  }

  function select(id: string) {
    selected = id;
    const url = new URL(location.href);
    const n = map.nodes.find((x) => x.id === id || x.slug === id);
    if (n?.slug) url.searchParams.set('person', n.slug);
    else url.searchParams.delete('person');
    history.replaceState({}, '', url.pathname + url.search);
    refreshDock();
    if (family) applyGraph();
    else paintPlates();
    requestAnimationFrame(() => flyTo(id));
  }

  familyBtn?.addEventListener('click', () => {
    if (familyBtn.disabled) return;
    family = !family;
    refreshDock();
    applyGraph();
    if (selected) requestAnimationFrame(() => flyTo(selected));
  });
  findInput?.addEventListener('input', () => {
    query = findInput.value;
    paintPlates();
  });

  function reveal() {
    if (painted) return;
    painted = true;
    paintPlates();
    hideWait(root);
  }

  Graph.onEngineTick(() => {
    paintPlates();
    syncHud();
  });
  Graph.controls()?.addEventListener?.('change', syncHud);
  (function followCamera() {
    syncHud();
    requestAnimationFrame(followCamera);
  })();

  let fitted = false;
  function fitView() {
    if (selected) {
      flyTo(selected);
      return;
    }
    const nodes = Graph.graphData().nodes as GNode[];
    let cx = 0;
    let cy = 0;
    let cz = 0;
    let maxR = 80;
    nodes.forEach((n) => {
      cx += n.x || 0;
      cy += n.y || 0;
      cz += n.z || 0;
    });
    const n = nodes.length || 1;
    cx /= n;
    cy /= n;
    cz /= n;
    nodes.forEach((node) => {
      maxR = Math.max(
        maxR,
        Math.hypot((node.x || 0) - cx, (node.y || 0) - cy, (node.z || 0) - cz),
      );
    });
    const dist = maxR * 2.8 + 70;
    Graph.cameraPosition(
      { x: cx + dist * 0.85, y: cy + dist * 0.55, z: cz + dist * 0.85 },
      { x: cx, y: cy, z: cz },
      reduced ? 0 : 500,
    );
    requestAnimationFrame(syncHud);
  }

  Graph.onEngineStop(() => {
    paintPlates();
    if (!fitted) {
      fitted = true;
      fitView();
    }
    reveal();
  });

  applyGraph();
  refreshDock();
  setTimeout(() => {
    if (!fitted) {
      fitted = true;
      fitView();
    }
    reveal();
  }, reduced ? 200 : 1800);

  const ro = new ResizeObserver(() => {
    Graph.width(mount.clientWidth || 800).height(mount.clientHeight || 520);
  });
  ro.observe(mount);
}

/** Perspective 3D scene when the browser will not give WebGL2 (Brave Shields, etc.). */
function bootMapCss3d(root: HTMLElement, mount: HTMLElement, map: RelationMap): void {
  const findInput = root.querySelector('[data-cmap-find]') as HTMLInputElement | null;
  const familyBtn = root.querySelector('[data-cmap-family]') as HTMLButtonElement | null;
  const focusBox = root.querySelector('[data-cmap-focus]') as HTMLElement | null;
  const focusName = root.querySelector('[data-cmap-focus-name]') as HTMLElement | null;
  const sheetLink = root.querySelector('[data-cmap-sheet]') as HTMLAnchorElement | null;

  let selected = root.getAttribute('data-person') || '';
  let family = false;
  let query = '';
  let rotY = 0.62;
  let rotX = 0.38;
  let scale = 1;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  const scene = document.createElement('div');
  scene.className = 'kod-cmap__css3d';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'kod-cmap__css3d-edges');
  const world = document.createElement('div');
  world.className = 'kod-cmap__css3d-world';
  scene.appendChild(svg);
  scene.appendChild(world);
  mount.appendChild(scene);

  const plates = new Map<string, HTMLElement>();
  const pos = new Map<string, { x: number; y: number; z: number }>();

  function currentData(): RelationMap {
    if (!family || !selected) return map;
    return kinNeighborhood(map, selected);
  }

  function refreshDock() {
    const n = map.nodes.find((x) => x.id === selected || x.slug === selected);
    if (familyBtn) {
      if (n && !n.faction) {
        familyBtn.disabled = false;
        familyBtn.textContent = family ? 'All relations' : `Family of ${firstName(n.text)}`;
      } else {
        familyBtn.disabled = true;
        familyBtn.textContent = 'Family';
        family = false;
      }
    }
    if (!n || !focusBox || !focusName || !sheetLink) return;
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

  function select(id: string) {
    selected = id;
    const url = new URL(location.href);
    const n = map.nodes.find((x) => x.id === id || x.slug === id);
    if (n?.slug) url.searchParams.set('person', n.slug);
    else url.searchParams.delete('person');
    history.replaceState({}, '', url.pathname + url.search);
    refreshDock();
    if (family) rebuild();
    else paint();
  }

  function applyWorld() {
    world.style.transform = `translate(-50%, -50%) scale(${scale}) rotateX(${rotX}rad) rotateY(${rotY}rad)`;
  }

  function project(): Map<string, { x: number; y: number }> {
    const box = scene.getBoundingClientRect();
    const out = new Map<string, { x: number; y: number }>();
    plates.forEach((el, id) => {
      const r = el.getBoundingClientRect();
      out.set(id, { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top });
    });
    return out;
  }

  function drawEdges() {
    const data = currentData();
    const scr = project();
    const ns = 'http://www.w3.org/2000/svg';
    svg.setAttribute('viewBox', `0 0 ${scene.clientWidth || 800} ${scene.clientHeight || 520}`);
    svg.replaceChildren();
    data.edges.forEach((e) => {
      const a = scr.get(e.fromNode);
      const b = scr.get(e.toNode);
      if (!a || !b) return;
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', String(a.x));
      line.setAttribute('y1', String(a.y));
      line.setAttribute('x2', String(b.x));
      line.setAttribute('y2', String(b.y));
      line.setAttribute('stroke', e.color || '#8a8580');
      line.setAttribute('stroke-width', '1.2');
      svg.appendChild(line);
      if (e.label) {
        const lab = document.createElementNS(ns, 'text');
        lab.setAttribute('x', String((a.x + b.x) / 2));
        lab.setAttribute('y', String((a.y + b.y) / 2 - 6));
        lab.setAttribute('text-anchor', 'middle');
        lab.setAttribute('fill', e.color || '#c4bfb6');
        lab.setAttribute('class', 'kod-cmap__elabel');
        lab.textContent = e.label;
        svg.appendChild(lab);
      }
    });
  }

  function paint() {
    const q = query.trim().toLowerCase();
    const data = currentData();
    const neighbor = new Set<string>();
    if (selected) {
      const focus = data.nodes.find((n) => n.id === selected || n.slug === selected);
      if (focus) {
        neighbor.add(focus.id);
        data.edges.forEach((e) => {
          if (e.fromNode === focus.id) neighbor.add(e.toNode);
          if (e.toNode === focus.id) neighbor.add(e.fromNode);
        });
      }
    }
    plates.forEach((el, id) => {
      const n = data.nodes.find((x) => x.id === id);
      const lit = id === selected || el.dataset.slug === selected;
      el.classList.toggle('is-lit', lit);
      if (lit) el.setAttribute('data-lit', '');
      else el.removeAttribute('data-lit');
      let dim = false;
      if (q && n && !n.text.toLowerCase().includes(q) && !lit) dim = true;
      if (selected && !neighbor.has(id) && !lit) dim = true;
      el.classList.toggle('is-dim', dim);
    });
    applyWorld();
    requestAnimationFrame(drawEdges);
  }

  function rebuild() {
    const data = currentData();
    const seeded = toGraph(data);
    world.replaceChildren();
    plates.clear();
    pos.clear();
    seeded.nodes.forEach((n) => {
      const p = { x: n.x || 0, y: n.y || 0, z: n.z || 0 };
      pos.set(n.id, p);
      const el = plateEl(n);
      el.style.transform = `translate3d(${p.x}px, ${p.y}px, ${p.z}px) translate(-50%, -50%)`;
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        select(n.slug || n.id);
      });
      plates.set(n.id, el);
      world.appendChild(el);
    });
    paint();
    refreshDock();
  }

  scene.addEventListener('pointerdown', (ev) => {
    if ((ev.target as HTMLElement).closest('.cmap-plate')) return;
    dragging = true;
    lastX = ev.clientX;
    lastY = ev.clientY;
    scene.setPointerCapture(ev.pointerId);
  });
  scene.addEventListener('pointermove', (ev) => {
    if (!dragging) return;
    rotY += (ev.clientX - lastX) * 0.008;
    rotX += (ev.clientY - lastY) * 0.008;
    rotX = Math.max(-1.2, Math.min(1.2, rotX));
    lastX = ev.clientX;
    lastY = ev.clientY;
    paint();
  });
  scene.addEventListener('pointerup', () => {
    dragging = false;
  });
  scene.addEventListener(
    'wheel',
    (ev) => {
      ev.preventDefault();
      scale = Math.max(0.45, Math.min(2.4, scale * (ev.deltaY > 0 ? 0.92 : 1.08)));
      paint();
    },
    { passive: false },
  );

  familyBtn?.addEventListener('click', () => {
    if (familyBtn.disabled) return;
    family = !family;
    rebuild();
  });
  findInput?.addEventListener('input', () => {
    query = findInput.value;
    paint();
  });

  rebuild();
  hideWait(root);
}

export { isKinEdge };
