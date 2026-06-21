import { z } from 'zod'

/** Wrap async route handlers — errors flow to the global error middleware. */
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
}

/** Standard JSON error body for Zod validation failures. */
export function zodErrorBody(error) {
  return { error: error.errors }
}

/** Parse optional ISO date query params; throws Error with label on invalid input. */
export function parseOptionalDate(value, label) {
  if (value == null || value === '') return undefined
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${label} date`)
  }
  return date
}

/** Map route-level date parse errors to 400 responses. */
export function isBadRequestError(error) {
  return error instanceof Error && error.message.startsWith('Invalid ')
}

export { z }
