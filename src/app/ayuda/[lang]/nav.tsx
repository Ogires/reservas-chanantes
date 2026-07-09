'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { AyudaLang } from '../content'

interface NavStep {
  slug: string
  number: number
  title: string
}

export function AyudaNav({
  lang,
  steps,
  overviewLabel,
  onThisPageLabel,
}: {
  lang: AyudaLang
  steps: NavStep[]
  overviewLabel: string
  onThisPageLabel: string
}) {
  const pathname = usePathname()
  const overviewHref = `/ayuda/${lang}`

  return (
    <nav className="hidden w-56 shrink-0 md:block" aria-label={onThisPageLabel}>
      <div className="sticky top-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {onThisPageLabel}
        </p>
        <Link
          href={overviewHref}
          className={`mb-1 block rounded-lg px-3 py-2 text-sm transition-colors ${
            pathname === overviewHref
              ? 'bg-white font-medium text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          {overviewLabel}
        </Link>
        <ol className="space-y-0.5">
          {steps.map((s) => {
            const href = `/ayuda/${lang}/${s.slug}`
            const active = pathname === href
            return (
              <li key={s.slug}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                    active
                      ? 'bg-white font-medium text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                      active ? 'bg-coral text-white' : 'bg-warm-border text-slate-500'
                    }`}
                  >
                    {s.number}
                  </span>
                  <span className="truncate">{s.title}</span>
                </Link>
              </li>
            )
          })}
        </ol>
      </div>
    </nav>
  )
}

export function LangToggle({ lang }: { lang: AyudaLang }) {
  const pathname = usePathname()
  const other: AyudaLang = lang === 'es' ? 'en' : 'es'
  const target = pathname.replace(/^\/ayuda\/(es|en)/, `/ayuda/${other}`)

  return (
    <Link
      href={target}
      className="rounded-lg border border-warm-border bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 transition-colors hover:border-coral hover:text-slate-900"
      aria-label={other === 'en' ? 'Switch to English' : 'Cambiar a español'}
    >
      {other.toUpperCase()}
    </Link>
  )
}
