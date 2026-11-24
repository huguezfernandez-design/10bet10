"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Character } from "@/components/characters/Character";
import { ApiError, type Api } from "@/lib/api";
import type { PublicConfig, RevealPayload } from "@/game/types";

type Step = "made" | "suspense" | "reveal" | "dedication";

export function Finale({ config, api, onSfx }: { config: PublicConfig; api: Api; onSfx: (s: "reveal" | "whoosh" | "tap") => void }) {
  const { finale, meta, avatars } = config;
  const [step, setStep] = useState<Step>("made");
  const [shown, setShown] = useState(0);
  const [reveal, setReveal] = useState<RevealPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ease = [0.22, 1, 0.36, 1] as const;

  // reveal lines one by one
  useEffect(() => {
    if (step !== "made") return;
    if (shown >= finale.lines.length) return;
    const t = setTimeout(() => setShown((n) => n + 1), shown === 0 ? 1300 : 1600);
    return () => clearTimeout(t);
  }, [shown, step, finale.lines.length]);

  // suspense, while fetching the result in parallel
  useEffect(() => {
    if (step !== "suspense") return;
    let alive = true;
    const minDelay = new Promise((r) => setTimeout(r, finale.suspense.length * 1300 + 400));
    Promise.all([api.result(), minDelay])
      .then(([r]) => {
        if (!alive) return;
        setReveal(r.reveal);
        setStep("reveal");
        onSfx("reveal");
      })
      .catch((e) => alive && setError(e instanceof ApiError ? e.message : "Algo ha fallado."));
    return () => {
      alive = false;
    };
  }, [step, api, finale.suspense.length, onSfx]);

  return (
    <div className="fixed inset-0 z-50">
      <AnimatePresence mode="wait">
        {step === "made" && (
          <motion.section
            key="made"
            className="grain absolute inset-0 bg-paper overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6 } }}
          >
            <div className="min-h-dvh max-w-4xl mx-auto px-6 sm:px-10 py-[max(2rem,env(safe-area-inset-top))] flex flex-col justify-center">
              <p className="label text-ink/55">{meta.title} · Final report</p>
              <div className="overflow-hidden mt-3">
                <motion.h1
                  className="display text-[22vw] sm:text-[10rem] leading-[0.82]"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 1.1, ease }}
                >
                  {finale.title}
                </motion.h1>
              </div>
              <div className="mt-8 space-y-4 max-w-xl">
                {finale.lines.slice(0, shown).map((l, i) => (
                  <motion.p
                    key={i}
                    className={`display leading-tight ${i === 0 ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl text-ink/75"}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease }}
                  >
                    {l}
                  </motion.p>
                ))}
              </div>
              <div className="mt-10 h-14">
                {shown >= finale.lines.length && (
                  <motion.button
                    className="btn-primary"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => {
                      onSfx("whoosh");
                      setStep("suspense");
                    }}
                  >
                    {finale.cta} <span aria-hidden>→</span>
                  </motion.button>
                )}
              </div>
            </div>
          </motion.section>
        )}

        {step === "suspense" && (
          <motion.section
            key="suspense"
            className="absolute inset-0 bg-ink text-paper grid place-items-center px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
          >
            <Suspense lines={finale.suspense} error={error} onRetry={() => setError(null)} />
          </motion.section>
        )}

        {step === "reveal" && reveal && (
          <motion.section
            key="reveal"
            className="absolute inset-0 overflow-y-auto"
            style={{ background: reveal.palette.bg, color: reveal.palette.fg }}
            initial={{ clipPath: "inset(50% 0 50% 0)" }}
            animate={{ clipPath: "inset(0% 0 0% 0)" }}
            transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
          >
            <RevealView
              r={reveal}
              meta={meta}
              avatars={avatars}
              nextLabel={finale.dedication?.button}
              onNext={
                finale.dedication?.lines?.length
                  ? () => {
                      onSfx("tap");
                      setStep("dedication");
                    }
                  : undefined
              }
            />
          </motion.section>
        )}

        {step === "dedication" && finale.dedication && (
          <motion.section
            key="dedication"
            className="absolute inset-0 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.4 }}
          >
            <Dedication d={finale.dedication} meta={meta} avatars={avatars} />
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

function Suspense({ lines, error, onRetry }: { lines: string[]; error: string | null; onRetry: () => void }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => Math.min(n + 1, lines.length - 1)), 1300);
    return () => clearInterval(id);
  }, [lines.length]);
  return (
    <div className="w-full max-w-md text-center">
      <div className="relative mx-auto size-40">
        <motion.svg viewBox="0 0 100 100" className="absolute inset-0" animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }}>
          <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeOpacity=".2" strokeDasharray="1 4" />
        </motion.svg>
        <motion.svg viewBox="0 0 100 100" className="absolute inset-0" animate={{ rotate: -360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
          <path d="M50 4 A46 46 0 0 1 96 50" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </motion.svg>
        <span className="absolute inset-0 grid place-items-center display text-6xl">24</span>
      </div>
      <div className="h-10 mt-10">
        <AnimatePresence mode="wait">
          <motion.p
            key={error ?? lines[i]}
            className="label !text-[12px]"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            {error ?? lines[i]}
          </motion.p>
        </AnimatePresence>
      </div>
      {error && (
        <button className="btn-ghost !border-paper/30 mt-4" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );
}

function RevealView({
  r,
  meta,
  avatars,
  onNext,
  nextLabel,
}: {
  r: RevealPayload;
  meta: PublicConfig["meta"];
  avatars: PublicConfig["avatars"];
  onNext?: () => void;
  nextLabel?: string;
}) {
  const ease = [0.22, 1, 0.36, 1] as const;
  const art = r.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={r.image} alt="" className="w-full h-full object-cover" />
  ) : (
    <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: r.art }} />
  );

  const head = (
    <>
      <motion.p className="label" style={{ color: r.palette.accent }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}>
        {r.kicker}:
      </motion.p>
      <div className="overflow-hidden">
        <motion.h1
          className="display text-[17vw] sm:text-[8rem] leading-[0.84] mt-2"
          initial={{ y: "105%" }}
          animate={{ y: 0 }}
          transition={{ delay: 1.3, duration: 1.1, ease }}
        >
          {r.headline}
        </motion.h1>
      </div>
    </>
  );
  const body = (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.1, duration: 1, ease }}>
      <div className="space-y-3 text-lg leading-relaxed opacity-85 max-w-md">
        {r.body.map((b, i) => (
          <p key={i}>{b}</p>
        ))}
      </div>
      <p className="display italic text-2xl mt-6" style={{ color: r.palette.accent }}>
        {r.signoff}
      </p>
    </motion.div>
  );
  const artBlock = (cls: string) => (
    <motion.div
      className={cls}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.6, duration: 1.4, ease }}
    >
      {art}
    </motion.div>
  );
  const footer = (
    <motion.footer
      className="mt-10 pt-5 flex items-end justify-between gap-4"
      style={{ borderTop: `1px solid ${r.palette.fg}26` }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2.8 }}
    >
      <div>
        <p className="display text-2xl leading-none">{meta.title}</p>
        <p className="label opacity-60 mt-2">
          {meta.place} · {meta.year}
        </p>
        {onNext && (
          <motion.button
            onClick={onNext}
            className="mt-5 inline-flex items-center gap-3 rounded-full px-5 py-3 label !text-[11px]"
            style={{ border: `1px solid ${r.palette.fg}55` }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 4.5, duration: 0.8 }}
          >
            {nextLabel || "UNA ÚLTIMA COSA"} <span aria-hidden>→</span>
          </motion.button>
        )}
      </div>
      <div className="flex items-end -mb-2">
        <Character variant="her" pose="celebrating" size={96} art={avatars.her} />
        <Character variant="him" pose="happy" facing="left" size={96} art={avatars.him} />
      </div>
    </motion.footer>
  );

  const wrap = "min-h-dvh max-w-6xl mx-auto px-6 sm:px-10 pt-[max(2rem,env(safe-area-inset-top))] pb-8 flex flex-col";

  switch (r.layout) {
    case "split":
      return (
        <div className={wrap}>
          <div className="flex-1 grid md:grid-cols-2 gap-8 items-center">
            <div>
              {head}
              <div className="mt-8">{body}</div>
            </div>
            {artBlock("aspect-[4/5] w-full max-w-sm mx-auto")}
          </div>
          {footer}
        </div>
      );
    case "poster":
      return (
        <div className={wrap + " text-center items-center"}>
          {artBlock("w-full max-w-xs aspect-[4/5]")}
          <div className="mt-4">{head}</div>
          <div className="mt-6 flex justify-center">{body}</div>
          <div className="w-full">{footer}</div>
        </div>
      );
    case "frame":
      return (
        <div className={wrap}>
          <div className="flex-1 border p-5 sm:p-10 grid md:grid-cols-[1fr_1.1fr] gap-8 items-center" style={{ borderColor: `${r.palette.accent}66` }}>
            {artBlock("aspect-[4/5] w-full max-w-xs mx-auto")}
            <div>
              {head}
              <div className="mt-8">{body}</div>
            </div>
          </div>
          {footer}
        </div>
      );
    default:
      return (
        <div className={wrap}>
          <div>{head}</div>
          <div className="flex-1 grid md:grid-cols-[1fr_1fr] gap-8 items-end mt-8">
            <div>{body}</div>
            {artBlock("aspect-[4/5] w-full max-w-sm mx-auto md:ml-auto")}
          </div>
          {footer}
        </div>
      );
  }
}

function Dedication({
  d,
  meta,
  avatars,
}: {
  d: PublicConfig["finale"]["dedication"];
  meta: PublicConfig["meta"];
  avatars: PublicConfig["avatars"];
}) {
  const ease = [0.22, 1, 0.36, 1] as const;
  const start = 0.9;
  const step = 1.7;
  const end = start + d.lines.length * step;
  return (
    <div className="grain relative min-h-dvh bg-paper text-ink flex flex-col items-center justify-center px-7 py-[max(2.5rem,env(safe-area-inset-top))] text-center">
      <motion.div
        className="absolute inset-4 sm:inset-8 border border-ink/10 pointer-events-none"
        initial={{ opacity: 0, scale: 1.02 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.6, ease }}
      />
      <motion.p className="label text-accent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 1 }}>
        {d.kicker}
      </motion.p>

      <div className="mt-8 max-w-3xl space-y-3 sm:space-y-5">
        {d.lines.map((l, i) => {
          const last = i === d.lines.length - 1;
          return (
            <div key={i} className="overflow-hidden">
              <motion.p
                className={`display leading-[0.95] ${
                  i === 0 ? "text-[13vw] sm:text-[6.5rem]" : last ? "italic text-[11vw] sm:text-[5.5rem] text-accent" : "italic text-[8vw] sm:text-[3.6rem] text-ink/80"
                }`}
                initial={{ y: "105%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: start + i * step, duration: 1.3, ease }}
              >
                {l}
              </motion.p>
            </div>
          );
        })}
      </div>

      <motion.div
        className="mt-10 flex items-end justify-center"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: end, duration: 1.2, ease }}
      >
        <Character variant="her" pose="happy" size={150} art={avatars.her} />
        <div className="-ml-3">
          <Character variant="him" pose="happy" facing="left" size={150} art={avatars.him} />
        </div>
      </motion.div>

      <motion.p
        className="label text-ink/45 mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: end + 0.8, duration: 1 }}
      >
        {meta.title} · {meta.place} · {meta.year}
      </motion.p>
    </div>
  );
}
