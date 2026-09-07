import { createClient } from '@/lib/supabase/server'
import ExercisesClient from '@/components/exercises/ExercisesClient'

export default async function ExercisesPage() {
  const supabase = await createClient()

  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .order('name', { ascending: true })

  return (
    <div>
      <h1 className="text-2xl font-bold">Übungsdatenbank</h1>
      <p className="mt-1 text-gray-400">
        Vorgefertigte Übungen durchsuchen oder eigene hinzufügen.
      </p>

      <div className="mt-6">
        <ExercisesClient initialExercises={exercises ?? []} />
      </div>
    </div>
  )
}
