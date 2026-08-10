/**
 * Local community store (SQLite in a later step).
 * In-memory implementation for early wiring + tests.
 */

export interface AuditEvent {
  id: string;
  ts: string;
  type: string;
  actor?: string;
  clientEventId?: string;
  payload: unknown;
}

export interface CommunityState {
  schemaVersion: number;
  slug: string;
  name: string;
  fortunes: Record<string, number>;
  events: AuditEvent[];
}

export interface CommunityStore {
  get(): CommunityState;
  append(event: Omit<AuditEvent, 'id' | 'ts'> & { id?: string; ts?: string }): AuditEvent;
  /** Reject duplicate clientEventId (idempotency). */
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
      const full: AuditEvent = {
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
