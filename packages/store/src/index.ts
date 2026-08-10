/**
 * Local community store — SQLite (node:sqlite) authority + memory helper for unit tests.
 */

export type { AuditEvent } from './types.js';
export * from './types.js';
export * from './paths.js';
export * from './campaign-toml.js';
export * from './schema.js';
export * from './sqlite.js';
export * from './seed.js';

// --- lightweight memory store (tests / early adapters) ---

export interface CommunityState {
  schemaVersion: number;
  slug: string;
  name: string;
  fortunes: Record<string, number>;
  events: import('./types.js').AuditEvent[];
}

export interface CommunityStore {
  get(): CommunityState;
  append(
    event: Omit<import('./types.js').AuditEvent, 'id' | 'ts'> & { id?: string; ts?: string },
  ): import('./types.js').AuditEvent;
  hasClientEvent(clientEventId: string): boolean;
}

let seq = 0;

export function createMemoryStore(seed: {
  slug: string;
  name: string;
  fortunes?: Record<string, number>;
}): CommunityStore {
  const state: CommunityState = {
    schemaVersion: 1,
    slug: seed.slug,
    name: seed.name,
    fortunes: seed.fortunes ?? {
      vitality: 2,
      cohesion: 2,
      surplus: 2,
      standing: 2,
      tradition: 2,
    },
    events: [],
  };

  const clientIds = new Set<string>();

  return {
    get: () => state,
    hasClientEvent: (id) => clientIds.has(id),
    append: (event) => {
      if (event.clientEventId) {
        if (clientIds.has(event.clientEventId)) {
          const existing = state.events.find((e) => e.clientEventId === event.clientEventId);
          if (existing) return existing;
        }
        clientIds.add(event.clientEventId);
      }
      const full: import('./types.js').AuditEvent = {
        id: event.id ?? `evt_${++seq}`,
        ts: event.ts ?? new Date().toISOString(),
        type: event.type,
        actor: event.actor,
        clientEventId: event.clientEventId,
        payload: event.payload,
      };
      state.events.push(full);
      return full;
    },
  };
}
