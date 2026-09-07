import { createClient } from '@/lib/supabase/server'
import PlansList from '@/components/plans/PlansList'

export default async function PlansPage() {
  const supabase = await createClient()

  const { data: plans } = await supabase
    .from('workout_plans')
    .select('id, name, created_at, plan_exercises(count)')
    .order('created_at', { ascending: false })

  const formattedPlans =
    plans?.map((p) => ({
      id: p.id,
      name: p.name,
      created_at: p.created_at,
      exercise_count: (p.plan_exercises as unknown as { count: number }[])?.[0]?.count ?? 0,
    })) ?? []

  return (
    <div>
      <h1 className="text-2xl font-bold">Trainingspläne</h1>
      <p className="mt-1 text-gray-400">
        Erstelle Pläne wie &quot;Push Day&quot; und füge Übungen hinzu.
      </p>

      <div className="mt-6">
        <PlansList initialPlans={formattedPlans} />
      </div>
    </div>
  )
}
