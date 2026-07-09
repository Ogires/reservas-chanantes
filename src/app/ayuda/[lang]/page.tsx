import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { AYUDA_STEPS, AYUDA_UI, isAyudaLang } from '../content'

export function generateStaticParams() {
  return [{ lang: 'es' }, { lang: 'en' }]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  if (!isAyudaLang(lang)) return {}
  const ui = AYUDA_UI[lang]
  return { title: `${ui.helpCenter} — ${ui.tagline}` }
}

export default async function AyudaOverview({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isAyudaLang(lang)) notFound()

  const ui = AYUDA_UI[lang]

  return (
    <div className="animate-fade-in-up">
      <p className="text-sm font-medium text-coral">{ui.helpCenter}</p>
      <h1 className="mt-1 font-serif text-3xl font-bold text-slate-900">
        {ui.tagline}
      </h1>
      <p className="mt-3 max-w-2xl text-slate-600">{ui.overviewIntro}</p>

      <ol className="stagger-children mt-8 grid gap-4 sm:grid-cols-2">
        {AYUDA_STEPS.map((s) => (
          <li key={s.slug}>
            <Link
              href={`/ayuda/${lang}/${s.slug}`}
              className="group block h-full rounded-xl border border-warm-border bg-white p-5 shadow-sm transition-colors hover:border-coral"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-sm font-semibold text-teal-700">
                  {s.number}
                </span>
                <h2 className="font-semibold text-slate-900">{s[lang].title}</h2>
              </div>
              <p className="mt-2 text-sm text-slate-600">{s[lang].summary}</p>
            </Link>
          </li>
        ))}
      </ol>

      <Link
        href={`/ayuda/${lang}/${AYUDA_STEPS[0].slug}`}
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-coral px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-coral-dark"
      >
        {ui.start}
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
          />
        </svg>
      </Link>
    </div>
  )
}
