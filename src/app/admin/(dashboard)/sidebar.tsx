import Link from 'next/link'
import type { Tenant } from '@/domain/entities/tenant'
import { LogoutButton } from './logout-button'

export function Sidebar({ tenant }: { tenant: Tenant }) {
  return (
    <aside className="flex h-screen w-56 flex-col border-r bg-gray-50 p-4">
      <div className="mb-6">
        <h2 className="text-lg font-bold truncate">{tenant.name}</h2>
        <p className="text-xs text-gray-500">/{tenant.slug}</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        <Link
          href="/admin/dashboard"
          className="rounded px-3 py-2 text-sm hover:bg-gray-200"
        >
          Dashboard
        </Link>
        <Link
          href="/admin/services"
          className="rounded px-3 py-2 text-sm hover:bg-gray-200"
        >
          Services
        </Link>
        <Link
          href="/admin/schedule"
          className="rounded px-3 py-2 text-sm hover:bg-gray-200"
        >
          Schedule
        </Link>
        <Link
          href={`/${tenant.slug}`}
          target="_blank"
          className="rounded px-3 py-2 text-sm hover:bg-gray-200"
        >
          View public page
        </Link>
      </nav>

      <LogoutButton />
    </aside>
  )
}
