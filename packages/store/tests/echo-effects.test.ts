import { describe, expect, it } from 'vitest';
import { defaultEchoEffects, makeEcho, normalizeEcho } from '../src/echo-effects.js';

describe('echo effects inventory', () => {
  it('pivotal weight includes Fortune and Myth resolve chips', () => {
    const fx = defaultEchoEffects(3);
    expect(fx.some((e) => e.kind === 'invoke_second_exertion')).toBe(true);
    expect(fx.some((e) => e.kind === 'load_cost')).toBe(true);
    expect(fx.some((e) => e.kind === 'pivotal_fortune')).toBe(true);
    expect(fx.some((e) => e.kind === 'pivotal_myth')).toBe(true);
    expect(fx.every((e) => e.phase)).toBe(true);
  });

  it('individual dies with bearer; no pivotal fortune', () => {
    const fx = defaultEchoEffects(1);
    expect(fx.some((e) => e.kind === 'dies_with_bearer')).toBe(true);
    expect(fx.some((e) => e.kind === 'on_resolve_personal')).toBe(true);
    expect(fx.some((e) => e.kind === 'pivotal_fortune')).toBe(false);
  });

  it('group has on_resolve_group and legacy, not fortune shift', () => {
    const fx = defaultEchoEffects(2);
    expect(fx.some((e) => e.kind === 'on_resolve_group')).toBe(true);
    expect(fx.some((e) => e.kind === 'persist_legacy')).toBe(true);
    expect(fx.some((e) => e.kind === 'pivotal_fortune')).toBe(false);
  });

  it('normalizeEcho fills defaults when effects missing', () => {
    const e = normalizeEcho({ title: 'Test', weight: 2 });
    expect(e.effects.length).toBeGreaterThan(0);
    expect(e.weight).toBe(2);
  });

  it('normalizeEcho rebuilds legacy weight_* chips', () => {
    const e = normalizeEcho({
      title: 'Old',
      weight: 3,
      effects: [
        { kind: 'weight_pivotal', label: 'old' },
        { kind: 'custom', label: 'ST note' },
      ],
    });
    expect(e.effects.some((x) => x.kind === 'weight_pivotal')).toBe(false);
    expect(e.effects.some((x) => x.kind === 'pivotal_fortune')).toBe(true);
    expect(e.effects.some((x) => x.kind === 'custom' && x.label === 'ST note')).toBe(true);
  });

  it('makeEcho composes title weight note and effects', () => {
    const e = makeEcho('Hold the ford', 3, 'note');
    expect(e.title).toBe('Hold the ford');
    expect(e.note).toBe('note');
    expect(e.effects.some((x) => x.kind === 'load_cost')).toBe(true);
  });
});
