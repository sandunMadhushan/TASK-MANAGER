import cors from 'cors'
import express from 'express'
import morgan from 'morgan'

import { env } from './config/env.js'
import { taskRouter } from './routes/task-routes.js'

export const app = express()

app.use(
  cors({
    origin: env.clientOrigin,
  })
)
app.use(express.json())
app.use(morgan('dev'))

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok' })
})

app.use('/api/tasks', taskRouter)

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` })
})

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({
    message: 'Internal server error',
    error: env.nodeEnv === 'development' ? err.message : undefined,
  })
})
