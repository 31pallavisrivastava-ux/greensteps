import { NavLink, Outlet } from 'react-router-dom'
import {
  BarChart3,
  Droplets,
  Fuel,
  Home,
  Leaf,
  MapPin,
  ShoppingBag,
  Zap,
} from 'lucide-react'

const nav = [
  { to: '/', icon: Home, label: 'Today' },
  { to: '/trips', icon: MapPin, label: 'Trips' },
  { to: '/fuel', icon: Fuel, label: 'Fuel' },
  { to: '/energy', icon: Zap, label: 'Energy' },
  { to: '/purchases', icon: ShoppingBag, label: 'Orders' },
  { to: '/plastic', icon: Droplets, label: 'Plastic' },
  { to: '/insights', icon: BarChart3, label: 'Insights' },
]

export function Layout() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <Leaf className="h-6 w-6 text-brand-light" />
          <div>
            <h1 className="text-sm font-semibold text-brand">Carbon Footprint</h1>
            <p className="text-xs text-slate-500">GHG Protocol · NCMA India aligned</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-24">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-10 mx-auto max-w-lg border-t border-slate-200 bg-white">
        <div className="flex justify-around px-1 py-2">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[10px] ${
                  isActive ? 'text-brand font-medium' : 'text-slate-400'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
