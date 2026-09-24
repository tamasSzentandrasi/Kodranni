import { describe, expect, it } from 'vitest';
import {
  ASPALATH_RELATION_MAP,
  edgeCurvature,
  isKinEdge,
  parseRelationMap,
  relationMapViolations,
} from '../src/relation-map.js';

describe('relation map', () => {
  it('parses the Aspalath canvas', () => {
    const map = parseRelationMap(ASPALATH_RELATION_MAP);
    expect(map?.nodes.some((n) => n.slug === 'marino')).toBe(true);
    expect(map?.edges.some((e) => e.label === 'sister')).toBe(true);
    expect(map?.edges.some((e) => e.label === 'upholds his rule as regent')).toBe(true);
    expect(map?.edges.some((e) => e.label === 'handmaiden of')).toBe(true);
    expect(map?.nodes.some((n) => n.faction && n.text === 'Pelesa')).toBe(true);
  });

  it('flags unknown slugs', () => {
    const v = relationMapViolations(ASPALATH_RELATION_MAP, [{ slug: 'marino' }]);
    expect(v.some((e) => e.includes('tomaso'))).toBe(true);
    expect(v.some((e) => e.includes('unknown slug marino'))).toBe(false);
  });

  it('offsets two ties between the same people', () => {
    const twins = ASPALATH_RELATION_MAP.edges.filter(
      (e) =>
        (e.fromNode === 'vito' && e.toNode === 'paolo') ||
        (e.fromNode === 'paolo' && e.toNode === 'vito'),
    );
    expect(twins.length).toBeGreaterThanOrEqual(2);
    const c0 = edgeCurvature(ASPALATH_RELATION_MAP.edges, twins[0]!);
    const c1 = edgeCurvature(ASPALATH_RELATION_MAP.edges, twins[1]!);
    expect(c0).not.toBe(c1);
  });

  it('treats sister as kin', () => {
    const e = ASPALATH_RELATION_MAP.edges.find((x) => x.label === 'sister')!;
    expect(isKinEdge(e)).toBe(true);
    const hunt = ASPALATH_RELATION_MAP.edges.find((x) => x.label === 'leads the hunt for conspirators')!;
    expect(isKinEdge(hunt)).toBe(false);
  });
});
