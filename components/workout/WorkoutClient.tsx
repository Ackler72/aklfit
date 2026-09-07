'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type PreviousSet = { reps: number | null; weight_kg: number | null }

type SetRow = {
  setNumber: number
  reps: string
  weight: string
  completed: boolean
  rowId: string | null
  previous: PreviousSet | null
}

type ExerciseBlock = {
  exerciseId: string
  name: string
  muscleGroup: string
  sets: SetRow[]
}

function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function playBeep() {
  try {
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = 880
    osc.connect(gain)
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    osc.start()
    osc.stop(ctx.currentTime + 0.35)
  } catch {
    // Sound nicht verfügbar, ignorieren
  }
  if (navigator.vibrate) {
    navigator.vibrate(300)
  }
}

export default function WorkoutClient({
  planId,
  planName,
  initialExercises,
}: {
  planId: string
  planName: string
  initialExercises: ExerciseBlock[]
}) {
  const supabase = createClient()
  const router = useRouter()

  const [exercises, setExercises] = useState<ExerciseBlock[]>(initialExercises)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [restSeconds, setRestSeconds] = useState<number | null>(null)
  const [finishing, setFinishing] = useState(false)

  const startTimeRef = useRef<number>(Date.now())
  const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Session beim Laden erstellen + Timer starten
  useEffect(() => {
    let cancelled = false

    async function createSession() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data } = await supabase
        .from('workout_sessions')
        .insert({ user_id: user?.id, plan_id: planId })
        .select()
        .single()

      if (!cancelled && data) {
        setSessionId(data.id)
      }
    }

    createSession()
    startTimeRef.current = Date.now()

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Pausen-Timer
  function startRest(seconds: number) {
    if (restIntervalRef.current) clearInterval(restIntervalRef.current)
    setRestSeconds(seconds)

    restIntervalRef.current = setInterval(() => {
      setRestSeconds((prev) => {
        if (prev === null) return null
        if (prev <= 1) {
          clearInterval(restIntervalRef.current!)
          playBeep()
          return null
        }
        return prev - 1
      })
    }, 1000)
  }

  function cancelRest() {
    if (restIntervalRef.current) clearInterval(restIntervalRef.current)
    setRestSeconds(null)
  }

  function updateSetField(
    exIndex: number,
    setIndex: number,
    field: 'reps' | 'weight',
    value: string
  ) {
    setExercises((prev) => {
      const copy = [...prev]
      const sets = [...copy[exIndex].sets]
      sets[setIndex] = { ...sets[setIndex], [field]: value }
      copy[exIndex] = { ...copy[exIndex], sets }
      return copy
    })
  }

  async function toggleComplete(exIndex: number, setIndex: number) {
    if (!sessionId) return

    const exercise = exercises[exIndex]
    const set = exercise.sets[setIndex]
    const newCompleted = !set.completed

    // Lokal sofort aktualisieren
    setExercises((prev) => {
      const copy = [...prev]
      const sets = [...copy[exIndex].sets]
      sets[setIndex] = { ...sets[setIndex], completed: newCompleted }
      copy[exIndex] = { ...copy[exIndex], sets }
      return copy
    })

    const payload = {
      session_id: sessionId,
      exercise_id: exercise.exerciseId,
      set_number: set.setNumber,
      reps: set.reps ? Number(set.reps) : null,
      weight_kg: set.weight ? Number(set.weight) : null,
      completed: newCompleted,
    }

    if (set.rowId) {
      await supabase.from('workout_sets').update(payload).eq('id', set.rowId)
    } else {
      const { data } = await supabase
        .from('workout_sets')
        .insert(payload)
        .select()
        .single()

      if (data) {
        setExercises((prev) => {
          const copy = [...prev]
          const sets = [...copy[exIndex].sets]
          sets[setIndex] = { ...sets[setIndex], rowId: data.id }
          copy[exIndex] = { ...copy[exIndex], sets }
          return copy
        })
      }
    }

    // Bei Abschluss eines Satzes automatisch Pausen-Timer anbieten
    if (newCompleted) {
      startRest(90)
    }
  }

  async function handleFinish() {
    if (!sessionId) return
    setFinishing(true)

    await supabase
      .from('workout_sessions')
      .update({ duration_seconds: elapsed })
      .eq('id', sessionId)

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{planName}</h1>
          <p className="text-gray-400">Dauer: {formatDuration(elapsed)}</p>
        </div>
        <button
          onClick={handleFinish}
          disabled={finishing}
          className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-gray-950 transition hover:bg-emerald-400 disabled:opacity-50"
        >
          {finishing ? 'Wird gespeichert...' : 'Workout beenden'}
        </button>
      </div>

      {/* Pausen-Timer-Leiste */}
      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-gray-800 bg-gray-900 p-3">
        <span className="text-sm text-gray-400">Pause:</span>
        {[60, 90, 120].map((s) => (
          <button
            key={s}
            onClick={() => startRest(s)}
            className="rounded-lg bg-gray-800 px-3 py-1.5 text-sm text-white transition hover:bg-gray-700"
          >
            {s}s
          </button>
        ))}
        {restSeconds !== null && (
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xl font-bold text-emerald-400">
              {formatDuration(restSeconds)}
            </span>
            <button
              onClick={cancelRest}
              className="text-sm text-gray-500 hover:text-white"
            >
              Abbrechen
            </button>
          </div>
        )}
      </div>

      {/* Übungen */}
      <div className="mt-6 space-y-6">
        {exercises.map((ex, exIndex) => (
          <div
            key={ex.exerciseId}
            className="rounded-2xl border border-gray-800 bg-gray-900 p-4"
          >
            <h2 className="font-semibold text-white">{ex.name}</h2>
            <span className="text-xs text-emerald-400">{ex.muscleGroup}</span>

            <div className="mt-3 space-y-2">
              {ex.sets.map((set, setIndex) => (
                <div key={set.setNumber} className="flex items-center gap-2">
                  <span className="w-14 shrink-0 text-sm text-gray-400">
                    Satz {set.setNumber}
                  </span>

                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder={
                      set.previous?.weight_kg != null
                        ? `${set.previous.weight_kg}`
                        : 'kg'
                    }
                    value={set.weight}
                    onChange={(e) =>
                      updateSetField(exIndex, setIndex, 'weight', e.target.value)
                    }
                    className="w-20 rounded-lg border border-gray-700 bg-gray-800 px-2 py-1.5 text-center text-white outline-none focus:border-emerald-500"
                  />
                  <span className="text-xs text-gray-500">kg</span>

                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder={
                      set.previous?.reps != null ? `${set.previous.reps}` : 'Wdh.'
                    }
                    value={set.reps}
                    onChange={(e) =>
                      updateSetField(exIndex, setIndex, 'reps', e.target.value)
                    }
                    className="w-16 rounded-lg border border-gray-700 bg-gray-800 px-2 py-1.5 text-center text-white outline-none focus:border-emerald-500"
                  />
                  <span className="text-xs text-gray-500">Wdh.</span>

                  <button
                    onClick={() => toggleComplete(exIndex, setIndex)}
                    className={`ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition ${
                      set.completed
                        ? 'border-emerald-500 bg-emerald-500 text-gray-950'
                        : 'border-gray-700 text-gray-500 hover:border-gray-500'
                    }`}
                  >
                    ✓
                  </button>
                </div>
              ))}
            </div>

            {ex.sets.some((s) => s.previous) && (
              <p className="mt-3 text-xs text-gray-500">
                Letztes Mal:{' '}
                {ex.sets
                  .filter((s) => s.previous)
                  .map(
                    (s) =>
                      `${s.previous?.weight_kg ?? '-'} kg × ${s.previous?.reps ?? '-'}`
                  )
                  .join(' | ')}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
