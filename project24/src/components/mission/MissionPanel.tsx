"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ApiError, preparePhoto, type Api } from "@/lib/api";
import type { PublicConfig, PublicGameState, PublicStop } from "@/game/types";

type Step = "riddle" | "capture" | "analyzing" | "success" | "retry";

export function MissionPanel({
  stop,
  level,
  ui,
  api,
  demoMode,
  verified,
  onVerified,
  onContinue,
  onSfx,
}: {
  stop: PublicStop;
  level: number;
  ui: PublicConfig["missionUi"];
  api: Api;
  demoMode: boolean;
  verified: boolean;
  onVerified: (s: PublicGameState) => void;
  onContinue: () => void;
  onSfx: (s: "tap" | "success" | "fail") => void;
}) {
  const [step, setStep] = useState<Step>(verified ? "success" : "riddle");
  const [file, setFile] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [detected, setDetected] = useState("");
  const [demoResult, setDemoResult] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const mission = stop.mission!;
  const n = String(level).padStart(2, "0");

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setError(null);
    if (!f.type.startsWith("image/") && !/\.(heic|heif|jpe?g|png|webp)$/i.test(f.name)) {
      setError("Eso no parece una foto.");
      return;
    }
    const blob = await preparePhoto(f);
    if (blob.size > 8 * 1024 * 1024) {
      setError("La foto es demasiado grande. Prueba con otra.");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(blob);
    setPreview(URL.createObjectURL(blob));
    setStep("capture");
  }

  async function send() {
    if (!file) return;
    onSfx("tap");
    setStep("analyzing");
    setError(null);
    const started = Date.now();
    try {
      const res = await api.verify(file);
      // let the analysis sequence breathe a little
      const wait = Math.max(0, 2600 - (Date.now() - started));
      await new Promise((r) => setTimeout(r, wait));
      setMessage(res.message);
      setDetected(res.detected_object);
      setDemoResult(Boolean(res.demo));
      if (res.valid) {
        setStep("success");
        onSfx("success");
        onVerified(res.state);
      } else {
        setStep("retry");
        onSfx("fail");
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Algo ha fallado. Inténtalo de nuevo.");
      setStep("capture");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="label text-accent">
          {ui.missionLabel} {n} · {stop.name}
        </p>
        {demoMode && <p className="label !text-[9px] text-ink/50 border border-ink/20 rounded-full px-2 py-0.5">Modo demo</p>}
      </div>

      <AnimatePresence mode="wait">
        {step === "riddle" && (
          <motion.div key="riddle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <h2 className="display text-4xl mt-3">{mission.title}</h2>
            <div className="mt-5 space-y-3 border-l-2 border-ink pl-4">
              {mission.riddle.map((l, i) => (
                <motion.p
                  key={i}
                  className="display italic text-[1.45rem] leading-[1.15] text-ink/85"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.35, duration: 0.6 }}
                >
                  {l}
                </motion.p>
              ))}
            </div>
            <div className="mt-7 rounded-2xl bg-snow border border-ink/10 p-4">
              <p className="label">{ui.findTitle}</p>
              <p className="text-sm text-ink/70 mt-1">{ui.findSubtitle}</p>
            </div>
            <UploadButtons ui={ui} cameraInput={cameraInput} galleryInput={galleryInput} primary />
          </motion.div>
        )}

        {step === "capture" && preview && (
          <motion.div key="capture" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="display text-3xl mt-3">{ui.uploadCta.charAt(0) + ui.uploadCta.slice(1).toLowerCase()}</p>
            <Evidence src={preview} />
            {error && <p className="mt-3 text-sm text-accent">{error}</p>}
            <div className="mt-5 grid grid-cols-[auto_1fr] gap-3">
              <button className="btn-ghost" onClick={() => cameraInput.current?.click()}>
                {ui.retake}
              </button>
              <button className="btn-primary" onClick={send}>
                {ui.send} <span aria-hidden>→</span>
              </button>
            </div>
          </motion.div>
        )}

        {step === "analyzing" && preview && (
          <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Analyzing src={preview} steps={ui.analyzing} />
          </motion.div>
        )}

        {step === "success" && (
          <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="relative mt-4 overflow-hidden rounded-2xl bg-ink text-paper p-6">
              <motion.div
                initial={{ scale: 2.2, rotate: -14, opacity: 0 }}
                animate={{ scale: 1, rotate: -6, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                className="inline-block border-2 border-paper rounded-md px-3 py-1.5"
              >
                <span className="label !text-[13px] !tracking-[0.22em]">{ui.successTitle}</span>
              </motion.div>
              <p className="display text-3xl mt-5 leading-tight">{message || "Correcto. Seguimos."}</p>
              {demoResult && (
                <p className="mt-4 text-xs text-paper/70 border-t border-paper/20 pt-3">
                  Modo demostración: la foto NO se ha analizado con IA (falta la clave de Anthropic en el servidor).
                </p>
              )}
              <Confetti />
            </div>
            <button className="btn-primary w-full mt-5" onClick={onContinue}>
              {ui.continueCta} <span aria-hidden>→</span>
            </button>
          </motion.div>
        )}

        {step === "retry" && (
          <motion.div key="retry" initial={{ opacity: 0, x: 0 }} animate={{ opacity: 1, x: [0, -8, 8, -4, 0] }} exit={{ opacity: 0 }}>
            <p className="label text-ink/50 mt-4">{ui.retryTitle}</p>
            <p className="display text-[2.2rem] leading-[1.05] mt-2">{ui.retryMessage}</p>
            <p className="mt-3 text-[15px] text-ink/75">{message}</p>
            {detected && (
              <p className="mt-2 label text-ink/45">
                Detectado: <span className="text-ink">{detected}</span>
              </p>
            )}
            <details className="mt-5 text-sm text-ink/70">
              <summary className="cursor-pointer label">Volver a leer la adivinanza</summary>
              <div className="mt-2 space-y-1 italic">
                {mission.riddle.map((l, i) => (
                  <p key={i}>{l}</p>
                ))}
              </div>
            </details>
            <UploadButtons ui={ui} cameraInput={cameraInput} galleryInput={galleryInput} primary />
          </motion.div>
        )}
      </AnimatePresence>

      {error && step === "riddle" && <p className="mt-3 text-sm text-accent">{error}</p>}

      <input ref={cameraInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPick} />
      <input ref={galleryInput} type="file" accept="image/*" className="hidden" onChange={onPick} />
    </div>
  );
}

function UploadButtons({
  ui,
  cameraInput,
  galleryInput,
  primary,
}: {
  ui: PublicConfig["missionUi"];
  cameraInput: React.RefObject<HTMLInputElement | null>;
  galleryInput: React.RefObject<HTMLInputElement | null>;
  primary?: boolean;
}) {
  return (
    <div className="mt-5">
      <button className={`${primary ? "btn-primary" : "btn-ghost"} w-full`} onClick={() => cameraInput.current?.click()}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
          <path d="M1.5 5h3l1.5-2h4l1.5 2h3v8.5h-13z" />
          <circle cx="8" cy="9" r="2.6" />
        </svg>
        {ui.uploadCta}
      </button>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <button className="btn-ghost" onClick={() => cameraInput.current?.click()}>
          {ui.takePhoto}
        </button>
        <button className="btn-ghost" onClick={() => galleryInput.current?.click()}>
          {ui.choosePhoto}
        </button>
      </div>
    </div>
  );
}

function Evidence({ src }: { src: string }) {
  return (
    <div className="mt-4 relative rounded-2xl overflow-hidden bg-ink/5 border border-ink/10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Tu prueba" className="w-full max-h-[38dvh] object-contain bg-ink/90" />
      <span className="absolute top-3 left-3 label !text-[9px] bg-paper/90 rounded-full px-2 py-1">Evidence #1</span>
    </div>
  );
}

function Analyzing({ src, steps }: { src: string; steps: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => Math.min(n + 1, steps.length - 1)), 1000);
    return () => clearInterval(id);
  }, [steps.length]);
  return (
    <div className="mt-4">
      <div className="relative rounded-2xl overflow-hidden bg-ink">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="w-full max-h-[34dvh] object-contain opacity-70 grayscale" />
        <motion.div
          className="absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-paper/40 to-transparent"
          animate={{ top: ["-20%", "100%"] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-3 border border-paper/40 rounded-xl" />
        {[
          "top-2 left-2 border-t-2 border-l-2",
          "top-2 right-2 border-t-2 border-r-2",
          "bottom-2 left-2 border-b-2 border-l-2",
          "bottom-2 right-2 border-b-2 border-r-2",
        ].map((c) => (
          <span key={c} className={`absolute size-6 border-paper ${c}`} />
        ))}
      </div>
      <div className="mt-5 space-y-2" aria-live="polite">
        {steps.map((s, k) => (
          <motion.p
            key={s}
            className={`label flex items-center gap-3 ${k <= i ? "text-ink" : "text-ink/25"}`}
            animate={{ opacity: k <= i ? 1 : 0.4 }}
          >
            <span className={`size-1.5 rounded-full ${k < i ? "bg-ink" : k === i ? "bg-accent animate-pulse" : "bg-ink/20"}`} />
            {s}
          </motion.p>
        ))}
      </div>
    </div>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 18 });
  const colors = ["#F3F0E9", "#B9B3A8", "#B4532A", "#FFFFFF"];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((_, i) => (
        <motion.span
          key={i}
          className="absolute block"
          style={{ left: `${(i * 53) % 100}%`, top: -10, width: i % 2 ? 6 : 3, height: i % 2 ? 3 : 10, background: colors[i % 4] }}
          initial={{ y: -20, rotate: 0, opacity: 1 }}
          animate={{ y: 260, rotate: (i % 2 ? 1 : -1) * 360, opacity: 0 }}
          transition={{ duration: 1.6 + (i % 5) * 0.25, delay: (i % 6) * 0.06, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
