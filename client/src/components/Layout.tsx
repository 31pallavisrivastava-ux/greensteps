import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BarChart3, BookOpen, Home, Leaf, LogOut, PenLine, Settings } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { LOG_ROUTES } from '../lib/logActions'
import { SkipLink } from './SkipLink'
import { usePageTitle } from '../lib/usePageTitle'

const nav = [
  { to: '/', icon: Home, label: 'Home', short: 'Home', end: true },
  { to: '/log', icon: PenLine, label: 'Log', short: 'Log', match: LOG_ROUTES },
  { to: '/guide', icon: BookOpen, label: 'Guide', short: 'Guide' },
  { to: '/insights', icon: BarChart3, label: 'Impact', short: 'Impact' },
]

function isNavActive(pathname: string, item: (typeof nav)[number]) {
  if (item.match) {
    return item.match.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  }
  if (item.end) return pathname === item.to
  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  usePageTitle()

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-slate-100">
      <SkipLink />
      <header className="sticky top-0 z-10 border-b-2 border-slate-900 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border-2 border-slate-900 bg-brand">
              <Leaf className="h-5 w-5 text-white" aria-hidden />
            </div>
            <span className="text-base font-black text-brand">GreenSteps</span>
          </div>
          <div className="flex items-center gap-2">
            {user?.name && (
              <span className="hidden text-sm font-bold text-slate-600 sm:inline">
                {user.name.split(' ')[0]}
              </span>
            )}
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-md border-2 border-slate-900 bg-white hover:bg-slate-50"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => {
                logout()
                navigate('/login')
              }}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-md border-2 border-slate-900 bg-white hover:bg-slate-50"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1 overflow-y-auto px-4 py-4 pb-20" tabIndex={-1}>
        <Outlet />
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-10 mx-auto max-w-lg border-t-2 border-slate-900 bg-white"
        aria-label="Main menu"
      >
        <div className="grid grid-cols-4 px-1 py-1">
          {nav.map(({ to, icon: Icon, label, short, end }) => {
            const active = isNavActive(pathname, nav.find((n) => n.to === to)!)
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
                className={`m-1 flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-md border-2 py-2 text-[10px] font-black transition ${
                  active
                    ? 'border-brand bg-brand text-white'
                    : 'border-transparent text-slate-600 hover:border-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} aria-hidden />
                {short}
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
