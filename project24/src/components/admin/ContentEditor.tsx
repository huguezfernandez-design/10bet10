"use client";

import { useEffect, useState } from "react";
import { AdminNav } from "./AdminDashboard";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Json = any;

const LABELS: Record<string, string> = {
  meta: "Título y metadatos",
  theme: "Colores",
  start: "Pantalla de inicio",
  briefing: "Briefing en Gijón",
  stops: "Ciudades y niveles (en orden)",
  missionUi: "Textos de misión",
  madrid: "Llegada a Madrid",
  finale: "Final",
  avatars: "Avatares",
  gifts: "Resultados finales (secreto)",
  scoring: "Puntuación (secreto)",
  title: "Título",
  subtitle: "Subtítulo",
  tagline: "Lema",
  place: "Lugar",
  year: "Año",
  kicker: "Antetítulo",
  body: "Texto",
  cta: "Botón",
  lines: "Líneas",
  name: "Nombre",
  region: "Región",
  lon: "Longitud",
  lat: "Latitud",
  scene: "Escenario (coast · cathedral · plaza · aqueduct · capital · village)",
  levelLabel: "Etiqueta de nivel",
  travelQuip: "Comentario durante el viaje",
  arrivalLine: "Frase de llegada",
  mission: "Prueba física",
  riddle: "Adivinanza",
  expectedObject: "Objeto esperado",
  acceptable: "Alternativas aceptables",
  rejectExamples: "Objetos parecidos que NO valen",
  successMessage: "Mensaje de éxito",
  errorMessage: "Mensaje de error",
  question: "Pregunta",
  prompt: "Enunciado",
  options: "Respuestas",
  text: "Texto",
  points: "Puntos por categoría",
  headline: "Titular",
  signoff: "Cierre",
  image: "Imagen (URL o subida)",
  art: "Ilustración",
  palette: "Paleta",
  layout: "Composición",
  tieBreakOrder: "Orden de desempate",
  meeting: "Diálogo del encuentro",
  speaker: "Quién habla (her · him · narrator)",
  images: "Imágenes por pose (idle, walking, celebrating, surprised, happy, greeting)",
};

const humanize = (k: string) => LABELS[k] ?? k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
const isColor = (v: unknown) => typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v);
const isImageKey = (k: string) => /image|url/i.test(k);

function setIn(obj: Json, path: (string | number)[], value: Json): Json {
  if (path.length === 0) return value;
  const [h, ...rest] = path;
  const copy = Array.isArray(obj) ? [...obj] : { ...obj };
  copy[h as any] = setIn(obj?.[h as any], rest, value);
  return copy;
}

export function ContentEditor() {
  const [cfg, setCfg] = useState<Json | null>(null);
  const [defaults, setDefaults] = useState<Json | null>(null);
  const [mode, setMode] = useState<"form" | "json">("form");
  const [jsonText, setJsonText] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; msg: string; errors?: string[] } | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetch("/api/admin/config", { cache: "no-store" }).then(async (r) => {
      if (r.status === 401) return location.reload();
      const j = await r.json();
      setCfg(j.config);
      setDefaults(j.defaults);
      setJsonText(JSON.stringify(j.config, null, 2));
    });
  }, []);

  const update = (path: (string | number)[], v: Json) => {
    setCfg((c: Json) => {
      const next = setIn(c, path, v);
      setJsonText(JSON.stringify(next, null, 2));
      return next;
    });
    setDirty(true);
  };

  async function save() {
    let body = cfg;
    if (mode === "json") {
      try {
        body = JSON.parse(jsonText);
      } catch {
        setStatus({ ok: false, msg: "El JSON no es válido." });
        return;
      }
    }
    const r = await fetch("/api/admin/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config: body }),
    });
    const j = await r.json();
    if (r.ok) {
      setCfg(body);
      setDirty(false);
      setStatus({ ok: true, msg: "Guardado. Los cambios se aplican al recargar el juego." });
    } else setStatus({ ok: false, msg: "No se ha guardado:", errors: j.errors });
  }

  async function restore() {
    if (!confirm("¿Restaurar todo el contenido a los valores del archivo src/content/default-config.ts?")) return;
    await fetch("/api/admin/config", { method: "DELETE" });
    setCfg(defaults);
    setJsonText(JSON.stringify(defaults, null, 2));
    setDirty(false);
    setStatus({ ok: true, msg: "Restaurado al contenido por defecto." });
  }

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 pb-32">
      <AdminNav active="content" />
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="display text-4xl">Contenido</h1>
          <p className="text-sm text-ink/60 mt-1">
            Todo lo que se ve en el juego. Las secciones marcadas como secreto nunca llegan al navegador del jugador.
          </p>
        </div>
        <div className="flex gap-2">
          <button className={`btn-ghost ${mode === "form" ? "!bg-ink !text-paper" : ""}`} onClick={() => setMode("form")}>
            Formulario
          </button>
          <button
            className={`btn-ghost ${mode === "json" ? "!bg-ink !text-paper" : ""}`}
            onClick={() => {
              setJsonText(JSON.stringify(cfg, null, 2));
              setMode("json");
            }}
          >
            JSON
          </button>
        </div>
      </div>

      {!cfg && <p className="mt-8 text-sm text-ink/50">Cargando…</p>}

      {cfg && mode === "form" && (
        <div className="mt-6 space-y-3">
          {Object.keys(cfg).map((k) => (
            <details key={k} className="rounded-3xl border border-ink/10 bg-snow" open={k === "stops"}>
              <summary className="cursor-pointer px-5 py-4 flex items-center justify-between">
                <span className="display text-2xl">{humanize(k)}</span>
                <span className="label text-ink/40">{k}</span>
              </summary>
              <div className="px-5 pb-5">
                <Field k={k} value={cfg[k]} path={[k]} onChange={update} />
              </div>
            </details>
          ))}
        </div>
      )}

      {cfg && mode === "json" && (
        <textarea
          value={jsonText}
          onChange={(e) => {
            setJsonText(e.target.value);
            setDirty(true);
          }}
          spellCheck={false}
          className="mt-6 w-full h-[70vh] rounded-3xl border border-ink/15 bg-snow p-5 font-mono text-xs outline-none focus:border-ink"
        />
      )}

      <div className="fixed bottom-0 inset-x-0 bg-paper/95 backdrop-blur border-t border-ink/10">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-3 flex flex-wrap items-center gap-3">
          <button className="btn-primary" onClick={save} disabled={!cfg}>
            Guardar cambios
          </button>
          <button className="btn-ghost" onClick={restore}>
            Restaurar por defecto
          </button>
          {dirty && <span className="label text-accent">Cambios sin guardar</span>}
          {status && (
            <div className={`text-sm ${status.ok ? "text-ink/70" : "text-accent"}`}>
              {status.msg}
              {status.errors && (
                <ul className="list-disc ml-5">
                  {status.errors.slice(0, 6).map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  k,
  value,
  path,
  onChange,
}: {
  k: string;
  value: Json;
  path: (string | number)[];
  onChange: (p: (string | number)[], v: Json) => void;
}) {
  const input = "w-full rounded-xl border border-ink/15 bg-paper px-3 py-2 text-sm outline-none focus:border-ink";

  if (typeof value === "string") {
    if (isColor(value)) {
      return (
        <div className="flex items-center gap-2">
          <input type="color" value={value} onChange={(e) => onChange(path, e.target.value)} className="h-9 w-12 rounded border border-ink/15" />
          <input className={input} value={value} onChange={(e) => onChange(path, e.target.value)} />
        </div>
      );
    }
    if (isImageKey(k) || path.includes("images")) {
      return <ImageField value={value} onChange={(v) => onChange(path, v)} className={input} />;
    }
    return value.length > 70 ? (
      <textarea className={input + " min-h-20"} value={value} onChange={(e) => onChange(path, e.target.value)} />
    ) : (
      <input className={input} value={value} onChange={(e) => onChange(path, e.target.value)} />
    );
  }
  if (typeof value === "number") {
    return <input type="number" step="any" className={input} value={value} onChange={(e) => onChange(path, Number(e.target.value))} />;
  }
  if (typeof value === "boolean") {
    return <input type="checkbox" checked={value} onChange={(e) => onChange(path, e.target.checked)} />;
  }
  if (Array.isArray(value)) {
    const primitive = value.every((v) => typeof v !== "object");
    return (
      <div className="space-y-2">
        {value.map((item, i) => (
          <div key={i} className={primitive ? "flex gap-2 items-start" : "rounded-2xl border border-ink/10 p-4"}>
            {!primitive && (
              <div className="flex items-center justify-between mb-3">
                <span className="label text-ink/50">
                  #{i + 1} {typeof item?.name === "string" ? `· ${item.name}` : typeof item?.text === "string" ? `· ${item.text.slice(0, 40)}` : ""}
                </span>
                <ArrayButtons value={value} i={i} path={path} onChange={onChange} />
              </div>
            )}
            <div className="flex-1">
              <Field k={k} value={item} path={[...path, i]} onChange={onChange} />
            </div>
            {primitive && <ArrayButtons value={value} i={i} path={path} onChange={onChange} />}
          </div>
        ))}
        <button
          className="label border border-dashed border-ink/25 rounded-full px-3 py-2"
          onClick={() => onChange(path, [...value, value.length ? structuredClone(value[value.length - 1]) : ""])}
        >
          + Añadir
        </button>
      </div>
    );
  }
  if (value && typeof value === "object") {
    const isPoints = k === "points";
    return (
      <div className={isPoints ? "grid grid-cols-2 sm:grid-cols-4 gap-2" : "space-y-4"}>
        {Object.keys(value).map((key) => (
          <div key={key} className="block">
            <span className="label text-ink/55 block mb-1.5">{isPoints ? key : humanize(key)}</span>
            <Field k={key} value={value[key]} path={[...path, key]} onChange={onChange} />
          </div>
        ))}
        {(isPoints || k === "images" || k === "gifts") && (
          <AddKey
            onAdd={(name) =>
              onChange([...path, name], isPoints ? 0 : k === "gifts" ? structuredClone(Object.values(value)[0] ?? {}) : "")
            }
          />
        )}
      </div>
    );
  }
  return <span className="text-xs text-ink/40">(vacío)</span>;
}

function ArrayButtons({
  value,
  i,
  path,
  onChange,
}: {
  value: Json[];
  i: number;
  path: (string | number)[];
  onChange: (p: (string | number)[], v: Json) => void;
}) {
  const move = (d: number) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(path, next);
  };
  const b = "size-8 grid place-items-center rounded-full border border-ink/15 text-xs hover:bg-ink/5";
  return (
    <div className="flex gap-1 shrink-0">
      <button className={b} onClick={() => move(-1)} aria-label="Subir">
        ↑
      </button>
      <button className={b} onClick={() => move(1)} aria-label="Bajar">
        ↓
      </button>
      <button className={b + " text-accent"} onClick={() => onChange(path, value.filter((_, k) => k !== i))} aria-label="Eliminar">
        ✕
      </button>
    </div>
  );
}

function AddKey({ onAdd }: { onAdd: (k: string) => void }) {
  const [k, setK] = useState("");
  return (
    <div className="flex gap-2 items-end">
      <input value={k} onChange={(e) => setK(e.target.value)} placeholder="nueva clave" className="rounded-xl border border-ink/15 bg-paper px-3 py-2 text-sm w-32" />
      <button
        className="label border border-dashed border-ink/25 rounded-full px-3 py-2"
        onClick={() => {
          if (k.trim()) onAdd(k.trim());
          setK("");
        }}
      >
        + Añadir
      </button>
    </div>
  );
}

function ImageField({ value, onChange, className }: { value: string; onChange: (v: string) => void; className: string }) {
  async function upload(f: File) {
    const bmp = await createImageBitmap(f);
    const k = Math.min(1, 1400 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * k);
    c.height = Math.round(bmp.height * k);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    const isPng = f.type === "image/png";
    onChange(c.toDataURL(isPng ? "image/png" : "image/jpeg", 0.85));
  }
  return (
    <div className="flex gap-2 items-center">
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="size-10 rounded-lg object-cover border border-ink/10" />
      )}
      <input className={className} value={value.startsWith("data:") ? "(imagen subida)" : value} placeholder="https://… o sube una imagen" onChange={(e) => onChange(e.target.value)} />
      <label className="label border border-ink/20 rounded-full px-3 py-2 cursor-pointer whitespace-nowrap">
        Subir
        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      </label>
      {value && (
        <button className="label text-accent" onClick={() => onChange("")}>
          Quitar
        </button>
      )}
    </div>
  );
}
