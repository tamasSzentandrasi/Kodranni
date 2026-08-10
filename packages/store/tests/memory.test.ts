import { describe, expect, it } from 'vitest';
import { createMemoryStore } from '../src/index.js';

describe('memory store', () => {
  it('appends events and is idempotent on clientEventId', () => {
    const store = createMemoryStore({ slug: 'ash-hill', name: 'Ash-Hill' });
    const a = store.append({
      type: 'RollResolved',
      clientEventId: 'c1',
      payload: { marks: 2 },
    });
    const b = store.append({
      type: 'RollResolved',
      clientEventId: 'c1',
      payload: { marks: 9 },
    });
    expect(a.id).toBe(b.id);
    expect(store.get().events).toHaveLength(1);
    expect(store.hasClientEvent('c1')).toBe(true);
  });
});
