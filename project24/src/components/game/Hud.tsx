"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { PublicStop } from "@/game/types";

export function Hud({
  title,
  stops,
  reached,
  current,
  soundOn,
  onToggleSound,
  demo,
}: {
  title: string;
  stops: PublicStop[];
  reached: number; // highest stop index reached
  current: number;
  soundOn: boolean;
  onToggleSound: () => void;
  demo: boolean;
}) {
  return (
    <header className="pointer-events-none fixed top-0 inset-x-0 z-30 px-3 sm:px-5 pt-[max(.75rem,env(safe-area-inset-top))]">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-paper/90 backdrop-blur-md border border-ink/10 pl-4 pr-1.5 py-1.5 shadow-[0_8px_30px_-12px_rgba(23,23,23,.25)]">
        <span className="label text-ink whitespace-nowrap">{title}</span>
        {demo && <span className="label !text-[9px] bg-accent text-snow rounded-full px-2 py-0.5">DEMO</span>}
        <ol className="flex-1 flex items-center justify-end sm:justify-center gap-0 min-w-0" aria-label="Progreso">
          {stops.map((s, i) => (
            <li key={s.id} className="flex items-center">
              {i > 0 && (
                <span className={`h-px w-3 sm:w-8 ${i <= reached ? "bg-ink" : "bg-ink/20"}`} />
              )}
              <span
                title={s.name}
                className={`grid place-items-center rounded-full transition-all ${
                  i === current
                    ? "size-5 bg-accent text-snow"
                    : i <= reached
                      ? "size-2.5 bg-ink"
                      : "size-2.5 border border-ink/30"
                }`}
              >
                {i === current && <span className="text-[8px] font-mono">{i === 0 ? "S" : i}</span>}
              </span>
              <span className="sr-only">{s.name}</span>
            </li>
          ))}
        </ol>
        <button
          onClick={onToggleSound}
          className="label !text-[9px] rounded-full border border-ink/15 px-3 py-2 hover:bg-ink/5 whitespace-nowrap"
          aria-pressed={soundOn}
        >
          {soundOn ? "SOUND ON" : "SOUND OFF"}
        </button>
      </div>
    </header>
  );
}

export function MapControls({
  onZoomIn,
  onZoomOut,
  onRecenter,
  showRecenter,
  compactHidden,
}: {
  compactHidden?: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRecenter: () => void;
  showRecenter: boolean;
}) {
  const btn =
    "size-10 grid place-items-center rounded-full bg-paper/90 backdrop-blur border border-ink/10 text-ink shadow-sm hover:bg-snow active:scale-95 transition";
  return (
    <div
      className={`fixed left-3 sm:left-5 top-[calc(max(.75rem,env(safe-area-inset-top))+64px)] z-20 flex-col gap-2 ${
        compactHidden ? "hidden min-[900px]:flex" : "flex"
      }`}
    >
      <button className={btn} onClick={onZoomIn} aria-label="Acercar">
        <svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" /></svg>
      </button>
      <button className={btn} onClick={onZoomOut} aria-label="Alejar">
        <svg width="14" height="14" viewBox="0 0 14 14"><path d="M1 7h12" stroke="currentColor" strokeWidth="1.5" /></svg>
      </button>
      <AnimatePresence>
        {showRecenter && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={btn}
            onClick={onRecenter}
            aria-label="Centrar"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <circle cx="8" cy="8" r="3" />
              <path d="M8 0v3M8 13v3M0 8h3M13 8h3" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Bottom sheet on phones, right-hand panel on desktop. Reports its footprint so the camera can avoid it. */
export function Panel({
  children,
  onInsets,
  panelKey,
}: {
  children: React.ReactNode;
  onInsets: (i: { bottom: number; right: number }) => void;
  panelKey: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onInsets);
  cb.current = onInsets;
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const report = () => {
      const desktop = window.innerWidth >= 900;
      cb.current(desktop ? { bottom: 0, right: el.offsetWidth + 24 } : { bottom: Math.min(el.offsetHeight, window.innerHeight * 0.7), right: 0 });
    };
    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    window.addEventListener("resize", report);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", report);
    };
  }, []);
  useEffect(() => () => cb.current({ bottom: 0, right: 0 }), []);

  return (
    <motion.div
      ref={ref}
      key={panelKey}
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed z-20 inset-x-0 bottom-0 max-h-[78dvh] min-[900px]:inset-x-auto min-[900px]:right-6 min-[900px]:top-24 min-[900px]:bottom-auto min-[900px]:w-[440px] min-[900px]:max-h-[calc(100dvh-8rem)]"
    >
      <div className="max-h-[inherit] overflow-y-auto no-scrollbar rounded-t-[28px] min-[900px]:rounded-[28px] bg-paper border border-ink/10 shadow-[0_-20px_60px_-20px_rgba(23,23,23,.35)] px-5 sm:px-7 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ink/15 min-[900px]:hidden" />
        {children}
      </div>
    </motion.div>
  );
}

export function TravelBanner({ from, to, quip, km, progress }: { from: string; to: string; quip: string; km: number; progress: number }) {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -20, opacity: 0 }}
      className="fixed z-20 left-1/2 -translate-x-1/2 top-[calc(max(.75rem,env(safe-area-inset-top))+60px)] w-[min(92vw,520px)]"
    >
      <div className="rounded-2xl bg-ink text-paper px-5 py-4 shadow-xl">
        <div className="flex items-center justify-between label text-paper/60">
          <span>En ruta</span>
          <span className="tabular-nums">{Math.round(km * progress)} / {km} km</span>
        </div>
        <p className="display text-3xl mt-1">
          {from} <span className="italic text-paper/50">→</span> {to}
        </p>
        {quip && <p className="text-sm text-paper/75 mt-1.5">{quip}</p>}
        <div className="mt-3 h-[2px] bg-paper/15 overflow-hidden rounded-full">
          <div className="h-full bg-paper origin-left" style={{ transform: `scaleX(${progress})` }} />
        </div>
      </div>
    </motion.div>
  );
}

/** Line-by-line dialogue with a typewriter feel. Tap to advance. */
export function Dialogue({
  lines,
  onDone,
  doneLabel,
  speakerLabel,
}: {
  lines: { who: string; text: string }[];
  onDone: () => void;
  doneLabel: string;
  speakerLabel?: string;
}) {
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState(0);
  const line = lines[i];
  useEffect(() => {
    setTyped(0);
    const id = setInterval(() => setTyped((n) => (n >= line.text.length ? n : n + 2)), 22);
    return () => clearInterval(id);
  }, [i, line.text]);
  const complete = typed >= line.text.length;
  const last = i === lines.length - 1;
  const next = () => {
    if (!complete) return setTyped(line.text.length);
    if (!last) setI(i + 1);
  };
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="label text-ink/50">{speakerLabel ?? line.who}</p>
        <p className="label text-ink/30 tabular-nums">
          {i + 1}/{lines.length}
        </p>
      </div>
      <button onClick={next} className="block w-full text-left mt-3 min-h-[6.5rem]" aria-live="polite">
        <span className="display text-[2rem] leading-[1.05]">
          {line.text.slice(0, typed)}
          <span className="opacity-0">{line.text.slice(typed)}</span>
        </span>
      </button>
      <div className="mt-5 flex items-center justify-between">
        <div className="flex gap-1.5">
          {lines.map((_, k) => (
            <span key={k} className={`h-1 rounded-full transition-all ${k <= i ? "w-6 bg-ink" : "w-2 bg-ink/20"}`} />
          ))}
        </div>
        {last && complete ? (
          <button className="btn-primary" onClick={onDone}>
            {doneLabel} <span aria-hidden>→</span>
          </button>
        ) : (
          <button className="btn-ghost" onClick={next}>
            Siguiente
          </button>
        )}
      </div>
    </div>
  );
}
