import { requireCustomer } from '@/infrastructure/supabase/customer-auth'
import { PortalNav } from './portal-nav'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { customer } = await requireCustomer()

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PortalNav customerName={customer.name} />
      <main className="mt-6">{children}</main>
    </div>
  )
}
