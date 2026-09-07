import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PlanDetailClient from '@/components/plans/PlanDetailClient'

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: plan } = await supabase
    .from('workout_plans')
    .select('id, name')
    .eq('id', id)
    .single()

  if (!plan) {
    notFound()
  }

  const { data: planExercises } = await supabase
    .from('plan_exercises')
    .select('id, exercise_id, position, target_sets, exercise:exercises(id, name, muscle_group)')
    .eq('plan_id', id)
    .order('position', { ascending: true })

  const { data: allExercises } = await supabase
    .from('exercises')
    .select('id, name, muscle_group')
    .order('name', { ascending: true })

  return (
    <div>
      <PlanDetailClient
        planId={plan.id}
        initialName={plan.name}
        initialPlanExercises={(planExercises as never) ?? []}
        allExercises={allExercises ?? []}
      />
    </div>
  )
}
