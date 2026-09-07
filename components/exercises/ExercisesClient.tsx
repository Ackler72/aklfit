'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Exercise = {
  id: string
  name: string
  muscle_group: string
  instructions: string | null
  user_id: string | null
}

const MUSCLE_GROUPS = [
  'Brust',
  'Rücken',
  'Schultern',
  'Bizeps',
  'Trizeps',
  'Beine',
  'Waden',
  'Gesäß',
  'Bauch',
  'Cardio',
  'Dehnen',
  'Sonstige',
]

export default function ExercisesClient({
  initialExercises,
}: {
  initialExercises: Exercise[]
}) {
  const supabase = createClient()

  const [exercises, setExercises] = useState<Exercise[]>(initialExercises)
  const [search, setSearch] = useState('')
  const [activeGroup, setActiveGroup] = useState<string>('Alle')
  const [showForm, setShowForm] = useState(false)

  // Formular-States
  const [name, setName] = useState('')
  const [muscleGroup, setMuscleGroup] = useState(MUSCLE_GROUPS[0])
  const [instructions, setInstructions] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesGroup = activeGroup === 'Alle' || ex.muscle_group === activeGroup
      const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase())
      return matchesGroup && matchesSearch
    })
  }, [exercises, search, activeGroup])

  async function handleAddExercise(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Bitte einen Namen eingeben.')
      return
    }

    setSaving(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('exercises')
      .insert({
        user_id: user?.id,
        name: name.trim(),
        muscle_group: muscleGroup,
        instructions: instructions.trim() || null,
      })
      .select()
      .single()

    setSaving(false)

    if (error) {
      setError('Übung konnte nicht gespeichert werden.')
      return
    }

    setExercises((prev) => [data as Exercise, ...prev])
    setName('')
    setInstructions('')
    setShowForm(false)
  }

  return (
    <div>
      {/* Kopfzeile: Suche + Button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          placeholder="Übung suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white outline-none focus:border-emerald-500 sm:max-w-xs"
        />
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-gray-950 transition hover:bg-emerald-400"
        >
          {showForm ? 'Abbrechen' : '+ Eigene Übung'}
        </button>
      </div>

      {/* Filter-Chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        {['Alle', ...MUSCLE_GROUPS].map((group) => (
          <button
            key={group}
            onClick={() => setActiveGroup(group)}
            className={`rounded-full px-3 py-1 text-sm transition ${
              activeGroup === group
                ? 'bg-emerald-500 text-gray-950 font-semibold'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {group}
          </button>
        ))}
      </div>

      {/* Formular für eigene Übung */}
      {showForm && (
        <form
          onSubmit={handleAddExercise}
          className="mt-4 space-y-3 rounded-2xl border border-gray-800 bg-gray-900 p-4"
        >
          <div>
            <label className="mb-1 block text-sm text-gray-300">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
              placeholder="z. B. Schrägbankdrücken"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-300">Muskelgruppe</label>
            <select
              value={muscleGroup}
              onChange={(e) => setMuscleGroup(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
            >
              {MUSCLE_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-300">
              Anleitung / Tipps (optional)
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
              placeholder="Kurze Ausführungshinweise..."
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-900/30 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-emerald-500 py-2 font-semibold text-gray-950 transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {saving ? 'Wird gespeichert...' : 'Übung speichern'}
          </button>
        </form>
      )}

      {/* Übungsliste */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((ex) => (
          <div
            key={ex.id}
            className="rounded-2xl border border-gray-800 bg-gray-900 p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-white">{ex.name}</h3>
              {ex.user_id && (
                <span className="whitespace-nowrap rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
                  Eigene
                </span>
              )}
            </div>
            <span className="mt-1 inline-block rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
              {ex.muscle_group}
            </span>
            {ex.instructions && (
              <p className="mt-2 text-sm text-gray-400">{ex.instructions}</p>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="col-span-full text-center text-gray-500">
            Keine Übungen gefunden.
          </p>
        )}
      </div>
    </div>
  )
}
