import { describe, expect, it } from 'vitest';
import { defaultEchoEffects, makeEcho, normalizeEcho } from '../src/echo-effects.js';

describe('echo effects inventory', () => {
  it('pivotal weight includes Fortune and Myth resolve chips', () => {
    const fx = defaultEchoEffects(3);
    expect(fx.some((e) => e.kind === 'invoke_second_exertion')).toBe(true);
    expect(fx.some((e) => e.kind === 'pivotal_fortune')).toBe(true);
    expect(fx.some((e) => e.kind === 'pivotal_myth')).toBe(true);
  });

  it('individual dies with bearer; no pivotal fortune', () => {
    const fx = defaultEchoEffects(1);
    expect(fx.some((e) => e.kind === 'dies_with_bearer')).toBe(true);
    expect(fx.some((e) => e.kind === 'pivotal_fortune')).toBe(false);
  });

  it('normalizeEcho fills defaults when effects missing', () => {
    const e = normalizeEcho({ title: 'Test', weight: 2 });
    expect(e.effects.length).toBeGreaterThan(0);
    expect(e.weight).toBe(2);
  });

  it('makeEcho composes title weight note and effects', () => {
    const e = makeEcho('Hold the ford', 3, 'note');
    expect(e.title).toBe('Hold the ford');
    expect(e.note).toBe('note');
    expect(e.effects.some((x) => x.kind === 'weight_pivotal')).toBe(true);
  });
});
