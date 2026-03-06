import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Bookings – Reservas Chanantes',
  description: 'Manage your bookings across all businesses',
  robots: { index: false, follow: false },
}

export default function MyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF9] to-[#F5F0EB]">
      {children}
    </div>
  )
}
