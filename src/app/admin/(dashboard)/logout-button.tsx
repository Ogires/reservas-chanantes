'use client'

import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/infrastructure/supabase/client'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createSupabaseBrowser()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="mt-auto rounded px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 text-left"
    >
      Sign out
    </button>
  )
}
