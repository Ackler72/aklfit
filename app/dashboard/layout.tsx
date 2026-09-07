import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

const navItems = [
  { href: '/dashboard', label: 'Übersicht' },
  { href: '/dashboard/plans', label: 'Pläne' },
  { href: '/dashboard/exercises', label: 'Übungen' },
  { href: '/dashboard/progress', label: 'Fortschritt' },
  { href: '/dashboard/calendar', label: 'Kalender' },
  { href: '/dashboard/profile', label: 'Profil' },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <span className="text-lg font-bold text-emerald-400">aklfit</span>
          <LogoutButton />
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-gray-400 transition hover:bg-gray-800 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  )
}
