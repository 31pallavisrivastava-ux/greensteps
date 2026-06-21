import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const TITLES: Record<string, string> = {
  '/': 'Home',
  '/log': 'Log',
  '/trips': 'Trips',
  '/fuel': 'Fuel',
  '/energy': 'Energy',
  '/purchases': 'Purchases',
  '/plastic': 'Plastic',
  '/insights': 'Impact',
  '/guide': 'Guide',
  '/class': 'Class',
  '/settings': 'Settings',
  '/onboarding': 'Setup',
  '/login': 'Sign in',
}

export function usePageTitle() {
  const { pathname } = useLocation()

  useEffect(() => {
    const base = TITLES[pathname] ?? 'GreenSteps'
    document.title = `${base} — GreenSteps`
  }, [pathname])
}
