import { app } from './app.js'
import { connectDatabase } from './config/db.js'
import { env, validateEnv } from './config/env.js'

async function bootstrap() {
  validateEnv()
  await connectDatabase(env.mongoUri)

  app.listen(env.port, () => {
    console.log(`API server running on http://localhost:${env.port}`)
  })
}

bootstrap().catch((error) => {
  console.error('Failed to start API server:', error.message)
  process.exit(1)
})
