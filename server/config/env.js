import dotenv from 'dotenv'

dotenv.config()

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGODB_URI ?? '',
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  novuSecretKey: process.env.NOVU_API_KEY ?? '',
  novuBackendUrl: process.env.NOVU_BACKEND_URL ?? '',
  novuWorkflowTaskAssigned: process.env.NOVU_WORKFLOW_TASK_ASSIGNED ?? '',
  novuWorkflowTaskCompleted: process.env.NOVU_WORKFLOW_TASK_COMPLETED ?? '',
  novuWorkflowDeadlineNear: process.env.NOVU_WORKFLOW_DEADLINE_NEAR ?? '',
}

export function validateEnv() {
  if (!env.mongoUri) {
    throw new Error(
      'Missing MONGODB_URI. Create a .env file using .env.example and set a MongoDB connection string.'
    )
  }
}
