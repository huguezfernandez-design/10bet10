"use client";

import { motion } from "motion/react";
import { useEffect } from "react";
import type { PublicStop } from "@/game/types";

/** Big editorial "DESTINATION REACHED" moment between travelling and the mission. */
export function ArrivalCard({
  stop,
  level,
  reachedLabel,
  missionLabel,
  onDone,
}: {
  stop: PublicStop;
  level: number;
  reachedLabel: string;
  missionLabel: string;
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  const ease = [0.22, 1, 0.36, 1] as const;
  return (
    <motion.button
      onClick={onDone}
      className="fixed inset-0 z-30 flex items-end sm:items-center justify-center pb-[22dvh] sm:pb-0 cursor-pointer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
      aria-label="Continuar"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-paper via-paper/50 to-transparent sm:bg-paper/40" />
      <div className="relative text-center px-6">
        <motion.p
          className="label text-ink/60"
          initial={{ opacity: 0, letterSpacing: "0.5em" }}
          animate={{ opacity: 1, letterSpacing: "0.18em" }}
          transition={{ duration: 0.9, ease }}
        >
          {reachedLabel}
        </motion.p>
        <div className="overflow-hidden">
          <motion.h2
            className="display leading-[0.9] mt-2 pb-1"
            style={{ fontSize: `min(9rem, ${Math.min(24, 165 / (stop.name.length + 1)).toFixed(1)}vw)` }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ delay: 0.15, duration: 0.9, ease }}
          >
            {stop.name.toUpperCase()}.
          </motion.h2>
        </div>
        <motion.div
          className="mt-3 inline-flex items-center gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <span className="label bg-ink text-paper rounded-full px-3 py-1.5">
            {missionLabel} {String(level).padStart(2, "0")}
          </span>
          <span className="text-sm text-ink/70 max-w-[16rem] text-left">{stop.arrivalLine}</span>
        </motion.div>
      </div>
    </motion.button>
  );
}
