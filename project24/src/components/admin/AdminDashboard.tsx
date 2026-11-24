"use client";

import { useCallback, useEffect, useState } from "react";

interface Mission {
  status: string;
  attempts: number;
  failures: number;
  errors: number;
  verifiedBy?: string;
  lastDetected?: string;
}
interface Game {
  id: string;
  token: string;
  label: string;
  createdAt: string;
  updatedAt: string;
  data: {
    stage: string;
    level: number;
    missions: Mission[];
    answers: { level: number; optionId: string; optionText: string; at: string }[];
    result?: { gift: string; scores: Record<string, number>; decidedAt: string };
    startedAt?: string;
    completedAt?: string;
  };
}
interface EventRec {
  id: number;
  gameId: string;
  type: string;
  data: Record<string, unknown>;
  createdAt: string;
}
interface Payload {
  games: Game[];
  events: EventRec[];
  storage: "postgres" | "file";
  vision: { configured: boolean; model: string; demo: boolean };
}

const STAGE_LABEL: Record<string, string> = {
  welcome: "Sin empezar",
  briefing: "En Gijón",
  traveling: "Viajando",
  meeting: "Encuentro en Madrid",
  mission: "Misión",
  question: "Pregunta",
  finished: "Completada",
};

const fmt = (d?: string) =>
  d ? new Date(d).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

export function AdminDashboard() {
  const [data, setData] = useState<Payload | null>(null);
  const [label, setLabel] = useState("");
  const [created, setCreated] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/games", { cache: "no-store" });
    if (r.status === 401) return location.reload();
    setData(await r.json());
  }, []);
  useEffect(() => {
    void load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, [load]);

  const link = (t: string) => `${location.origin}/play/${t}`;
  const copy = async (t: string) => {
    await navigator.clipboard?.writeText(link(t)).catch(() => {});
    setCopied(t);
    setTimeout(() => setCopied(null), 1500);
  };

  async function create() {
    const r = await fetch("/api/admin/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });
    const j = await r.json();
    setCreated(j.game.token);
    setLabel("");
    void load();
  }
  async function reset(id: string) {
    if (!confirm("¿Reiniciar esta partida desde el principio? Se borran progreso y respuestas (el enlace sigue igual).")) return;
    await fetch(`/api/admin/games/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "reset" }) });
    void load();
  }
  async function remove(id: string) {
    if (!confirm("¿Eliminar esta partida? El enlace dejará de funcionar.")) return;
    await fetch(`/api/admin/games/${id}`, { method: "DELETE" });
    void load();
  }
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    location.reload();
  }

  const started = data?.games.filter((g) => g.data.stage !== "welcome").length ?? 0;
  const completed = data?.games.filter((g) => g.data.stage === "finished").length ?? 0;
  const errors = data?.events.filter((e) => e.type === "verify_error") ?? [];

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8">
      <AdminNav active="games" onLogout={logout} />

      {data && (
        <section className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Partidas" value={data.games.length} />
          <Stat label="Iniciadas" value={started} />
          <Stat label="Completadas" value={completed} />
          <Stat label="Errores de verificación" value={errors.length} />
        </section>
      )}

      {data && (
        <section className="mt-4 flex flex-wrap gap-2 text-xs">
          <Badge ok={data.storage === "postgres"}>
            Persistencia: {data.storage === "postgres" ? "PostgreSQL" : "archivo local (solo desarrollo)"}
          </Badge>
          <Badge ok={data.vision.configured}>
            Claude Vision: {data.vision.configured ? `activo · ${data.vision.model}` : data.vision.demo ? "sin clave → MODO DEMO" : "sin clave → verificación desactivada"}
          </Badge>
        </section>
      )}

      <section className="mt-10 rounded-3xl bg-snow border border-ink/10 p-6">
        <h2 className="display text-3xl">Nuevo enlace privado</h2>
        <p className="text-sm text-ink/60 mt-1">Cada enlace es una partida independiente con su propio progreso.</p>
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Etiqueta interna (p. ej. «La buena» o «Pruebas»)"
            className="flex-1 rounded-full border border-ink/20 bg-paper px-5 py-3 outline-none focus:border-ink"
          />
          <button className="btn-primary" onClick={create}>
            Crear enlace
          </button>
        </div>
        {created && (
          <div className="mt-4 rounded-2xl bg-ink text-paper p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <code className="text-xs break-all flex-1">{link(created)}</code>
            <button className="label border border-paper/30 rounded-full px-3 py-2" onClick={() => copy(created)}>
              {copied === created ? "Copiado" : "Copiar"}
            </button>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="display text-3xl">Partidas</h2>
        <div className="mt-4 space-y-4">
          {!data && <p className="text-sm text-ink/50">Cargando…</p>}
          {data?.games.length === 0 && <p className="text-sm text-ink/50">Todavía no hay partidas.</p>}
          {data?.games.map((g) => (
            <article key={g.id} className="rounded-3xl border border-ink/10 bg-snow p-5">
              <header className="flex flex-wrap items-start gap-3 justify-between">
                <div>
                  <p className="font-medium">{g.label || "Sin etiqueta"}</p>
                  <p className="label text-ink/45 mt-1">
                    #{g.id} · creada {fmt(g.createdAt)} · actividad {fmt(g.updatedAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`label rounded-full px-3 py-1.5 ${g.data.stage === "finished" ? "bg-ink text-paper" : "bg-paper border border-ink/15"}`}>
                    {STAGE_LABEL[g.data.stage] ?? g.data.stage}
                    {g.data.level > 0 && g.data.stage !== "finished" ? ` · nivel ${g.data.level}` : ""}
                  </span>
                  <button className="btn-ghost !py-1.5" onClick={() => copy(g.token)}>
                    {copied === g.token ? "Copiado" : "Copiar enlace"}
                  </button>
                  <a className="btn-ghost !py-1.5" href={`/play/${g.token}`} target="_blank" rel="noreferrer">
                    Abrir
                  </a>
                  <button className="btn-ghost !py-1.5" onClick={() => reset(g.id)}>
                    Reiniciar
                  </button>
                  <button className="btn-ghost !py-1.5 text-accent" onClick={() => remove(g.id)}>
                    Eliminar
                  </button>
                </div>
              </header>

              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <div>
                  <p className="label text-ink/50 mb-2">Misiones</p>
                  <table className="w-full text-sm">
                    <thead className="text-left text-ink/45">
                      <tr>
                        <th className="font-normal pb-1">Nivel</th>
                        <th className="font-normal pb-1">Estado</th>
                        <th className="font-normal pb-1">Intentos</th>
                        <th className="font-normal pb-1">Fallos/Err.</th>
                        <th className="font-normal pb-1">Detectado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.data.missions.map((m, i) => (
                        <tr key={i} className="border-t border-ink/5">
                          <td className="py-1">{i + 1}</td>
                          <td>
                            {m.status}
                            {m.verifiedBy === "demo" ? " (demo)" : ""}
                          </td>
                          <td>{m.attempts}</td>
                          <td>
                            {m.failures}/{m.errors}
                          </td>
                          <td className="text-ink/60 truncate max-w-[10rem]">{m.lastDetected ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div>
                  <p className="label text-ink/50 mb-2">Respuestas</p>
                  {g.data.answers.length === 0 && <p className="text-sm text-ink/45">—</p>}
                  <ol className="space-y-1 text-sm">
                    {[...g.data.answers]
                      .sort((a, b) => a.level - b.level)
                      .map((a) => (
                        <li key={a.level}>
                          <span className="label text-ink/40 mr-2">{a.level}</span>
                          <span className="uppercase font-mono text-xs mr-2">{a.optionId}</span>
                          {a.optionText}
                        </li>
                      ))}
                  </ol>
                  {g.data.result && (
                    <div className="mt-3 rounded-2xl bg-ink text-paper p-3 text-sm">
                      <p className="label text-paper/60">Resultado · {fmt(g.data.result.decidedAt)}</p>
                      <p className="display text-2xl mt-1">{g.data.result.gift}</p>
                      <p className="text-xs text-paper/70 mt-1">
                        {Object.entries(g.data.result.scores)
                          .map(([k, v]) => `${k} ${v}`)
                          .join(" · ")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="display text-3xl">Registro de verificación</h2>
        <div className="mt-3 rounded-3xl border border-ink/10 bg-snow divide-y divide-ink/5 text-sm max-h-96 overflow-auto">
          {data?.events.length === 0 && <p className="p-4 text-ink/45">Sin eventos.</p>}
          {data?.events.map((e) => (
            <div key={e.id} className="px-4 py-2 flex gap-3">
              <span className="label text-ink/40 w-28 shrink-0">{fmt(e.createdAt)}</span>
              <span className={`label w-32 shrink-0 ${e.type === "verify_error" ? "text-accent" : ""}`}>{e.type}</span>
              <span className="text-ink/45 w-16 shrink-0">#{e.gameId}</span>
              <span className="text-ink/70 truncate">{JSON.stringify(e.data)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function AdminNav({ active, onLogout }: { active: "games" | "content"; onLogout?: () => void }) {
  const logout =
    onLogout ??
    (async () => {
      await fetch("/api/admin/logout", { method: "POST" });
      location.reload();
    });
  return (
    <nav className="flex flex-wrap items-center gap-3 justify-between">
      <div>
        <p className="label text-ink/50">PROJECT 24</p>
        <p className="display text-4xl leading-none mt-1">Control room</p>
      </div>
      <div className="flex gap-2">
        <a href="/admin" className={`btn-ghost ${active === "games" ? "!bg-ink !text-paper" : ""}`}>
          Partidas
        </a>
        <a href="/admin/content" className={`btn-ghost ${active === "content" ? "!bg-ink !text-paper" : ""}`}>
          Contenido
        </a>
        <button onClick={logout} className="btn-ghost">
          Salir
        </button>
      </div>
    </nav>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-snow border border-ink/10 p-4">
      <p className="label text-ink/50">{label}</p>
      <p className="display text-4xl mt-1">{value}</p>
    </div>
  );
}

function Badge({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span className={`rounded-full px-3 py-1.5 border ${ok ? "border-ink/15 bg-snow" : "border-accent/40 bg-accent/10 text-accent"}`}>
      {children}
    </span>
  );
}
