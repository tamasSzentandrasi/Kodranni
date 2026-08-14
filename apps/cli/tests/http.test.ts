import { describe, expect, it } from 'vitest';
import { processAlive } from '../src/http.js';

describe('processAlive', () => {
  it('returns true for this process', () => {
    expect(processAlive(process.pid)).toBe(true);
  });

  it('returns false for nonsense pid', () => {
    expect(processAlive(999_999_999)).toBe(false);
    expect(processAlive(undefined)).toBe(false);
  });
});
