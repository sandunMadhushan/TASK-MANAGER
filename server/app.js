import cors from 'cors'
import express from 'express'
import morgan from 'morgan'

import { env } from './config/env.js'
import { requireAuth } from './middleware/auth-middleware.js'
import { authRouter } from './routes/auth-routes.js'
import { notificationRouter } from './routes/notification-routes.js'
import { taskRouter } from './routes/task-routes.js'
import { userRouter } from './routes/user-routes.js'

export const app = express()

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true)
      }
      if (env.clientOrigins.includes(origin)) {
        return callback(null, true)
      }
      return callback(null, false)
    },
  })
)
app.use(express.json({ limit: '6mb' }))
app.use(morgan('dev'))

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok' })
})

app.use('/api/auth', authRouter)
app.use('/api', requireAuth)
app.use('/api/tasks', taskRouter)
app.use('/api/users', userRouter)
app.use('/api/notifications', notificationRouter)

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
