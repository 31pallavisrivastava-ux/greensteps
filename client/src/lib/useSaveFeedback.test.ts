import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useSaveFeedback } from './useSaveFeedback'

describe('useSaveFeedback', () => {
  it('should initialize with saved as false', () => {
    const { result } = renderHook(() => useSaveFeedback())
    expect(result.current.saved).toBe(false)
  })

  it('should set saved to true when markSaved is called, then false after duration', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useSaveFeedback(1000))

    act(() => {
      result.current.markSaved()
    })

    expect(result.current.saved).toBe(true)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.saved).toBe(false)
    vi.useRealTimers()
  })
})
