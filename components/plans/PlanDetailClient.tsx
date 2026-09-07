'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Exercise = {
  id: string
  name: string
  muscle_group: string
}

type PlanExercise = {
  id: string
  exercise_id: string
  position: number
  target_sets: number
  exercise: Exercise
}

export default function PlanDetailClient({
  planId,
  initialName,
  initialPlanExercises,
  allExercises,
}: {
  planId: string
  initialName: string
  initialPlanExercises: PlanExercise[]
  allExercises: Exercise[]
}) {
  const supabase = createClient()
  const router = useRouter()

  const [name, setName] = useState(initialName)
  const [editingName, setEditingName] = useState(false)
  const [planExercises, setPlanExercises] = useState<PlanExercise[]>(
    [...initialPlanExercises].sort((a, b) => a.position - b.position)
  )
  const [search, setSearch] = useState('')
  const [showPicker, setShowPicker] = useState(false)

  const usedIds = useMemo(
    () => new Set(planExercises.map((pe) => pe.exercise_id)),
    [planExercises]
  )

  const filteredExercises = useMemo(() => {
    return allExercises.filter(
      (ex) =>
        !usedIds.has(ex.id) && ex.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [allExercises, usedIds, search])

  async function handleSaveName() {
    setEditingName(false)
    if (!name.trim() || name === initialName) return

    await supabase.from('workout_plans').update({ name: name.trim() }).eq('id', planId)
  }

  async function handleAddExercise(exercise: Exercise) {
    const { data, error } = await supabase
      .from('plan_exercises')
      .insert({
        plan_id: planId,
        exercise_id: exercise.id,
        position: planExercises.length,
        target_sets: 3,
      })
      .select()
      .single()

    if (!error && data) {
      setPlanExercises((prev) => [
        ...prev,
        { ...data, exercise } as PlanExercise,
      ])
    }
    setSearch('')
  }

  async function handleRemoveExercise(id: string) {
    const { error } = await supabase.from('plan_exercises').delete().eq('id', id)
    if (!error) {
      setPlanExercises((prev) => prev.filter((pe) => pe.id !== id))
    }
  }

  async function handleUpdateSets(id: string, sets: number) {
    setPlanExercises((prev) =>
      prev.map((pe) => (pe.id === id ? { ...pe, target_sets: sets } : pe))
    )
    await supabase.from('plan_exercises').update({ target_sets: sets }).eq('id', id)
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= planExercises.length) return

    const updated = [...planExercises]
    ;[updated[index], updated[newIndex]] = [updated[newIndex], updated[index]]

    // Positionen neu zuweisen
    const withPositions = updated.map((pe, i) => ({ ...pe, position: i }))
    setPlanExercises(withPositions)

    // In DB aktualisieren (nur die zwei getauschten)
    await Promise.all([
      supabase
        .from('plan_exercises')
        .update({ position: index })
        .eq('id', withPositions[index].id),
      supabase
        .from('plan_exercises')
        .update({ position: newIndex })
        .eq('id', withPositions[newIndex].id),
    ])
  }

  async function handleDeletePlan() {
    if (!confirm('Diesen kompletten Plan wirklich löschen?')) return
    await supabase.from('workout_plans').delete().eq('id', planId)
    router.push('/dashboard/plans')
  }

  return (
    <div>
      {/* Titel */}
      <div className="flex items-center justify-between gap-3">
        {editingName ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleSaveName}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-2xl font-bold text-white outline-none focus:border-emerald-500"
          />
        ) : (
          <h1
            onClick={() => setEditingName(true)}
            className="cursor-pointer text-2xl font-bold text-white hover:text-emerald-400"
            title="Klicken zum Umbenennen"
          >
            {name}
          </h1>
        )}
        <div className="flex items-center gap-4">
          {planExercises.length > 0 && (
            <Link
              href={`/dashboard/workout/${planId}`}
              className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-gray-950 transition hover:bg-emerald-400"
            >
              ▶ Workout starten
            </Link>
          )}
          <button
            onClick={handleDeletePlan}
            className="text-sm text-gray-500 hover:text-red-400"
          >
            Plan löschen
          </button>
        </div>
      </div>

      {/* Übungsliste im Plan */}
      <div className="mt-6 space-y-2">
        {planExercises.map((pe, index) => (
          <div
            key={pe.id}
            className="flex items-center gap-3 rounded-2xl border border-gray-800 bg-gray-900 p-3"
          >
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => handleMove(index, -1)}
                disabled={index === 0}
                className="text-gray-500 hover:text-white disabled:opacity-20"
              >
                ▲
              </button>
              <button
                onClick={() => handleMove(index, 1)}
                disabled={index === planExercises.length - 1}
                className="text-gray-500 hover:text-white disabled:opacity-20"
              >
                ▼
              </button>
            </div>

            <div className="flex-1">
              <p className="font-medium text-white">{pe.exercise.name}</p>
              <span className="text-xs text-emerald-400">
                {pe.exercise.muscle_group}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-sm text-gray-400">
              <span>Sätze:</span>
              <input
                type="number"
                min={1}
                max={10}
                value={pe.target_sets}
                onChange={(e) => handleUpdateSets(pe.id, Number(e.target.value))}
                className="w-14 rounded-lg border border-gray-700 bg-gray-800 px-2 py-1 text-center text-white outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={() => handleRemoveExercise(pe.id)}
              className="text-gray-500 hover:text-red-400"
            >
              ✕
            </button>
          </div>
        ))}

        {planExercises.length === 0 && (
          <p className="rounded-2xl border border-dashed border-gray-800 p-6 text-center text-gray-500">
            Noch keine Übungen in diesem Plan.
          </p>
        )}
      </div>

      {/* Übung hinzufügen */}
      <div className="mt-6">
        {!showPicker ? (
          <button
            onClick={() => setShowPicker(true)}
            className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-gray-950 transition hover:bg-emerald-400"
          >
            + Übung hinzufügen
          </button>
        ) : (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
            <div className="flex items-center justify-between">
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Übung suchen..."
                className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
              />
              <button
                onClick={() => setShowPicker(false)}
                className="ml-3 text-sm text-gray-400 hover:text-white"
              >
                Schließen
              </button>
            </div>

            <div className="mt-3 max-h-64 space-y-1 overflow-y-auto">
              {filteredExercises.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => handleAddExercise(ex)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-gray-800"
                >
                  <span className="text-white">{ex.name}</span>
                  <span className="text-xs text-emerald-400">{ex.muscle_group}</span>
                </button>
              ))}

              {filteredExercises.length === 0 && (
                <p className="px-3 py-2 text-sm text-gray-500">
                  Keine passenden Übungen gefunden.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
