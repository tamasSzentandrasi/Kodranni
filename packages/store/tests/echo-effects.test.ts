import { describe, expect, it } from 'vitest';
import {
  activeEchoes,
  defaultEchoEffects,
  makeEcho,
  normalizeEcho,
} from '../src/echo-effects.js';

describe('echo effects inventory', () => {
  it('pivotal weight includes Fortune and Myth resolve chips', () => {
    const fx = defaultEchoEffects(3);
    expect(fx.some((e) => e.kind === 'invoke_second_exertion')).toBe(true);
    expect(fx.some((e) => e.kind === 'pivotal_fortune')).toBe(true);
  });

  it('makeEcho requires invokeWhen and preserves group', () => {
    const e = makeEcho({
      title: 'Hold the ford',
      weight: 3,
      invokeWhen: 'When the ford is contested.',
      group: [{ name: 'Sten' }],
    });
    expect(e.invokeWhen).toContain('ford');
    expect(e.group?.[0]?.name).toBe('Sten');
  });

  it('normalizeEcho fills invokeWhen from note or title', () => {
    const e = normalizeEcho({ title: 'Test vow', weight: 2, note: 'When grain is at stake.' });
    expect(e.invokeWhen).toBe('When grain is at stake.');
  });

  it('activeEchoes skips resolved', () => {
    const a = makeEcho({ title: 'A', weight: 2, invokeWhen: 'x' });
    const b = makeEcho({
      title: 'B',
      weight: 3,
      invokeWhen: 'y',
      resolved: { narrative: 'Done.' },
    });
    expect(activeEchoes([a, b])).toHaveLength(1);
  });
});
