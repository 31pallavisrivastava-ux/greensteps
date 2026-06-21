import { useCallback, useState } from 'react'
import { getErrorMessage } from './api'

/** Wrap async form submits with loading state and user-visible errors. */
export function useSubmit() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async (fn: () => Promise<void>) => {
    setSubmitting(true)
    setError(null)
    try {
      await fn()
      return true
    } catch (e) {
      setError(getErrorMessage(e))
      return false
    } finally {
      setSubmitting(false)
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { submitting, error, run, clearError }
}
