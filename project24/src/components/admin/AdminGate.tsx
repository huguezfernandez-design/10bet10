"use client";

import { useState } from "react";

export function AdminGate({ disabled }: { disabled?: boolean }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (disabled) {
    return (
      <main className="min-h-dvh grid place-items-center px-6">
        <div className="max-w-sm text-center">
          <p className="label text-warm">Admin desactivado</p>
          <p className="mt-4 text-sm text-ink/70">
            Define la variable de entorno <code className="font-mono">ADMIN_PASSWORD</code> en el servidor para activar el panel.
          </p>
        </div>
      </main>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const r = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    setBusy(false);
    if (r.ok) location.reload();
    else setErr(r.status === 429 ? "Demasiados intentos. Espera unos minutos." : "Contraseña incorrecta.");
  }

  return (
    <main className="min-h-dvh grid place-items-center px-6">
      <form onSubmit={submit} className="w-full max-w-sm">
        <p className="label text-ink/50">TOTI 24 · Control room</p>
        <h1 className="display text-5xl mt-3">Acceso</h1>
        <input
          type="password"
          autoFocus
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Contraseña"
          className="mt-8 w-full rounded-full border border-ink/20 bg-snow px-5 py-3.5 outline-none focus:border-ink"
        />
        {err && <p className="mt-3 text-sm text-accent">{err}</p>}
        <button className="btn-primary w-full mt-4" disabled={busy || !pw}>
          Entrar
        </button>
      </form>
    </main>
  );
}
