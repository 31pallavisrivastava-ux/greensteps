import { useCallback } from 'react'

/** Arrow-key navigation for WAI-ARIA radiogroups. */
export function useRadioGroup<T extends string>(
  value: T,
  options: readonly T[],
  onChange: (next: T) => void
) {
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const idx = options.indexOf(value)
      if (idx < 0) return
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault()
        onChange(options[(idx + 1) % options.length])
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault()
        onChange(options[(idx - 1 + options.length) % options.length])
      }
    },
    [value, options, onChange]
  )
  return { onKeyDown }
}
