import type { CharacterRecord, RelationMap, RelationMapEdge, RelationMapNode } from './types.js';

const KIN_LABEL: Record<string, RelationMapEdge['kind']> = {
  mother: 'parent',
  father: 'parent',
  parent: 'parent',
  son: 'child',
  daughter: 'child',
  child: 'child',
  sister: 'sibling',
  brother: 'sibling',
  sibling: 'sibling',
  husband: 'spouse',
  wife: 'spouse',
  spouse: 'spouse',
  uncle: 'kin',
  aunt: 'kin',
  kin: 'kin',
};

export function edgeKind(edge: RelationMapEdge): RelationMapEdge['kind'] | undefined {
  if (edge.kind) return edge.kind;
  const key = (edge.label ?? '').trim().toLowerCase();
  return KIN_LABEL[key];
}

export function isKinEdge(edge: RelationMapEdge): boolean {
  return Boolean(edgeKind(edge));
}

const SYMMETRIC = new Set(['friend', 'godfather', 'sister', 'brother', 'sibling', 'husband', 'wife', 'spouse', 'uncle', 'aunt', 'kin', 'parent', 'child', 'mother', 'father', 'son', 'daughter']);

/** Kin and named symmetric ties have no arrow; story hooks do. */
export function isDirectedEdge(edge: RelationMapEdge): boolean {
  if (isKinEdge(edge)) return false;
  const key = (edge.label ?? '').trim().toLowerCase();
  return !SYMMETRIC.has(key);
}

/** Offset parallel ties so two people can share many labelled edges. */
export function edgeCurvature(edges: RelationMapEdge[], edge: RelationMapEdge): number {
  const a = edge.fromNode < edge.toNode ? edge.fromNode : edge.toNode;
  const b = edge.fromNode < edge.toNode ? edge.toNode : edge.fromNode;
  const pack = edges.filter((e) => {
    const x = e.fromNode < e.toNode ? e.fromNode : e.toNode;
    const y = e.fromNode < e.toNode ? e.toNode : e.fromNode;
    return x === a && y === b;
  });
  if (pack.length < 2) return 0;
  const i = pack.findIndex((e) => e.id === edge.id);
  const mid = (pack.length - 1) / 2;
  const slot = i - mid;
  return (slot === 0 ? 0.14 : 0.28 * slot);
}

export function parseRelationMap(raw: unknown): RelationMap | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as { nodes?: unknown; edges?: unknown };
  if (!Array.isArray(o.nodes) || !Array.isArray(o.edges)) return null;
  const nodes: RelationMapNode[] = [];
  for (const n of o.nodes) {
    if (!n || typeof n !== 'object') continue;
    const node = n as Record<string, unknown>;
    if (typeof node.id !== 'string' || typeof node.text !== 'string') continue;
    if (node.type && node.type !== 'text' && node.type !== 'group') continue;
    if (node.type === 'group') continue;
    nodes.push({
      id: node.id,
      type: 'text',
      text: node.text,
      x: Number(node.x) || 0,
      y: Number(node.y) || 0,
      width: Number(node.width) || 220,
      height: Number(node.height) || 48,
      color: typeof node.color === 'string' ? node.color : undefined,
      slug: typeof node.slug === 'string' ? node.slug : undefined,
      faction: node.faction === true,
    });
  }
  const ids = new Set(nodes.map((n) => n.id));
  const edges: RelationMapEdge[] = [];
  for (const e of o.edges) {
    if (!e || typeof e !== 'object') continue;
    const edge = e as Record<string, unknown>;
    if (typeof edge.id !== 'string' || typeof edge.fromNode !== 'string' || typeof edge.toNode !== 'string') {
      continue;
    }
    if (!ids.has(edge.fromNode) || !ids.has(edge.toNode)) continue;
    const kindRaw = typeof edge.kind === 'string' ? edge.kind : undefined;
    const kind = kindRaw && ['parent', 'child', 'spouse', 'sibling', 'kin'].includes(kindRaw)
      ? (kindRaw as RelationMapEdge['kind'])
      : undefined;
    edges.push({
      id: edge.id,
      fromNode: edge.fromNode,
      toNode: edge.toNode,
      label: typeof edge.label === 'string' ? edge.label : undefined,
      color: typeof edge.color === 'string' ? edge.color : undefined,
      kind,
    });
  }
  return { nodes, edges };
}

export function relationMapViolations(
  map: RelationMap,
  characters: { slug: string; status?: string }[],
): string[] {
  const errors: string[] = [];
  const slugs = new Set(characters.filter((c) => c.status !== 'draft').map((c) => c.slug));
  for (const n of map.nodes) {
    if (n.slug && !slugs.has(n.slug)) errors.push(`unknown slug ${n.slug} on node ${n.id}`);
  }
  return errors;
}

function n(
  id: string,
  text: string,
  x: number,
  y: number,
  extra?: Partial<RelationMapNode>,
): RelationMapNode {
  return { id, type: 'text', text, x, y, width: 240, height: 48, ...extra };
}

function e(
  id: string,
  from: string,
  to: string,
  label: string,
  color: string,
  kind?: RelationMapEdge['kind'],
): RelationMapEdge {
  return { id, fromNode: from, toNode: to, label, color, kind };
}

const KIN = '#c4a35a';
const HOUSE = '#c9b48a';
const PELESA = 'hsl(265 42% 58%)';
const CALVARO = 'hsl(28 52% 52%)';
const BLOOD = '#b05050';
const FAITH = '#d4b85a';
const FRIEND = '#7a9a6a';
const DEBT = '#6a5a70';
const SEA = '#8a6a4a';

/** Aspalath demo map — JSON Canvas 1.0 plus slug / kind / faction. */
export const ASPALATH_RELATION_MAP: RelationMap = {
  nodes: [
    n('marino', 'Marino Orvanti', 40, 40, { slug: 'marino' }),
    n('isotta', 'Isotta Solari', 320, 40),
    n('orsa', 'Orsa Solari', 600, 40, { slug: 'orsa' }),
    n('lovro', 'Father Lovro', 320, -140, { slug: 'lovro' }),
    n('caterina', 'Caterina Vela', 320, 220, { slug: 'caterina' }),
    n('mara', 'Mara Vela', 600, 220, { slug: 'mara' }),
    n('vito', 'Vito Cresti', -240, 220, { slug: 'vito' }),
    n('paolo', 'Paolo Cresti', -240, 400, { slug: 'paolo' }),
    n('niccolo', 'Niccolo Calvo', 900, 40, { slug: 'niccolo' }),
    n('piero', 'Piero Calvo', 900, 220, { slug: 'piero' }),
    n('tomaso', 'Tomaso Fero', 600, 400, { slug: 'tomaso' }),
    n('jakov', 'Jakov Bracco', 40, 400, { slug: 'jakov' }),
    n('lazzaro', 'Lazzaro', 320, 400),
    n('agnese', 'Agnese Orsani', -240, 560, { slug: 'agnese' }),
    n('luca', 'Luca Bandi', -240, 720, { slug: 'luca', color: PELESA }),
    n('matteo', 'Matteo Rinaldi', 1180, 220, { slug: 'matteo', color: CALVARO }),
    n('duje', 'Duje', 1180, 400, { slug: 'duje' }),
    n('faction-pelesa', 'Pelesa', -520, 400, { faction: true, color: PELESA }),
    n('faction-calvaro', 'Calvaro', 1460, 220, { faction: true, color: CALVARO }),
  ],
  edges: [
    e('e-orsa-isotta', 'orsa', 'isotta', 'sister', KIN, 'sibling'),
    e('e-caterina-mara', 'caterina', 'mara', 'sister', KIN, 'sibling'),
    e('e-vito-paolo-kin', 'vito', 'paolo', 'brother', KIN, 'sibling'),
    e('e-niccolo-piero', 'niccolo', 'piero', 'uncle', KIN, 'kin'),
    e('e-marino-isotta', 'marino', 'isotta', 'husband', KIN, 'spouse'),
    e('e-marino-vito', 'vito', 'marino', 'upholds his rule as regent', HOUSE),
    e('e-caterina-isotta', 'caterina', 'isotta', 'handmaiden of', HOUSE),
    e('e-luca-jakov', 'luca', 'jakov', 'primary employer of the company', PELESA),
    e('e-matteo-piero', 'matteo', 'piero', 'friend', FRIEND),
    e('e-matteo-duje', 'matteo', 'duje', 'brother’s life', DEBT),
    e('e-vito-paolo-hunt', 'vito', 'paolo', 'leads the hunt for conspirators', BLOOD),
    e('e-lovro-isotta', 'lovro', 'isotta', 'Custodian of her body', FAITH),
    e('e-agnese-vito', 'agnese', 'vito', 'compiled a list of traitors for', BLOOD),
    e('e-tomaso-lazzaro', 'lazzaro', 'tomaso', 'liberated him off Pelesa’s galley', SEA),
    e('e-jakov-lazzaro', 'lazzaro', 'jakov', 'godfather', KIN),
    e('e-luca-pelesa', 'luca', 'faction-pelesa', 'consul of', PELESA),
    e('e-matteo-calvaro', 'matteo', 'faction-calvaro', 'envoy of', CALVARO),
  ],
};

export function kinNeighborhood(map: RelationMap, focusId: string): RelationMap {
  const start = map.nodes.find((n) => n.id === focusId || n.slug === focusId);
  if (!start) return { nodes: [], edges: [] };
  const kin = map.edges.filter(isKinEdge);
  const seen = new Set<string>([start.id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const e of kin) {
      const a = seen.has(e.fromNode);
      const b = seen.has(e.toNode);
      if (a && !b) {
        seen.add(e.toNode);
        grew = true;
      } else if (b && !a) {
        seen.add(e.fromNode);
        grew = true;
      }
    }
  }
  return {
    nodes: map.nodes.filter((n) => seen.has(n.id)),
    edges: kin.filter((e) => seen.has(e.fromNode) && seen.has(e.toNode)),
  };
}

export function fillDemoRelationMap(
  map: RelationMap | undefined,
  communitySlug: string,
): RelationMap | undefined {
  if (map && map.nodes.length) return map;
  if (communitySlug === 'aspalath') return ASPALATH_RELATION_MAP;
  return map;
}

export function characterHasSheet(
  node: RelationMapNode,
  characters: Pick<CharacterRecord, 'slug'>[],
): boolean {
  if (!node.slug) return false;
  return characters.some((c) => c.slug === node.slug);
}
