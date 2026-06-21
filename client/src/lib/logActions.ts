import type { LucideIcon } from 'lucide-react'
import { Droplets, Fuel, MapPin, ShoppingBag, Zap } from 'lucide-react'

export interface LogAction {
  to: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
  title: string
  subtitle: string
  group: 'travel' | 'home' | 'shopping'
}

export const LOG_ACTIONS: LogAction[] = [
  {
    to: '/trips',
    icon: MapPin,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-700',
    title: 'Record a trip',
    subtitle: 'Bus, metro, car, bike, or walk',
    group: 'travel',
  },
  {
    to: '/fuel',
    icon: Fuel,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-700',
    title: 'Add petrol / diesel',
    subtitle: 'Log when you fill fuel in your vehicle',
    group: 'travel',
  },
  {
    to: '/energy',
    icon: Zap,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-700',
    title: 'Add electricity bill',
    subtitle: 'Enter units (kWh) from your home bill',
    group: 'home',
  },
  {
    to: '/purchases',
    icon: ShoppingBag,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-700',
    title: 'Add a delivery order',
    subtitle: 'Blinkit, Zepto, Swiggy, or Zomato',
    group: 'shopping',
  },
  {
    to: '/plastic',
    icon: Droplets,
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-700',
    title: 'Log plastic waste',
    subtitle: 'Did you recycle or put it in the bin?',
    group: 'shopping',
  },
]

export const LOG_ROUTES = ['/log', ...LOG_ACTIONS.map((a) => a.to)]

export const LOG_GROUPS = [
  { id: 'travel' as const, label: 'Travel & fuel' },
  { id: 'home' as const, label: 'Home energy' },
  { id: 'shopping' as const, label: 'Orders & plastic' },
]
