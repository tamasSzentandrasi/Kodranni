import { describe, expect, it } from 'vitest';
import { notifySystemd } from '../src/linux-notify.js';

describe('notifySystemd', () => {
  it('is a no-op without NOTIFY_SOCKET', () => {
    const prev = process.env.NOTIFY_SOCKET;
    delete process.env.NOTIFY_SOCKET;
    expect(() => notifySystemd('READY=1')).not.toThrow();
    if (prev !== undefined) process.env.NOTIFY_SOCKET = prev;
  });
});
