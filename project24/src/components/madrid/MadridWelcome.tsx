"use client";

import { motion } from "motion/react";
import { Character } from "@/components/characters/Character";
import type { PublicConfig } from "@/game/types";

/** Editorial reward screen: both characters together in Madrid. No gift yet. */
export function MadridWelcome({ config, onContinue, busy }: { config: PublicConfig; onContinue: () => void; busy: boolean }) {
  const { madrid, meta, avatars } = config;
  const ease = [0.22, 1, 0.36, 1] as const;
  return (
    <motion.section
      className="grain fixed inset-0 z-40 bg-paper overflow-y-auto no-scrollbar"
      initial={{ clipPath: "circle(0% at 50% 60%)" }}
      animate={{ clipPath: "circle(150% at 50% 60%)" }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.3, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="min-h-dvh max-w-5xl mx-auto px-5 sm:px-10 pt-[max(1.25rem,env(safe-area-inset-top))] pb-8 flex flex-col">
        <header className="flex justify-between label text-ink/55">
          <span>{madrid.reached}</span>
          <span>40.4168° N · 3.7038° W</span>
        </header>

        <div className="flex-1 grid md:grid-cols-2 items-center gap-6 mt-6">
          <div>
            <motion.h1
              className="display text-[17vw] md:text-[7.5rem] leading-[0.82]"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 1, ease }}
            >
              {madrid.welcomeTitle}
            </motion.h1>
            <motion.p
              className="display italic text-3xl sm:text-4xl mt-6 text-ink/80 max-w-md leading-tight"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3, duration: 1 }}
            >
              {madrid.line}
            </motion.p>
          </div>

          <motion.div
            className="relative mx-auto w-full max-w-sm aspect-[4/5]"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, duration: 1.2, ease }}
          >
            <div className="absolute inset-0 rounded-t-full bg-[#E7E0D1] overflow-hidden">
              {/* Madrid skyline silhouette */}
              <svg viewBox="0 0 300 375" className="absolute inset-x-0 bottom-0 w-full" aria-hidden>
                <path d="M0 300 h300 v75 h-300z" fill="#D9D0BE" />
                <g fill="#CFC5B1">
                  <rect x="30" y="150" width="22" height="150" />
                  <rect x="62" y="130" width="22" height="170" />
                  <rect x="214" y="140" width="22" height="160" />
                  <path d="M246 300 v-150 q11 -14 22 0 v150z" />
                </g>
                <path d="M110 300 v-60 h80 v60z" fill="#E3DACA" />
                <path d="M120 240 q30 -40 60 0z" fill="#BDB29C" />
                <path d="M60 300 v-34 h180 v34z" fill="#F1EADB" />
                {[90, 150, 210].map((x) => (
                  <path key={x} d={`M${x - 12} 300 v-16 q12 -16 24 0 v16z`} fill="#B9AE98" />
                ))}
                <circle cx="230" cy="90" r="26" fill="#F3F0E9" opacity=".7" />
              </svg>
            </div>
            <div className="absolute inset-x-0 bottom-6 flex justify-center items-end gap-1">
              <motion.div initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 1.4, duration: 0.9, ease }}>
                <Character variant="her" pose="happy" size={200} art={avatars.her} />
              </motion.div>
              <motion.div initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 1.7, duration: 0.9, ease }}>
                <Character variant="him" pose="greeting" facing="left" size={200} art={avatars.him} />
              </motion.div>
            </div>
          </motion.div>
        </div>

        <footer className="mt-8 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 border-t border-ink/15 pt-5">
          <div>
            <p className="display text-3xl leading-none">{meta.title}</p>
            <p className="label text-ink/55 mt-2">
              {meta.place} · {meta.year}
            </p>
          </div>
          <motion.button
            className="btn-primary"
            onClick={onContinue}
            disabled={busy}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2 }}
          >
            {madrid.finalMissionCta} <span aria-hidden>→</span>
          </motion.button>
        </footer>
      </div>
    </motion.section>
  );
}
