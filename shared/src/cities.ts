import type { CityOption } from './types.js'

/** Keep in sync with server/data/indian-cities.json */
export const INDIAN_CITY_OPTIONS: CityOption[] = [
  { name: 'Delhi', lat: 28.6139, lng: 77.209, state: 'IN-DL' },
  { name: 'Mumbai', lat: 19.076, lng: 72.8777, state: 'IN-MH' },
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946, state: 'IN-KA' },
  { name: 'Hyderabad', lat: 17.385, lng: 78.4867, state: 'IN-TG' },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707, state: 'IN-TN' },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639, state: 'IN-WB' },
  { name: 'Pune', lat: 18.5204, lng: 73.8567, state: 'IN-MH' },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714, state: 'IN-GJ' },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873, state: 'IN-RJ' },
  { name: 'Lucknow', lat: 26.8467, lng: 80.9462, state: 'IN-UP' },
  { name: 'Noida', lat: 28.5355, lng: 77.391, state: 'IN-UP' },
  { name: 'Gurugram', lat: 28.4595, lng: 77.0266, state: 'IN-HR' },
]

/** Accept legacy string[] or CityOption[] from API */
export function normalizeCityOptions(data: unknown): CityOption[] {
  if (!Array.isArray(data) || data.length === 0) return INDIAN_CITY_OPTIONS
  if (typeof data[0] === 'string') {
    const names = new Set(data as string[])
    return INDIAN_CITY_OPTIONS.filter((c) => names.has(c.name))
  }
  return data as CityOption[]
}
