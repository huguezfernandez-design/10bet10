"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { ApiError, type Api } from "@/lib/api";
import type { PublicConfig, PublicGameState, PublicStop } from "@/game/types";

export function QuestionPanel({
  stop,
  level,
  total,
  ui,
  api,
  onAnswered,
  onSfx,
}: {
  stop: PublicStop;
  level: number;
  total: number;
  ui: PublicConfig["missionUi"];
  api: Api;
  onAnswered: (s: PublicGameState) => void;
  onSfx: (s: "tap") => void;
}) {
  const q = stop.question!;
  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function confirm() {
    if (!picked) return;
    setBusy(true);
    setError(null);
    onSfx("tap");
    try {
      const res = await api.answer(level, picked);
      setSent(true);
      await new Promise((r) => setTimeout(r, 900));
      onAnswered(res.state);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se ha podido guardar. Inténtalo otra vez.");
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="label text-accent">{ui.questionKicker}</p>
        <p className="label text-ink/40 tabular-nums">
          {String(level).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </p>
      </div>
      <h2 className="display text-[2.1rem] leading-[1.02] mt-3">{q.prompt}</h2>
      <ul className="mt-6 space-y-2.5" role="radiogroup">
        {q.options.map((o, i) => {
          const on = picked === o.id;
          return (
            <motion.li key={o.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }}>
              <button
                role="radio"
                aria-checked={on}
                disabled={busy}
                onClick={() => {
                  setPicked(o.id);
                  onSfx("tap");
                }}
                className={`w-full text-left flex gap-4 items-start rounded-2xl border px-4 py-3.5 transition-all ${
                  on ? "bg-ink text-paper border-ink" : "bg-snow border-ink/10 hover:border-ink/40"
                }`}
              >
                <span className={`label mt-[3px] ${on ? "text-paper/60" : "text-ink/40"}`}>{String.fromCharCode(65 + i)}</span>
                <span className="text-[15px] leading-snug">{o.text}</span>
              </button>
            </motion.li>
          );
        })}
      </ul>
      {error && <p className="mt-3 text-sm text-accent">{error}</p>}
      <button className="btn-primary w-full mt-5" disabled={!picked || busy} onClick={confirm}>
        {sent ? "Anotado." : busy ? "…" : "Confirmar"}
        {!busy && <span aria-hidden>→</span>}
      </button>
      <p className="mt-3 text-center text-xs text-ink/45">Sin respuestas correctas. Solo la tuya.</p>
    </div>
  );
}
