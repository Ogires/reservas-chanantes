'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/infrastructure/supabase/client'

const navItems = [
  { href: '/my', label: 'Upcoming', exact: true },
  { href: '/my/history', label: 'History', exact: false },
  { href: '/my/profile', label: 'Profile', exact: false },
]

export function PortalNav({ customerName }: { customerName: string }) {
  const pathname = usePathname()
  const router = useRouter()

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
        <h1 className="text-xl font-bold font-serif text-slate-900">My Bookings</h1>
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
          Sign out
        </button>
      </div>
    </header>
  )
}
