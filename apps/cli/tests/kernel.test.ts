import { describe, expect, it } from 'vitest';
import { parseBind } from '../src/kernel.js';

describe('parseBind', () => {
  it('splits host:port', () => {
    expect(parseBind('127.0.0.1:8742')).toEqual({ host: '127.0.0.1', port: 8742 });
  });

  it('forces loopback when bind is all-interfaces', () => {
    expect(parseBind('0.0.0.0:9000')).toEqual({ host: '127.0.0.1', port: 9000 });
  });
});
