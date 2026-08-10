import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { MIGRATIONS, SCHEMA_VERSION } from './schema.js';
import type {
  AuditEvent,
  CharacterRecord,
  CommunityRecord,
  MemberRecord,
  PublicSnapshot,
  RollRecord,
} from './types.js';

export interface SqliteCommunityStore {
  readonly path: string;
  close(): void;
  getCommunity(): CommunityRecord;
  putCommunity(c: CommunityRecord): void;
  listCharacters(): CharacterRecord[];
  getCharacterBySlug(slug: string): CharacterRecord | undefined;
  getCharacterById(id: string): CharacterRecord | undefined;
  putCharacter(c: CharacterRecord): void;
  listMembers(): MemberRecord[];
  putMember(m: MemberRecord): void;
  appendEvent(event: Omit<AuditEvent, 'id' | 'ts'> & { id?: string; ts?: string }): AuditEvent;
  hasClientEvent(clientEventId: string): boolean;
  insertRoll(roll: RollRecord): void;
  getRoll(id: string): RollRecord | undefined;
  toPublicSnapshot(): PublicSnapshot;
}

export function openSqliteStore(path: string): SqliteCommunityStore {
  if (path !== ':memory:') {
    mkdirSync(dirname(path), { recursive: true });
  }
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  migrate(db);

  return {
    path,
    close: () => db.close(),
    getCommunity: () => {
      const row = db.prepare(`SELECT data FROM community WHERE id = 'main'`).get() as
        | { data: string }
        | undefined;
      if (!row) throw new Error('community row missing — run seed/init');
      return JSON.parse(row.data) as CommunityRecord;
    },
    putCommunity: (c) => {
      db.prepare(
        `INSERT INTO community (id, data) VALUES ('main', ?)
         ON CONFLICT(id) DO UPDATE SET data = excluded.data`,
      ).run(JSON.stringify(c));
    },
    listCharacters: () => {
      const rows = db.prepare(`SELECT data FROM characters ORDER BY name`).all() as {
        data: string;
      }[];
      return rows.map((r) => JSON.parse(r.data) as CharacterRecord);
    },
    getCharacterBySlug: (slug) => {
      const row = db.prepare(`SELECT data FROM characters WHERE slug = ?`).get(slug) as
        | { data: string }
        | undefined;
      return row ? (JSON.parse(row.data) as CharacterRecord) : undefined;
    },
    getCharacterById: (id) => {
      const row = db.prepare(`SELECT data FROM characters WHERE id = ?`).get(id) as
        | { data: string }
        | undefined;
      return row ? (JSON.parse(row.data) as CharacterRecord) : undefined;
    },
    putCharacter: (c) => {
      db.prepare(
        `INSERT INTO characters (id, slug, name, kind, status, data)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           slug = excluded.slug,
           name = excluded.name,
           kind = excluded.kind,
           status = excluded.status,
           data = excluded.data`,
      ).run(c.id, c.slug, c.name, c.kind, c.status, JSON.stringify(c));
    },
    listMembers: () => {
      const rows = db
        .prepare(
          `SELECT platform, account_id, display_name, character_id, role FROM members`,
        )
        .all() as {
        platform: string;
        account_id: string;
        display_name: string | null;
        character_id: string | null;
        role: string;
      }[];
      return rows.map((r) => ({
        platform: r.platform as MemberRecord['platform'],
        accountId: r.account_id,
        displayName: r.display_name ?? undefined,
        characterId: r.character_id ?? undefined,
        role: r.role as MemberRecord['role'],
      }));
    },
    putMember: (m) => {
      db.prepare(
        `INSERT INTO members (platform, account_id, display_name, character_id, role)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(platform, account_id) DO UPDATE SET
           display_name = excluded.display_name,
           character_id = excluded.character_id,
           role = excluded.role`,
      ).run(
        m.platform,
        m.accountId,
        m.displayName ?? null,
        m.characterId ?? null,
        m.role,
      );
    },
    appendEvent: (event) => {
      if (event.clientEventId) {
        const existing = db
          .prepare(`SELECT id, ts, type, actor, client_event_id, payload FROM events WHERE client_event_id = ?`)
          .get(event.clientEventId) as
          | {
              id: string;
              ts: string;
              type: string;
              actor: string | null;
              client_event_id: string | null;
              payload: string;
            }
          | undefined;
        if (existing) {
          return rowToEvent(existing);
        }
      }
      const full: AuditEvent = {
        id: event.id ?? randomUUID(),
        ts: event.ts ?? new Date().toISOString(),
        type: event.type,
        actor: event.actor,
        clientEventId: event.clientEventId,
        payload: event.payload,
      };
      db.prepare(
        `INSERT INTO events (id, ts, type, actor, client_event_id, payload)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(
        full.id,
        full.ts,
        full.type,
        full.actor ?? null,
        full.clientEventId ?? null,
        JSON.stringify(full.payload),
      );
      return full;
    },
    hasClientEvent: (clientEventId) => {
      const row = db
        .prepare(`SELECT 1 AS ok FROM events WHERE client_event_id = ?`)
        .get(clientEventId) as { ok: number } | undefined;
      return Boolean(row);
    },
    insertRoll: (roll) => {
      db.prepare(
        `INSERT INTO rolls (id, ts, character_id, parent_roll_id, data)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET data = excluded.data`,
      ).run(
        roll.id,
        roll.ts,
        roll.characterId ?? null,
        roll.parentRollId ?? null,
        JSON.stringify(roll.data),
      );
    },
    getRoll: (id) => {
      const row = db
        .prepare(`SELECT id, ts, character_id, parent_roll_id, data FROM rolls WHERE id = ?`)
        .get(id) as
        | {
            id: string;
            ts: string;
            character_id: string | null;
            parent_roll_id: string | null;
            data: string;
          }
        | undefined;
      if (!row) return undefined;
      return {
        id: row.id,
        ts: row.ts,
        characterId: row.character_id ?? undefined,
        parentRollId: row.parent_roll_id ?? undefined,
        data: JSON.parse(row.data) as Record<string, unknown>,
      };
    },
    toPublicSnapshot: () => {
      const community = (() => {
        const row = db.prepare(`SELECT data FROM community WHERE id = 'main'`).get() as
          | { data: string }
          | undefined;
        if (!row) throw new Error('community row missing');
        return JSON.parse(row.data) as CommunityRecord;
      })();
      const characters = (
        db.prepare(`SELECT data FROM characters WHERE status != 'draft' ORDER BY name`).all() as {
          data: string;
        }[]
      ).map((r) => JSON.parse(r.data) as CharacterRecord);
      return {
        generatedAt: new Date().toISOString(),
        schemaVersion: SCHEMA_VERSION,
        community,
        characters,
      };
    },
  };
}

function migrate(db: DatabaseSync): void {
  db.exec(`CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)`);
  const row = db.prepare(`SELECT value FROM meta WHERE key = 'schema_version'`).get() as
    | { value: string }
    | undefined;
  let current = row ? Number(row.value) : 0;
  for (const m of MIGRATIONS) {
    if (m.version <= current) continue;
    db.exec('BEGIN');
    try {
      db.exec(m.sql);
      db.prepare(
        `INSERT INTO meta (key, value) VALUES ('schema_version', ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      ).run(String(m.version));
      db.exec('COMMIT');
      current = m.version;
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  }
  if (current < SCHEMA_VERSION) {
    throw new Error(`store migration incomplete: ${current} < ${SCHEMA_VERSION}`);
  }
}

function rowToEvent(row: {
  id: string;
  ts: string;
  type: string;
  actor: string | null;
  client_event_id: string | null;
  payload: string;
}): AuditEvent {
  return {
    id: row.id,
    ts: row.ts,
    type: row.type,
    actor: row.actor ?? undefined,
    clientEventId: row.client_event_id ?? undefined,
    payload: JSON.parse(row.payload),
  };
}

export function emptyCommunity(slug: string, name: string): CommunityRecord {
  return {
    slug,
    name,
    fortunes: {
      vitality: 2,
      cohesion: 2,
      surplus: 2,
      standing: 2,
      tradition: 2,
    },
    myths: [],
    hierarchyAxes: ['Arms', 'Faith', 'Coin', 'Blood'],
    ruler: null,
    placements: [],
  };
}
