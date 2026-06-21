import { useCallback, useState } from 'react'

/** Brief "saved" UI feedback after form submit — avoids duplicating setTimeout in every page. */
export function useSaveFeedback(durationMs = 2500) {
  const [saved, setSaved] = useState(false)

  const markSaved = useCallback(() => {
    setSaved(true)
    window.setTimeout(() => setSaved(false), durationMs)
  }, [durationMs])

  return { saved, markSaved }
}
