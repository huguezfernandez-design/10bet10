import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { MissionStatus, Stage } from "@/game/types";

/* ───────────────────────── Records ───────────────────────── */

export interface MissionRecord {
  status: MissionStatus;
  attempts: number;
  failures: number;
  errors: number;
  verifiedAt?: string;
  verifiedBy?: "ai" | "demo";
  lastDetected?: string;
}

export interface AnswerRecord {
  level: number;
  optionId: string;
  optionText: string;
  at: string;
}

export interface GameData {
  stage: Stage;
  level: number;
  missions: MissionRecord[]; // index = level - 1
  answers: AnswerRecord[];
  result?: { gift: string; scores: Record<string, number>; decidedAt: string };
  startedAt?: string;
  completedAt?: string;
}

export interface GameRecord {
  id: string;
  token: string;
  label: string;
  data: GameData;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface EventRecord {
  id: number;
  gameId: string;
  type: string;
  data: Record<string, unknown>;
  createdAt: string;
}

export class VersionConflict extends Error {
  constructor() {
    super("version conflict");
  }
}

export interface Store {
  kind: "postgres" | "file";
  getGameByToken(token: string): Promise<GameRecord | null>;
  getGame(id: string): Promise<GameRecord | null>;
  listGames(): Promise<GameRecord[]>;
  insertGame(rec: GameRecord): Promise<void>;
  /** Writes rec if the stored version equals rec.version - 1. */
  updateGame(rec: GameRecord): Promise<void>;
  deleteGame(id: string): Promise<void>;
  getSetting<T>(key: string): Promise<T | null>;
  setSetting(key: string, value: unknown): Promise<void>;
  deleteSetting(key: string): Promise<void>;
  logEvent(gameId: string, type: string, data: Record<string, unknown>): Promise<void>;
  listEvents(limit: number, gameId?: string): Promise<EventRecord[]>;
}

/* ───────────────────────── Postgres (Supabase, Neon, RDS…) ───────────────────────── */

async function createPostgresStore(url: string): Promise<Store> {
  const { default: postgres } = await import("postgres");
  const sql = postgres(url, {
    max: 3,
    prepare: false, // compatible with Supabase / PgBouncer transaction pooling
    idle_timeout: 20,
    ssl: /localhost|127\.0\.0\.1/.test(url) ? false : "require",
    onnotice: () => {},
  });

  await sql`
    create table if not exists p24_games (
      id text primary key,
      token text unique not null,
      label text not null default '',
      data jsonb not null,
      version integer not null default 1,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )`;
  await sql`
    create table if not exists p24_settings (
      key text primary key,
      value jsonb not null,
      updated_at timestamptz not null default now()
    )`;
  await sql`
    create table if not exists p24_events (
      id bigserial primary key,
      game_id text not null,
      type text not null,
      data jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    )`;

  type Row = {
    id: string;
    token: string;
    label: string;
    data: GameData;
    version: number;
    created_at: Date;
    updated_at: Date;
  };
  const toRec = (r: Row): GameRecord => ({
    id: r.id,
    token: r.token,
    label: r.label,
    data: r.data,
    version: r.version,
    createdAt: new Date(r.created_at).toISOString(),
    updatedAt: new Date(r.updated_at).toISOString(),
  });

  return {
    kind: "postgres",
    async getGameByToken(token) {
      const rows = await sql<Row[]>`select * from p24_games where token = ${token}`;
      return rows[0] ? toRec(rows[0]) : null;
    },
    async getGame(id) {
      const rows = await sql<Row[]>`select * from p24_games where id = ${id}`;
      return rows[0] ? toRec(rows[0]) : null;
    },
    async listGames() {
      const rows = await sql<Row[]>`select * from p24_games order by created_at desc`;
      return rows.map(toRec);
    },
    async insertGame(rec) {
      await sql`insert into p24_games (id, token, label, data, version, created_at, updated_at)
        values (${rec.id}, ${rec.token}, ${rec.label}, ${sql.json(rec.data as never)}, ${rec.version}, ${rec.createdAt}, ${rec.updatedAt})`;
    },
    async updateGame(rec) {
      const res = await sql`update p24_games
        set data = ${sql.json(rec.data as never)}, label = ${rec.label}, version = ${rec.version}, updated_at = ${rec.updatedAt}
        where id = ${rec.id} and version = ${rec.version - 1}`;
      if (res.count === 0) throw new VersionConflict();
    },
    async deleteGame(id) {
      await sql`delete from p24_games where id = ${id}`;
      await sql`delete from p24_events where game_id = ${id}`;
    },
    async getSetting<T>(key: string) {
      const rows = await sql<{ value: T }[]>`select value from p24_settings where key = ${key}`;
      return rows[0] ? rows[0].value : null;
    },
    async setSetting(key, value) {
      await sql`insert into p24_settings (key, value, updated_at) values (${key}, ${sql.json(value as never)}, now())
        on conflict (key) do update set value = excluded.value, updated_at = now()`;
    },
    async deleteSetting(key) {
      await sql`delete from p24_settings where key = ${key}`;
    },
    async logEvent(gameId, type, data) {
      await sql`insert into p24_events (game_id, type, data) values (${gameId}, ${type}, ${sql.json(data as never)})`;
    },
    async listEvents(limit, gameId) {
      const rows = gameId
        ? await sql`select * from p24_events where game_id = ${gameId} order by id desc limit ${limit}`
        : await sql`select * from p24_events order by id desc limit ${limit}`;
      return rows.map((r) => ({
        id: Number(r.id),
        gameId: r.game_id as string,
        type: r.type as string,
        data: r.data as Record<string, unknown>,
        createdAt: new Date(r.created_at as Date).toISOString(),
      }));
    },
  };
}

/* ───────────────────────── JSON file (local development) ───────────────────────── */

interface FileShape {
  games: GameRecord[];
  settings: Record<string, unknown>;
  events: EventRecord[];
}

function createFileStore(): Store {
  const dir = process.env.DATA_DIR || path.join(process.cwd(), ".data");
  const file = path.join(dir, "db.json");
  let chain: Promise<unknown> = Promise.resolve();

  async function read(): Promise<FileShape> {
    try {
      return JSON.parse(await fs.readFile(file, "utf8")) as FileShape;
    } catch {
      return { games: [], settings: {}, events: [] };
    }
  }
  async function write(db: FileShape) {
    await fs.mkdir(dir, { recursive: true });
    const tmp = file + ".tmp";
    await fs.writeFile(tmp, JSON.stringify(db, null, 2));
    await fs.rename(tmp, file);
  }
  // serialise all access so read-modify-write is atomic within this process
  function locked<T>(fn: (db: FileShape) => Promise<T> | T, save = false): Promise<T> {
    const run = chain.then(async () => {
      const db = await read();
      const out = await fn(db);
      if (save) await write(db);
      return out;
    });
    chain = run.catch(() => {});
    return run;
  }
  const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

  return {
    kind: "file",
    getGameByToken: (token) => locked((db) => clone(db.games.find((g) => g.token === token) ?? null)),
    getGame: (id) => locked((db) => clone(db.games.find((g) => g.id === id) ?? null)),
    listGames: () => locked((db) => clone([...db.games].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))),
    insertGame: (rec) => locked((db) => void db.games.push(clone(rec)), true),
    updateGame: (rec) =>
      locked((db) => {
        const i = db.games.findIndex((g) => g.id === rec.id);
        if (i < 0 || db.games[i].version !== rec.version - 1) throw new VersionConflict();
        db.games[i] = clone(rec);
      }, true),
    deleteGame: (id) =>
      locked((db) => {
        db.games = db.games.filter((g) => g.id !== id);
        db.events = db.events.filter((e) => e.gameId !== id);
      }, true),
    getSetting: <T,>(key: string) => locked((db) => clone((db.settings[key] as T) ?? null)),
    setSetting: (key, value) => locked((db) => void (db.settings[key] = clone(value)), true),
    deleteSetting: (key) => locked((db) => void delete db.settings[key], true),
    logEvent: (gameId, type, data) =>
      locked((db) => {
        const id = (db.events[db.events.length - 1]?.id ?? 0) + 1;
        db.events.push({ id, gameId, type, data, createdAt: new Date().toISOString() });
        if (db.events.length > 2000) db.events = db.events.slice(-2000);
      }, true),
    listEvents: (limit, gameId) =>
      locked((db) =>
        clone(
          db.events
            .filter((e) => !gameId || e.gameId === gameId)
            .slice(-limit)
            .reverse(),
        ),
      ),
  };
}

/* ───────────────────────── Singleton ───────────────────────── */

const g = globalThis as unknown as { __p24store?: Promise<Store> };

export function getStore(): Promise<Store> {
  if (!g.__p24store) {
    const url = process.env.DATABASE_URL;
    if (url) {
      g.__p24store = createPostgresStore(url).catch((e) => {
        g.__p24store = undefined;
        throw e;
      });
    } else {
      if (process.env.VERCEL) {
        console.warn("[project24] DATABASE_URL is not set: using a temporary file store. Progress will NOT persist on Vercel.");
      }
      g.__p24store = Promise.resolve(createFileStore());
    }
  }
  return g.__p24store;
}
