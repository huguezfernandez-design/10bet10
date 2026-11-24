import "server-only";
import { randomBytes } from "node:crypto";
import type { PublicGameState } from "@/game/types";
import type { GameConfig } from "./config-types";
import { getStore, VersionConflict, type GameData, type GameRecord } from "./db";
import { demoModeAllowed } from "./vision";
import { applyAction, applyAnswer, freshData, GameError, markVerified, requireStage, type Action } from "./rules";

export { applyAction, applyAnswer, freshData, GameError, markVerified, requireStage, type Action };

export function newToken(): string {
  // 192 bits of entropy, URL-safe
  return randomBytes(24).toString("base64url");
}

export function isTokenShaped(token: string): boolean {
  return /^[A-Za-z0-9_-]{20,64}$/.test(token);
}

export async function createGame(cfg: GameConfig, label: string): Promise<GameRecord> {
  const store = await getStore();
  const now = new Date().toISOString();
  const rec: GameRecord = {
    id: randomBytes(6).toString("hex"),
    token: newToken(),
    label: label.slice(0, 80),
    data: freshData(cfg),
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
  await store.insertGame(rec);
  return rec;
}

export async function loadGame(token: string): Promise<GameRecord> {
  if (!isTokenShaped(token)) throw new GameError(404, "not_found");
  const store = await getStore();
  const rec = await store.getGameByToken(token);
  if (!rec) throw new GameError(404, "not_found");
  return rec;
}

/** Keeps the mission list in sync if the admin changed the number of levels mid-game. */
function normalise(data: GameData, cfg: GameConfig): GameData {
  const levels = cfg.stops.length - 1;
  while (data.missions.length < levels) data.missions.push({ status: "locked", attempts: 0, failures: 0, errors: 0 });
  if (data.missions.length > levels) data.missions = data.missions.slice(0, levels);
  if (data.level > levels) data.level = levels;
  return data;
}

export function publicState(rec: GameRecord, cfg: GameConfig): PublicGameState {
  const d = normalise(rec.data, cfg);
  return {
    stage: d.stage,
    level: d.level,
    missions: d.missions.map((m) => m.status),
    demoMode: demoModeAllowed(),
  };
}

/** Load → mutate → save with optimistic locking (retries once on a concurrent write). */
export async function mutateGame(
  token: string,
  cfg: GameConfig,
  fn: (d: GameData, rec: GameRecord) => void | Promise<void>,
): Promise<GameRecord> {
  const store = await getStore();
  for (let attempt = 0; attempt < 2; attempt++) {
    const rec = await loadGame(token);
    rec.data = normalise(rec.data, cfg);
    await fn(rec.data, rec);
    rec.version += 1;
    rec.updatedAt = new Date().toISOString();
    try {
      await store.updateGame(rec);
      return rec;
    } catch (e) {
      if (!(e instanceof VersionConflict) || attempt === 1) throw e;
    }
  }
  throw new GameError(409, "conflict");
}

