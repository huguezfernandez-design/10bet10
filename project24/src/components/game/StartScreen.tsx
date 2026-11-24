"use client";

import { motion } from "motion/react";
import { Character } from "@/components/characters/Character";
import type { PublicConfig } from "@/game/types";

export function StartScreen({ config, onStart, busy }: { config: PublicConfig; onStart: () => void; busy: boolean }) {
  const { meta, start, stops } = config;
  const ease = [0.22, 1, 0.36, 1] as const;
  return (
    <motion.section
      className="grain fixed inset-0 z-40 bg-paper text-ink overflow-y-auto no-scrollbar"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ clipPath: "inset(0 0 100% 0)", transition: { duration: 1, ease: [0.76, 0, 0.24, 1] } }}
      style={{ clipPath: "inset(0 0 0% 0)" }}
    >
      <div className="relative min-h-dvh max-w-6xl mx-auto px-5 sm:px-10 pt-[max(1.25rem,env(safe-area-inset-top))] pb-10 flex flex-col">
        <header className="flex items-center justify-between label text-ink/60">
          <span>{meta.title}</span>
          <span>N.º 24 · {meta.year}</span>
        </header>

        <div className="flex-1 grid md:grid-cols-[1.25fr_1fr] gap-8 md:gap-14 items-center mt-8 md:mt-0">
          <div>
            <motion.p
              className="label text-accent"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8, ease }}
            >
              {start.kicker}
            </motion.p>
            <h1 className="display mt-4 text-[19vw] sm:text-[8.5rem] md:text-[10rem] leading-[0.8]">
              {meta.title.split(" ").map((w, i) => (
                <motion.span
                  key={i}
                  className="inline-block mr-[0.18em]"
                  initial={{ y: "60%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.12, duration: 1.1, ease }}
                >
                  {w}
                </motion.span>
              ))}
            </h1>
            <motion.p
              className="display italic text-[9vw] sm:text-5xl mt-3 text-ink/85"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75, duration: 1 }}
            >
              {meta.subtitle.charAt(0) + meta.subtitle.slice(1).toLowerCase()}
            </motion.p>

            <motion.div
              className="mt-8 border-t border-ink/15 pt-6 max-w-xl"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.9, ease }}
            >
              <p className="display text-2xl sm:text-3xl leading-tight">“{meta.tagline}”</p>
              <div className="mt-6 space-y-3 text-[15px] leading-relaxed text-ink/75">
                {start.body.map((line, i) => (
                  <p key={i} className={i === start.body.length - 1 ? "text-ink font-medium" : ""}>
                    {line}
                  </p>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="mt-9 flex items-center gap-5 sticky bottom-4 z-10 md:static"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4, duration: 0.8 }}
            >
              <button className="btn-primary shadow-[0_12px_30px_-10px_rgba(23,23,23,.5)] md:shadow-none" onClick={onStart} disabled={busy}>
                {start.cta}
                <span aria-hidden>→</span>
              </button>
              <span className="label text-ink/45 hidden sm:inline">≈ 15 min · móvil + cámara</span>
            </motion.div>
          </div>

          {/* Route ticket */}
          <motion.aside
            className="relative mx-auto md:mx-0 w-full max-w-sm"
            initial={{ opacity: 0, y: 30, rotate: 2 }}
            animate={{ opacity: 1, y: 0, rotate: -1.5 }}
            transition={{ delay: 0.9, duration: 1.2, ease }}
          >
            <div className="bg-snow shadow-[0_30px_60px_-30px_rgba(23,23,23,.35)] p-6 pb-5 border border-ink/10">
              <div className="flex items-center justify-between label text-ink/50">
                <span>Boarding pass</span>
                <span>Seat 24A</span>
              </div>
              <div className="flex items-end justify-between mt-5">
                <div>
                  <p className="label text-ink/40">From</p>
                  <p className="display text-5xl">{stops[0].name}</p>
                </div>
                <span className="display italic text-3xl text-ink/40 pb-1">→</span>
                <div className="text-right">
                  <p className="label text-ink/40">To</p>
                  <p className="display text-5xl">{stops[stops.length - 1].name}</p>
                </div>
              </div>
              <ol className="mt-6 border-t border-dashed border-ink/20 pt-4 space-y-2">
                {stops.map((s, i) => (
                  <li key={s.id} className="flex items-center gap-3 text-sm">
                    <span
                      className={`size-2.5 rounded-full border ${i === 0 ? "bg-ink border-ink" : "border-ink/40"}`}
                    />
                    <span className="flex-1">{i === stops.length - 1 ? "???" : s.name}</span>
                    <span className="label text-ink/40">{i === 0 ? "START" : s.levelLabel}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-5 flex items-end justify-between">
                <div className="flex gap-[3px] h-9 items-end" aria-hidden>
                  {Array.from({ length: 34 }).map((_, i) => (
                    <span key={i} className="bg-ink" style={{ width: i % 3 === 0 ? 2 : 1, height: `${60 + ((i * 37) % 40)}%` }} />
                  ))}
                </div>
                <div className="-mb-3 -mr-2">
                  <Character variant="her" pose="idle" size={118} />
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </motion.section>
  );
}
