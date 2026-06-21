import { prisma } from '../lib/prisma.js'
import { getTokenFromHeader, signToken, verifyAccessToken } from '../lib/jwt.js'

export { signToken }

export async function authMiddleware(req, res, next) {
  const token = getTokenFromHeader(req.headers.authorization)
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized', code: 'NO_TOKEN' })
  }

  try {
    const payload = verifyAccessToken(token)
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true },
    })
    if (!user) {
      return res.status(401).json({ error: 'User not found', code: 'USER_NOT_FOUND' })
    }
    req.userId = payload.sub
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' })
    }
    return res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' })
  }
}

/** Optional auth — attaches userId when a valid token is present. */
export async function optionalAuthMiddleware(req, _res, next) {
  const token = getTokenFromHeader(req.headers.authorization)
  if (!token) return next()
  try {
    const payload = verifyAccessToken(token)
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true },
    })
    if (user) req.userId = payload.sub
  } catch {
    /* ignore invalid optional token */
  }
  next()
}
