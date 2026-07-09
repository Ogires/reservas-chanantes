import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AYUDA_STEPS, AYUDA_UI, isAyudaLang } from '../content'
import { AyudaNav, LangToggle } from './nav'

export function generateStaticParams() {
  return [{ lang: 'es' }, { lang: 'en' }]
}

export default async function AyudaLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isAyudaLang(lang)) notFound()

  const ui = AYUDA_UI[lang]
  const steps = AYUDA_STEPS.map((s) => ({
    slug: s.slug,
    number: s.number,
    title: s[lang].title,
  }))

  return (
    <div className="min-h-screen bg-warm-bg">
      <header className="border-b border-warm-border bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="font-serif text-lg font-bold text-slate-900 transition-colors hover:text-coral"
            >
              Reservas Chanantes
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-medium text-slate-500">{ui.helpCenter}</span>
          </div>
          <LangToggle lang={lang} />
        </div>
      </header>

      <div className="mx-auto flex max-w-5xl gap-10 px-6 py-10">
        <AyudaNav
          lang={lang}
          steps={steps}
          overviewLabel={ui.overview}
          onThisPageLabel={ui.onThisPage}
        />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
