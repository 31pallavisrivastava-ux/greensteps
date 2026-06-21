import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { authRouter } from './routes/auth.js'
import { tripsRouter } from './routes/trips.js'
import { fuelRouter } from './routes/fuel.js'
import { energyRouter } from './routes/energy.js'
import { purchasesRouter } from './routes/purchases.js'
import { plasticRouter } from './routes/plastic.js'
import { emissionsRouter, insightsRouter } from './routes/insights.js'
import { packagingRouter, usersRouter } from './routes/users.js'
import { offlineRouter } from './routes/offline.js'
import { guideRouter } from './routes/guide.js'
import { engageRouter } from './routes/engage.js'
import { groupsRouter } from './routes/groups.js'
import { familyRouter } from './routes/family.js'
import { coachRouter } from './routes/coach.js'
import { prisma } from './lib/prisma.js'
import { assertProductionSecrets, apiRateLimiter, authRateLimiter, corsOptions, securityMiddleware } from './middleware/security.js'
import { isBadRequestError, zodErrorBody } from './lib/http.js'

export function createApp() {
  assertProductionSecrets()

  const app = express()

  app.use(securityMiddleware())
  app.use(cors(corsOptions()))
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
  app.use(express.json({ limit: '2mb' }))

  app.get('/api/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`
      res.json({
        status: 'ok',
        service: 'carbon-footprint-api',
        db: 'connected',
        routes: ['insights/personal', 'insights/history', 'family', 'coach'],
      })
    } catch (e) {
      console.error('Health check DB error:', e)
      res.status(503).json({ status: 'degraded', error: 'Database unavailable' })
    }
  })

  app.use('/api', apiRateLimiter())
  app.use('/api/auth', authRateLimiter(), authRouter)
  app.use('/api/users', usersRouter)
  app.use('/api/trips', tripsRouter)
  app.use('/api/fuel', fuelRouter)
  app.use('/api/energy', energyRouter)
  app.use('/api/purchases', purchasesRouter)
  app.use('/api/plastic', plasticRouter)
  app.use('/api/emissions', emissionsRouter)
  app.use('/api/insights', insightsRouter)
  app.use('/api/packaging', packagingRouter)
  app.use('/api/offline', offlineRouter)
  app.use('/api/guide', guideRouter)
  app.use('/api/engage', engageRouter)
  app.use('/api/groups', groupsRouter)
  app.use('/api/family', familyRouter)
  app.use('/api/coach', coachRouter)

  if (process.env.NODE_ENV === 'production') {
    const clientDist = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist')
    app.use(express.static(clientDist))
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'))
    })
  }

  app.use((err, _req, res, _next) => {
    if (err instanceof z.ZodError) {
      return res.status(400).json(zodErrorBody(err))
    }
    if (isBadRequestError(err)) {
      return res.status(400).json({ error: err.message })
    }
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  })

  return app
}
