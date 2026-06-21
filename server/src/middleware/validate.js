/** Express middleware — parse req.body with Zod; errors flow to global handler. */
export function validateBody(schema) {
  return (req, _res, next) => {
    try {
      req.body = schema.parse(req.body)
      next()
    } catch (err) {
      next(err)
    }
  }
}

/** Express middleware — validate req.query with Zod; parsed values on req.validatedQuery. */
export function validateQuery(schema) {
  return (req, _res, next) => {
    try {
      req.validatedQuery = schema.parse(req.query)
      next()
    } catch (err) {
      next(err)
    }
  }
}

/** Express middleware — validate req.params with Zod (does not replace read-only params). */
export function validateParams(schema) {
  return (req, _res, next) => {
    try {
      schema.parse(req.params)
      next()
    } catch (err) {
      next(err)
    }
  }
}
