import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div>
      <h1 className="text-2xl font-bold">Willkommen zurück 👋</h1>
      <p className="mt-1 text-gray-400">{user?.email}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <p className="text-sm text-gray-400">Trainings-Streak</p>
          <p className="mt-2 text-3xl font-bold text-emerald-400">0 Tage</p>
        </div>
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <p className="text-sm text-gray-400">Workouts diese Woche</p>
          <p className="mt-2 text-3xl font-bold text-white">0</p>
        </div>
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <p className="text-sm text-gray-400">Letztes Workout</p>
          <p className="mt-2 text-lg text-gray-300">Noch keins absolviert</p>
        </div>
      </div>

      <p className="mt-8 text-sm text-gray-500">
        Hier entstehen als Nächstes: Trainingspläne, Übungsdatenbank & Fortschritts-Charts.
      </p>
    </div>
  )
}
