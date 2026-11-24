export default function NotFound() {
  return (
    <main className="min-h-dvh grid place-items-center px-6 bg-paper text-ink">
      <div className="text-center">
        <p className="label text-warm">404 · Ruta no encontrada</p>
        <h1 className="display text-6xl mt-4">Te has salido del mapa.</h1>
        <p className="mt-5 text-sm text-ink/60">Revisa el enlace que te han enviado.</p>
      </div>
    </main>
  );
}
