import Link from 'next/link'
import type { AdminTranslations } from '@/infrastructure/i18n/admin-translations'

interface SetupChecklistProps {
  hasServices: boolean
  hasSchedule: boolean
  slug: string
  translations: AdminTranslations['setup']
}

function StepIcon({ done, step }: { done: boolean; step: number }) {
  if (done) {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </span>
    )
  }
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-teal-700 text-sm font-semibold">
      {step}
    </span>
  )
}

export function SetupChecklist({ hasServices, hasSchedule, slug, translations: t }: SetupChecklistProps) {
  const canSharePage = hasServices && hasSchedule

  return (
    <div className="mb-6 rounded-xl border border-[var(--color-warm-border)] bg-white p-6 shadow-sm animate-fade-in-up">
      <h2 className="text-lg font-semibold font-serif text-slate-900 mb-1">{t.title}</h2>
      <p className="text-sm text-slate-500 mb-4">{t.subtitle}</p>

      <ol className="space-y-3">
        <li className="flex items-center gap-3">
          <StepIcon done={hasServices} step={1} />
          {hasServices ? (
            <span className="text-sm text-slate-400 line-through">{t.createService}</span>
          ) : (
            <Link href="/admin/services/new" className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors">
              {t.createService}
            </Link>
          )}
        </li>

        <li className="flex items-center gap-3">
          <StepIcon done={hasSchedule} step={2} />
          {hasSchedule ? (
            <span className="text-sm text-slate-400 line-through">{t.defineSchedule}</span>
          ) : (
            <Link href="/admin/schedule" className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors">
              {t.defineSchedule}
            </Link>
          )}
        </li>

        <li className="flex items-center gap-3">
          <StepIcon done={false} step={3} />
          {canSharePage ? (
            <Link href={`/${slug}`} target="_blank" className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors">
              {t.shareBookingPage}
            </Link>
          ) : (
            <span className="text-sm text-slate-400">{t.shareBookingPage}</span>
          )}
        </li>
      </ol>
    </div>
  )
}
