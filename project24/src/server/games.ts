import "server-only";
import { randomBytes } from "node:crypto";
import type { PublicGameState } from "@/game/types";
import type { GameConfig } from "./config-types";
import { getStore, VersionConflict, type GameData, type GameRecord } from "./db";
import { scoreAnswers } from "./scoring";
import { demoModeAllowed } from "./vision";

export class GameError extends Error {
  constructor(
    public status: number,
    public code: string,
    message?: string,
  ) {
    super(message ?? code);
  }
}

export function newToken(): string {
  // 192 bits of entropy, URL-safe
  return randomBytes(24).toString("base64url");
}

export function isTokenShaped(token: string): boolean {
  return /^[A-Za-z0-9_-]{20,64}$/.test(token);
}

export function freshData(cfg: GameConfig): GameData {
  const levels = cfg.stops.length - 1;
  return {
    stage: "welcome",
    level: 0,
    missions: Array.from({ length: levels }, () => ({ status: "locked" as const, attempts: 0, failures: 0, errors: 0 })),
    answers: [],
  };
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

const lastLevel = (cfg: GameConfig) => cfg.stops.length - 1;

/* ───────────── Transitions. Each one checks the current stage, so levels can't be skipped. ───────────── */

export type Action = "start" | "depart" | "arrive" | "meet";

export function applyAction(d: GameData, action: Action, cfg: GameConfig) {
  const now = new Date().toISOString();
  switch (action) {
    case "start":
      if (d.stage !== "welcome") return; // idempotent
      d.stage = "briefing";
      d.startedAt = now;
      return;
    case "depart":
      if (d.stage !== "briefing") return;
      d.stage = "traveling";
      d.level = 1;
      return;
    case "arrive":
      if (d.stage !== "traveling") return;
      d.missions[d.level - 1].status = "active";
      d.stage = d.level === lastLevel(cfg) ? "meeting" : "mission";
      return;
    case "meet":
      if (d.stage !== "meeting") return;
      d.stage = "mission";
      return;
    default:
      throw new GameError(400, "bad_action");
  }
}

export function requireStage(d: GameData, stage: GameData["stage"]) {
  if (d.stage !== stage) throw new GameError(409, "wrong_stage", `Expected stage ${stage}, got ${d.stage}`);
}

export function markVerified(d: GameData, by: "ai" | "demo", detected: string) {
  requireStage(d, "mission");
  const m = d.missions[d.level - 1];
  m.status = "verified";
  m.verifiedAt = new Date().toISOString();
  m.verifiedBy = by;
  m.lastDetected = detected;
  d.stage = "question";
}

export function applyAnswer(d: GameData, optionId: string, level: number, cfg: GameConfig) {
  requireStage(d, "question");
  if (level !== d.level) throw new GameError(409, "wrong_level");
  const stop = cfg.stops[d.level];
  const opt = stop.question?.options.find((o) => o.id === optionId);
  if (!opt) throw new GameError(400, "bad_option");
  d.answers = d.answers.filter((a) => a.level !== d.level);
  d.answers.push({ level: d.level, optionId: opt.id, optionText: opt.text, at: new Date().toISOString() });
  d.missions[d.level - 1].status = "answered";

  if (d.level < lastLevel(cfg)) {
    d.level += 1;
    d.stage = "traveling";
    return;
  }
  // Final answer → decide the gift (server only).
  const scored = [...d.answers]
    .sort((a, b) => a.level - b.level)
    .map((a) => ({
      points: cfg.stops[a.level]?.question?.options.find((o) => o.id === a.optionId)?.points ?? {},
    }));
  const res = scoreAnswers(Object.keys(cfg.gifts), scored, cfg.scoring.tieBreakOrder);
  d.result = { gift: res.winner, scores: res.scores, decidedAt: new Date().toISOString() };
  d.stage = "finished";
  d.completedAt = new Date().toISOString();
}
