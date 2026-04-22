export default function SlugLoading() {
  return (
    <main
      className="mx-auto max-w-2xl px-6 py-12"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="animate-pulse space-y-6">
        <div className="h-10 w-2/3 rounded bg-slate-200" />
        <div className="h-4 w-full rounded bg-slate-200" />
        <div className="h-4 w-5/6 rounded bg-slate-200" />
        <div className="mt-8 space-y-3">
          <div className="h-24 rounded-lg bg-slate-200" />
          <div className="h-24 rounded-lg bg-slate-200" />
          <div className="h-24 rounded-lg bg-slate-200" />
        </div>
      </div>
      <span className="sr-only">Cargando…</span>
    </main>
  )
}
