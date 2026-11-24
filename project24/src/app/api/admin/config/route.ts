import { isAdmin } from "@/server/admin-auth";
import { getConfig, getDefaultConfig, resetConfig, saveConfig, validateConfig } from "@/server/config";
import type { GameConfig } from "@/server/config-types";
import { json } from "@/server/http";

export async function GET() {
  if (!(await isAdmin())) return json({ error: "unauthorized" }, 401);
  return json({ config: await getConfig(), defaults: getDefaultConfig() });
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) return json({ error: "unauthorized" }, 401);
  const body = (await req.json().catch(() => null)) as { config?: GameConfig } | null;
  const errors = validateConfig(body?.config);
  if (errors.length) return json({ error: "invalid", errors }, 400);
  await saveConfig(body!.config!);
  return json({ ok: true });
}

export async function DELETE() {
  if (!(await isAdmin())) return json({ error: "unauthorized" }, 401);
  await resetConfig();
  return json({ ok: true });
}
