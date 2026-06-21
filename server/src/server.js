import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
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

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors())
app.use(morgan('dev'))
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'carbon-footprint-api' })
})

app.use('/api/auth', authRouter)
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

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`Carbon footprint API listening on http://localhost:${PORT}`)
})
