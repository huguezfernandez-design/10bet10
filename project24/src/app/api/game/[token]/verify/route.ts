import Anthropic from "@anthropic-ai/sdk";
import type { VerifyResponse } from "@/game/types";
import { getConfig } from "@/server/config";
import { getStore } from "@/server/db";
import { GameError, loadGame, markVerified, mutateGame, publicState, requireStage } from "@/server/games";
import { clientIp, handleError, json, rateLimit } from "@/server/http";
import { demoModeAllowed, MAX_IMAGE_BYTES, sniffImage, verifyWithClaude, visionConfigured } from "@/server/vision";

export const maxDuration = 60;

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  let gameId = "";
  try {
    const { token } = await ctx.params;
    const cfg = await getConfig();
    const rec = await loadGame(token);
    gameId = rec.id;
    requireStage(rec.data, "mission");
    const level = rec.data.level;
    const mission = cfg.stops[level]?.mission;
    if (!mission) throw new GameError(500, "no_mission");

    if (!rateLimit(`verify:${token}`, 8, 60_000) || !rateLimit(`verify-ip:${clientIp(req)}`, 20, 60_000)) {
      throw new GameError(429, "too_many", "Demasiados intentos seguidos. Respira y prueba en un minuto.");
    }
    if (rec.data.missions[level - 1].attempts >= 60) throw new GameError(429, "attempt_cap");

    // Validate the upload (in memory only, never written to disk).
    const len = Number(req.headers.get("content-length") || 0);
    if (len > MAX_IMAGE_BYTES + 64 * 1024) throw new GameError(413, "too_large", "La foto es demasiado grande (máx. 8 MB).");
    const form = await req.formData().catch(() => null);
    const file = form?.get("photo");
    if (!(file instanceof File)) throw new GameError(400, "no_photo", "Falta la foto.");
    if (file.size === 0) throw new GameError(400, "empty", "La foto está vacía.");
    if (file.size > MAX_IMAGE_BYTES) throw new GameError(413, "too_large", "La foto es demasiado grande (máx. 8 MB).");
    const data = new Uint8Array(await file.arrayBuffer());
    const mime = sniffImage(data);
    if (!mime) throw new GameError(415, "bad_format", "Formato no válido. Usa JPG, PNG o WEBP.");

    const store = await getStore();

    // ── Demo mode: no API key. Clearly flagged, never presented as a real check. ──
    if (!visionConfigured()) {
      if (!demoModeAllowed()) throw new GameError(503, "vision_unavailable", "La verificación no está disponible ahora mismo.");
      const updated = await mutateGame(token, cfg, (d) => {
        d.missions[d.level - 1].attempts += 1;
        markVerified(d, "demo", "(modo demo: sin análisis)");
      });
      await store.logEvent(rec.id, "verify_demo", { level });
      const res: VerifyResponse = {
        valid: true,
        demo: true,
        detected_object: "",
        message: "MODO DEMOSTRACIÓN: la foto no se ha analizado porque falta ANTHROPIC_API_KEY.",
        state: publicState(updated, cfg),
      };
      return json(res);
    }

    // ── Real verification with Claude Vision ──
    let verdict;
    try {
      verdict = await verifyWithClaude({ data, mime }, mission);
    } catch (err) {
      await mutateGame(token, cfg, (d) => {
        d.missions[d.level - 1].errors += 1;
      });
      const detail =
        err instanceof Anthropic.APIError
          ? `${err.status ?? "?"} ${err.name}: ${err.message}`.slice(0, 500)
          : err instanceof Error
            ? err.message.slice(0, 500)
            : String(err);
      console.error("[toti24] vision error:", detail);
      await store.logEvent(rec.id, "verify_error", { level, detail });
      const busy = err instanceof Anthropic.RateLimitError || (err instanceof Anthropic.APIError && (err.status ?? 0) >= 500);
      throw new GameError(502, "vision_error", busy ? "El analista está saturado. Prueba otra vez en unos segundos." : "No he podido analizar la foto. Inténtalo de nuevo.");
    }

    const valid = verdict.verdict === "match";
    const updated = await mutateGame(token, cfg, (d) => {
      const m = d.missions[d.level - 1];
      m.attempts += 1;
      m.lastDetected = verdict.detected_object;
      if (valid) markVerified(d, "ai", verdict.detected_object);
      else m.failures += 1;
    });
    await store.logEvent(rec.id, valid ? "verify_ok" : "verify_rejected", {
      level,
      verdict: verdict.verdict,
      detected: verdict.detected_object,
    });

    const message = valid
      ? mission.successMessage
      : verdict.verdict === "unclear"
        ? "No se ve bien. Más luz, más cerca, y que el objeto salga entero."
        : verdict.message || mission.errorMessage;

    const res: VerifyResponse = {
      valid,
      detected_object: verdict.detected_object,
      message,
      state: publicState(updated, cfg),
    };
    return json(res);
  } catch (e) {
    if (gameId && !(e instanceof GameError)) {
      (await getStore()).logEvent(gameId, "verify_error", { detail: String(e) }).catch(() => {});
    }
    return handleError(e);
  }
}
