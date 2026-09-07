import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import WorkoutClient from '@/components/workout/WorkoutClient'

type PreviousMap = Record<number, { reps: number | null; weight_kg: number | null }>

async function getPreviousSets(
  supabase: Awaited<ReturnType<typeof createClient>>,
  exerciseId: string
): Promise<PreviousMap> {
  const { data } = await supabase
    .from('workout_sets')
    .select('set_number, reps, weight_kg, session:workout_sessions(started_at)')
    .eq('exercise_id', exerciseId)
    .limit(50)

  if (!data || data.length === 0) return {}

  type Row = {
    set_number: number
    reps: number | null
    weight_kg: number | null
    session: { started_at: string } | { started_at: string }[] | null
  }

  const rows = data as unknown as Row[]

  const getStartedAt = (r: Row) =>
    Array.isArray(r.session) ? r.session[0]?.started_at : r.session?.started_at

  const sorted = [...rows].sort(
    (a, b) => new Date(getStartedAt(b) ?? 0).getTime() - new Date(getStartedAt(a) ?? 0).getTime()
  )

  const latestStartedAt = getStartedAt(sorted[0])
  const latestRows = rows.filter((r) => getStartedAt(r) === latestStartedAt)

  const map: PreviousMap = {}
  latestRows.forEach((r) => {
    map[r.set_number] = { reps: r.reps, weight_kg: r.weight_kg }
  })
  return map
}

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ planId: string }>
}) {
  const { planId } = await params
  const supabase = await createClient()

  const { data: plan } = await supabase
    .from('workout_plans')
    .select('id, name')
    .eq('id', planId)
    .single()

  if (!plan) {
    notFound()
  }

  const { data: planExercises } = await supabase
    .from('plan_exercises')
    .select('exercise_id, target_sets, position, exercise:exercises(id, name, muscle_group)')
    .eq('plan_id', planId)
    .order('position', { ascending: true })

  type PlanExerciseRow = {
    exercise_id: string
    target_sets: number
    exercise: { id: string; name: string; muscle_group: string } | { id: string; name: string; muscle_group: string }[]
  }

  const rows = (planExercises as unknown as PlanExerciseRow[]) ?? []

  const exercises = await Promise.all(
    rows.map(async (row) => {
      const exerciseInfo = Array.isArray(row.exercise) ? row.exercise[0] : row.exercise
      const previous = await getPreviousSets(supabase, row.exercise_id)

      return {
        exerciseId: row.exercise_id,
        name: exerciseInfo?.name ?? 'Übung',
        muscleGroup: exerciseInfo?.muscle_group ?? '',
        sets: Array.from({ length: row.target_sets }, (_, i) => ({
          setNumber: i + 1,
          reps: '',
          weight: '',
          completed: false,
          rowId: null,
          previous: previous[i + 1] ?? null,
        })),
      }
    })
  )

  return (
    <WorkoutClient planId={plan.id} planName={plan.name} initialExercises={exercises} />
  )
}
