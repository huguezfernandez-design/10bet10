import { getConfig } from "@/server/config";
import { applyAction, GameError, mutateGame, publicState, type Action } from "@/server/games";
import { handleError, json } from "@/server/http";

const ACTIONS: Action[] = ["start", "depart", "arrive", "meet"];

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await ctx.params;
    const body = (await req.json().catch(() => ({}))) as { action?: string };
    const action = body.action as Action;
    if (!ACTIONS.includes(action)) throw new GameError(400, "bad_action");
    const cfg = await getConfig();
    const rec = await mutateGame(token, cfg, (d) => applyAction(d, action, cfg));
    return json({ state: publicState(rec, cfg) });
  } catch (e) {
    return handleError(e);
  }
}
