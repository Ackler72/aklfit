'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-300 transition hover:border-red-500 hover:text-red-400"
    >
      Ausloggen
    </button>
  )
}
