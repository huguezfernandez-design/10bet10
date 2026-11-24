import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Game } from "@/components/game/Game";
import { getConfig, toPublic } from "@/server/config";
import { GameError, loadGame, publicState } from "@/server/games";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "PROJECT 24 — The Road to Madrid",
  robots: { index: false, follow: false },
};

export default async function PlayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    const [cfg, rec] = await Promise.all([getConfig(), loadGame(token)]);
    return <Game token={token} config={toPublic(cfg)} initial={publicState(rec, cfg)} />;
  } catch (e) {
    if (e instanceof GameError && e.status === 404) notFound();
    throw e;
  }
}
