'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Plan = {
  id: string
  name: string
  created_at: string
  exercise_count: number
}

export default function PlansList({ initialPlans }: { initialPlans: Plan[] }) {
  const supabase = createClient()
  const router = useRouter()

  const [plans, setPlans] = useState<Plan[]>(initialPlans)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Bitte einen Namen für den Plan eingeben.')
      return
    }

    setSaving(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('workout_plans')
      .insert({ user_id: user?.id, name: name.trim() })
      .select()
      .single()

    setSaving(false)

    if (error || !data) {
      setError('Plan konnte nicht erstellt werden.')
      return
    }

    // Direkt zur Detailseite, um Übungen hinzuzufügen
    router.push(`/dashboard/plans/${data.id}`)
  }

  async function handleDelete(id: string) {
    if (!confirm('Diesen Plan wirklich löschen?')) return

    const { error } = await supabase.from('workout_plans').delete().eq('id', id)

    if (!error) {
      setPlans((prev) => prev.filter((p) => p.id !== id))
    }
  }

  return (
    <div>
      <form onSubmit={handleCreate} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z. B. Push Day"
          className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-gray-950 transition hover:bg-emerald-400 disabled:opacity-50"
        >
          {saving ? 'Wird erstellt...' : '+ Neuer Plan'}
        </button>
      </form>

      {error && (
        <p className="mt-2 rounded-lg bg-red-900/30 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="group relative rounded-2xl border border-gray-800 bg-gray-900 p-4 transition hover:border-emerald-500/50"
          >
            <Link href={`/dashboard/plans/${plan.id}`} className="block">
              <h3 className="font-semibold text-white">{plan.name}</h3>
              <p className="mt-1 text-sm text-gray-400">
                {plan.exercise_count} Übung{plan.exercise_count !== 1 ? 'en' : ''}
              </p>
            </Link>
            <button
              onClick={() => handleDelete(plan.id)}
              className="absolute right-3 top-3 text-xs text-gray-500 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
            >
              Löschen
            </button>
          </div>
        ))}

        {plans.length === 0 && (
          <p className="col-span-full text-center text-gray-500">
            Noch keine Trainingspläne erstellt.
          </p>
        )}
      </div>
    </div>
  )
}
