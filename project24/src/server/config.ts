import "server-only";
import { DEFAULT_CONFIG } from "@/content/default-config";
import type { PublicConfig } from "@/game/types";
import type { GameConfig } from "./config-types";
import { getStore } from "./db";

const SETTING_KEY = "config";

/** Active configuration: the admin override if one exists, otherwise the default file. */
export async function getConfig(): Promise<GameConfig> {
  const store = await getStore();
  const override = await store.getSetting<GameConfig>(SETTING_KEY);
  return override ?? DEFAULT_CONFIG;
}

export async function saveConfig(cfg: GameConfig) {
  const store = await getStore();
  await store.setSetting(SETTING_KEY, cfg);
}

export async function resetConfig() {
  const store = await getStore();
  await store.deleteSetting(SETTING_KEY);
}

export function getDefaultConfig(): GameConfig {
  return DEFAULT_CONFIG;
}

/** Strips every secret: expected objects, scoring, gifts. */
export function toPublic(cfg: GameConfig): PublicConfig {
  return {
    meta: cfg.meta,
    theme: cfg.theme,
    start: cfg.start,
    briefing: cfg.briefing,
    missionUi: cfg.missionUi,
    madrid: cfg.madrid,
    finale: cfg.finale,
    avatars: cfg.avatars,
    stops: cfg.stops.map((s) => ({
      id: s.id,
      name: s.name,
      region: s.region,
      lon: s.lon,
      lat: s.lat,
      scene: s.scene,
      levelLabel: s.levelLabel,
      travelQuip: s.travelQuip,
      arrivalLine: s.arrivalLine,
      mission: s.mission ? { title: s.mission.title, riddle: s.mission.riddle } : undefined,
      question: s.question
        ? { prompt: s.question.prompt, options: s.question.options.map((o) => ({ id: o.id, text: o.text })) }
        : undefined,
    })),
  };
}

/** Structural validation for configs submitted from the admin panel. Returns a list of problems. */
export function validateConfig(c: unknown): string[] {
  const errs: string[] = [];
  const cfg = c as GameConfig;
  if (!cfg || typeof cfg !== "object") return ["La configuración no es un objeto."];
  const str = (v: unknown, p: string) => typeof v !== "string" && errs.push(`${p} debe ser texto`);
  const arr = (v: unknown, p: string) => !Array.isArray(v) && errs.push(`${p} debe ser una lista`);
  for (const k of ["meta", "theme", "start", "briefing", "missionUi", "madrid", "finale", "avatars", "gifts", "scoring"] as const) {
    if (!cfg[k] || typeof cfg[k] !== "object") errs.push(`Falta la sección "${k}"`);
  }
  if (errs.length) return errs;
  arr(cfg.stops, "stops");
  if (!Array.isArray(cfg.stops)) return errs;
  if (cfg.stops.length < 2) errs.push("Hace falta al menos un origen y un destino.");
  const giftKeys = Object.keys(cfg.gifts);
  if (giftKeys.length < 1) errs.push("Hace falta al menos un regalo.");
  const ids = new Set<string>();
  cfg.stops.forEach((s, i) => {
    const p = `stops[${i}]`;
    str(s.id, `${p}.id`);
    str(s.name, `${p}.name`);
    if (ids.has(s.id)) errs.push(`${p}.id repetido`);
    ids.add(s.id);
    if (typeof s.lon !== "number" || typeof s.lat !== "number") errs.push(`${p}: lon/lat deben ser números`);
    if (i === 0) return;
    if (!s.mission) errs.push(`${p}: falta mission`);
    else {
      str(s.mission.expectedObject, `${p}.mission.expectedObject`);
      arr(s.mission.riddle, `${p}.mission.riddle`);
      arr(s.mission.acceptable, `${p}.mission.acceptable`);
      if (!Array.isArray(s.mission.rejectExamples)) s.mission.rejectExamples = [];
    }
    if (!s.question) errs.push(`${p}: falta question`);
    else {
      arr(s.question.options, `${p}.question.options`);
      if (Array.isArray(s.question.options)) {
        if (s.question.options.length < 2) errs.push(`${p}: al menos dos respuestas`);
        const oids = new Set<string>();
        s.question.options.forEach((o, j) => {
          if (oids.has(o.id)) errs.push(`${p}.options[${j}].id repetido`);
          oids.add(o.id);
          for (const [k, v] of Object.entries(o.points ?? {})) {
            if (!giftKeys.includes(k)) errs.push(`${p}.options[${j}].points: categoría desconocida "${k}"`);
            if (typeof v !== "number") errs.push(`${p}.options[${j}].points.${k} debe ser número`);
          }
        });
      }
    }
  });
  return errs;
}
