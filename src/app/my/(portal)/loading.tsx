export default function PortalLoading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-live="polite">
      <div className="h-6 w-1/4 rounded bg-slate-200" />
      <div className="space-y-3">
        <div className="h-20 rounded-lg bg-slate-200" />
        <div className="h-20 rounded-lg bg-slate-200" />
      </div>
      <span className="sr-only">Cargando…</span>
    </div>
  )
}
