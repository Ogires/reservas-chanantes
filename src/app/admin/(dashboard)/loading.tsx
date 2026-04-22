export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-live="polite">
      <div className="h-8 w-1/3 rounded bg-slate-200" />
      <div className="h-48 rounded-lg bg-slate-200" />
      <span className="sr-only">Cargando…</span>
    </div>
  )
}
