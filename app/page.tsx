import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4 text-center">
      <h1 className="text-4xl font-extrabold text-white sm:text-5xl">
        aklfit
      </h1>
      <p className="mt-4 max-w-md text-gray-400">
        Deine persönliche Trainings-App: Pläne erstellen, Workouts loggen und
        Fortschritte verfolgen.
      </p>

      <div className="mt-8 flex gap-4">
        <Link
          href="/login"
          className="rounded-lg border border-gray-700 px-6 py-2.5 font-semibold text-white transition hover:bg-gray-800"
        >
          Einloggen
        </Link>
        <Link
          href="/signup"
          className="rounded-lg bg-emerald-500 px-6 py-2.5 font-semibold text-gray-950 transition hover:bg-emerald-400"
        >
          Registrieren
        </Link>
      </div>
    </div>
  )
}
