'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError('E-Mail oder Passwort ist falsch.')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-gray-900 p-8 shadow-xl">
        <h1 className="mb-1 text-2xl font-bold text-white">Willkommen zurück</h1>
        <p className="mb-6 text-sm text-gray-400">Melde dich in deinem Account an</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-gray-300">E-Mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
              placeholder="du@beispiel.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-300">Passwort</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-900/30 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-500 py-2 font-semibold text-gray-950 transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? 'Wird eingeloggt...' : 'Einloggen'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Noch keinen Account?{' '}
          <Link href="/signup" className="text-emerald-400 hover:underline">
            Registrieren
          </Link>
        </p>
      </div>
    </div>
  )
}
