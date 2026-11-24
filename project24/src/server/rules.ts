// Pure game rules (no I/O). Used by the server and by the offline preview build.
import type { GameConfig } from "./config-types";
import type { GameData } from "./db";
import { scoreAnswers } from "./scoring";

export class GameError extends Error {
  constructor(
    public status: number,
    public code: string,
    message?: string,
  ) {
    super(message ?? code);
  }
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
