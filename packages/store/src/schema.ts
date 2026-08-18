/** schema_version in meta table */
export const SCHEMA_VERSION = 2;

export const MIGRATIONS: { version: number; sql: string }[] = [
  {
    version: 1,
    sql: `
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY NOT NULL,
  ts TEXT NOT NULL,
  type TEXT NOT NULL,
  actor TEXT,
  client_event_id TEXT UNIQUE,
  payload TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS community (
  id TEXT PRIMARY KEY NOT NULL CHECK (id = 'main'),
  data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'pc',
  status TEXT NOT NULL DEFAULT 'active',
  data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS members (
  platform TEXT NOT NULL,
  account_id TEXT NOT NULL,
  display_name TEXT,
  character_id TEXT,
  role TEXT NOT NULL DEFAULT 'player',
  PRIMARY KEY (platform, account_id)
);

CREATE TABLE IF NOT EXISTS rolls (
  id TEXT PRIMARY KEY NOT NULL,
  ts TEXT NOT NULL,
  character_id TEXT,
  parent_roll_id TEXT,
  data TEXT NOT NULL
);
`,
  },
  {
    version: 2,
    sql: `
ALTER TABLE members ADD COLUMN focused_character_id TEXT;
`,
  },
];
