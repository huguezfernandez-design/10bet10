import { isAdmin } from "@/server/admin-auth";
import { getConfig } from "@/server/config";
import { getStore } from "@/server/db";
import { createGame } from "@/server/games";
import { json } from "@/server/http";

export async function GET() {
  if (!(await isAdmin())) return json({ error: "unauthorized" }, 401);
  const store = await getStore();
  const [games, events] = await Promise.all([store.listGames(), store.listEvents(200)]);
  return json({ games, events, storage: store.kind });
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return json({ error: "unauthorized" }, 401);
  const body = (await req.json().catch(() => ({}))) as { label?: string };
  const rec = await createGame(await getConfig(), typeof body.label === "string" ? body.label : "");
  return json({ game: rec });
}
