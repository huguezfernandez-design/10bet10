import { getConfig } from "@/server/config";
import { loadGame, publicState } from "@/server/games";
import { handleError, json } from "@/server/http";

export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await ctx.params;
    const [cfg, rec] = await Promise.all([getConfig(), loadGame(token)]);
    return json({ state: publicState(rec, cfg) });
  } catch (e) {
    return handleError(e);
  }
}
