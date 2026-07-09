import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  AYUDA_STEPS,
  AYUDA_UI,
  getAyudaStep,
  isAyudaLang,
} from '../../content'

export function generateStaticParams() {
  return (['es', 'en'] as const).flatMap((lang) =>
    AYUDA_STEPS.map((s) => ({ lang, step: s.slug }))
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; step: string }>
}): Promise<Metadata> {
  const { lang, step } = await params
  const s = getAyudaStep(step)
  if (!isAyudaLang(lang) || !s) return {}
  return { title: `${s[lang].title} — ${AYUDA_UI[lang].helpCenter}` }
}

export default async function AyudaStepPage({
  params,
}: {
  params: Promise<{ lang: string; step: string }>
}) {
  const { lang, step } = await params
  if (!isAyudaLang(lang)) notFound()
  const s = getAyudaStep(step)
  if (!s) notFound()

  const ui = AYUDA_UI[lang]
  const copy = s[lang]
  const idx = AYUDA_STEPS.findIndex((x) => x.slug === s.slug)
  const prev = idx > 0 ? AYUDA_STEPS[idx - 1] : null
  const next = idx < AYUDA_STEPS.length - 1 ? AYUDA_STEPS[idx + 1] : null

  return (
    <article className="animate-fade-in-up">
      <p className="text-sm font-medium text-coral">
        {ui.stepWord} {s.number} {ui.of} {AYUDA_STEPS.length}
      </p>
      <h1 className="mt-1 font-serif text-3xl font-bold text-slate-900">
        {copy.title}
      </h1>
      <p className="mt-3 text-lg text-slate-600">{copy.intro}</p>

      <ol className="mt-6 space-y-3">
        {copy.instructions.map((ins, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-semibold text-teal-700">
              {i + 1}
            </span>
            <span className="text-slate-700">{ins}</span>
          </li>
        ))}
      </ol>

      {s.screenshot && (
        <figure className="mt-8">
          <Image
            src={s.screenshot.src}
            alt={s.screenshot.alt}
            width={s.screenshot.width ?? 1280}
            height={s.screenshot.height ?? 800}
            style={{ maxWidth: s.screenshot.width }}
            className="mx-auto h-auto w-full rounded-xl border border-warm-border shadow-sm"
          />
          {s.screenshot.caption && (
            <figcaption className="mt-2 text-center text-sm text-slate-500">
              {s.screenshot.caption}
            </figcaption>
          )}
        </figure>
      )}

      {copy.tip && (
        <div className="mt-8 rounded-xl border border-teal-200 bg-teal-50/50 p-4">
          <p className="text-sm text-slate-700">
            <span className="font-semibold text-teal-700">{ui.tipLabel}: </span>
            {copy.tip}
          </p>
        </div>
      )}

      <nav className="mt-10 flex items-center justify-between gap-4 border-t border-warm-border pt-6">
        {prev ? (
          <Link
            href={`/ayuda/${lang}/${prev.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            <span aria-hidden>←</span> {ui.prev}
          </Link>
        ) : (
          <Link
            href={`/ayuda/${lang}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            <span aria-hidden>←</span> {ui.overview}
          </Link>
        )}

        {next ? (
          <Link
            href={`/ayuda/${lang}/${next.slug}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-warm-border transition-colors hover:text-slate-900"
          >
            {ui.next} <span aria-hidden>→</span>
          </Link>
        ) : (
          <Link
            href="/admin/register"
            className="inline-flex items-center gap-1.5 rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-coral-dark"
          >
            {ui.ctaButton} <span aria-hidden>→</span>
          </Link>
        )}
      </nav>
    </article>
  )
}
