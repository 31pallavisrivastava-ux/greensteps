import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage } from './api'

type LoadState<T> = {
  data: T | null
  error: string | null
  loading: boolean
}

/** Standard async page-load pattern with user-visible error state. */
export function usePageLoad<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<LoadState<T>>({
    data: null,
    error: null,
    loading: true,
  })

  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }))
    return loader()
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((e) => setState({ data: null, error: getErrorMessage(e), loading: false }))
  }, deps)

  useEffect(() => {
    reload()
  }, [reload])

  return { ...state, reload }
}
