import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

const NAV = [
  { to: '/recipes',   label: 'Recipes' },
  { to: '/planner',   label: 'Planner' },
  { to: '/shopping',  label: 'Shopping' },
  { to: '/inventory', label: 'Inventory' },
  { to: '/chat',      label: 'AI Chat' },
]

export function AppShell() {
  const { signOut } = useAuth()

  return (
    <div className="min-h-screen bg-cream">
      {/* Desktop top nav */}
      <header className="bg-navy-800 border-b border-navy-900 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <img src="/francois_logo_no_bg.png" alt="" className="h-8 w-auto" />
            <span className="font-display font-semibold text-cream text-lg tracking-wide">FrancoisAI</span>
          </div>
          <nav className="hidden md:flex gap-1">
            {NAV.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-amber-600 text-white'
                      : 'text-navy-200 hover:text-white hover:bg-navy-700'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <button
            onClick={signOut}
            className="hidden md:block text-sm text-navy-300 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-6">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex z-10">
        {NAV.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 py-3 text-xs text-center font-medium transition-colors ${
                isActive ? 'text-amber-600' : 'text-gray-500'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
