import { isAdmin } from "@/server/admin-auth";
import { getConfig } from "@/server/config";
import { getStore } from "@/server/db";
import { freshData } from "@/server/games";
import { json } from "@/server/http";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return json({ error: "unauthorized" }, 401);
  const { id } = await ctx.params;
  await (await getStore()).deleteGame(id);
  return json({ ok: true });
}

/** { op: "reset" } restarts the game from the beginning (same link). */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return json({ error: "unauthorized" }, 401);
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { op?: string; label?: string };
  const store = await getStore();
  const rec = await store.getGame(id);
  if (!rec) return json({ error: "not_found" }, 404);
  if (body.op === "reset") rec.data = freshData(await getConfig());
  if (typeof body.label === "string") rec.label = body.label.slice(0, 80);
  rec.version += 1;
  rec.updatedAt = new Date().toISOString();
  await store.updateGame(rec);
  if (body.op === "reset") await store.logEvent(id, "reset", {});
  return json({ game: rec });
}
