import type { RevealPayload } from "@/game/types";
import { getConfig } from "@/server/config";
import { GameError, loadGame } from "@/server/games";
import { giftArt } from "@/server/gift-art";
import { handleError, json } from "@/server/http";

/** Only available once the game is finished. Returns ONLY the winning gift; never scores or other options. */
export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await ctx.params;
    const [cfg, rec] = await Promise.all([getConfig(), loadGame(token)]);
    if (rec.data.stage !== "finished" || !rec.data.result) throw new GameError(403, "not_finished");
    const gift = cfg.gifts[rec.data.result.gift] ?? Object.values(cfg.gifts)[0];
    const payload: RevealPayload = {
      kicker: gift.kicker,
      headline: gift.headline,
      body: gift.body,
      signoff: gift.signoff,
      image: gift.image,
      art: giftArt(gift.art, gift.palette),
      palette: gift.palette,
      layout: gift.layout,
    };
    return json({ reveal: payload });
  } catch (e) {
    return handleError(e);
  }
}
