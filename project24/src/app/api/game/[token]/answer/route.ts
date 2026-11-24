import { getConfig } from "@/server/config";
import { applyAnswer, GameError, mutateGame, publicState } from "@/server/games";
import { getStore } from "@/server/db";
import { handleError, json } from "@/server/http";

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await ctx.params;
    const body = (await req.json().catch(() => ({}))) as { optionId?: unknown; level?: unknown };
    if (typeof body.optionId !== "string" || typeof body.level !== "number") throw new GameError(400, "bad_request");
    const cfg = await getConfig();
    const rec = await mutateGame(token, cfg, (d) => applyAnswer(d, body.optionId as string, body.level as number, cfg));
    const store = await getStore();
    await store.logEvent(rec.id, "answer", { level: body.level, optionId: body.optionId });
    if (rec.data.stage === "finished") await store.logEvent(rec.id, "completed", {});
    return json({ state: publicState(rec, cfg) });
  } catch (e) {
    return handleError(e);
  }
}
