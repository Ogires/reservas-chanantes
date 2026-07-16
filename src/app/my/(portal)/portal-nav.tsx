'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/infrastructure/supabase/client'
import type { PortalTranslations } from '@/infrastructure/i18n/portal-translations'

export function PortalNav({
  customerName,
  t,
}: {
  customerName: string
  t: PortalTranslations
}) {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    { href: '/my', label: t.upcoming, exact: true },
    { href: '/my/history', label: t.history, exact: false },
    { href: '/my/profile', label: t.profile, exact: false },
  ]

  function isActive(item: { href: string; exact: boolean }) {
    return item.exact ? pathname === item.href : pathname.startsWith(item.href)
  }

  async function handleLogout() {
    const supabase = createSupabaseBrowser()
    await supabase.auth.signOut()
    router.push('/my/login')
  }

  return (
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold font-serif text-slate-900">{t.myBookings}</h1>
        <p className="text-sm text-slate-500">{customerName}</p>
      </div>

      <div className="flex items-center gap-1">
        <nav className="flex gap-1 rounded-lg bg-white border border-[var(--color-warm-border)] p-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive(item)
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="ml-2 rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          {t.signOut}
        </button>
      </div>
    </header>
  )
}
