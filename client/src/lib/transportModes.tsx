import {
  Bus,
  Car,
  Footprints,
  Bike,
  TrainFront,
  CarTaxiFront,
  CircleDot,
  type LucideIcon,
} from 'lucide-react'

export const TRANSPORT_MODES = [
  { id: 'WALK', label: 'Walking', icon: Footprints, category: 'Active' },
  { id: 'CYCLE', label: 'Cycling', icon: Bike, category: 'Active' },
  { id: 'BUS', label: 'Bus', icon: Bus, category: 'Public' },
  { id: 'METRO', label: 'Metro / Train', icon: TrainFront, category: 'Public' },
  { id: 'AUTO', label: 'Auto-rickshaw', icon: CircleDot, category: 'Public' },
  { id: 'CAR', label: 'Car', icon: Car, category: 'Private' },
  { id: 'BIKE', label: 'Scooter / Bike', icon: Bike, category: 'Private' },
  { id: 'TAXI', label: 'Taxi / Cab', icon: CarTaxiFront, category: 'Private' },
] as const

export type TransportModeId = (typeof TRANSPORT_MODES)[number]['id']

export function getModeInfo(id: string) {
  return TRANSPORT_MODES.find((m) => m.id === id) ?? TRANSPORT_MODES[5]
}

export function ModeIcon({ mode, className = 'h-5 w-5' }: { mode: string; className?: string }) {
  const Icon = getModeInfo(mode).icon as LucideIcon
  return <Icon className={className} aria-hidden />
}
