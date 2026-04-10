import dotenv from 'dotenv'

dotenv.config()

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGODB_URI ?? '',
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  novuSecretKey: process.env.NOVU_API_KEY ?? '',
  novuApplicationIdentifier: process.env.VITE_NOVU_APPLICATION_IDENTIFIER ?? '',
  novuBackendUrl: process.env.NOVU_BACKEND_URL ?? '',
  novuWorkflowTaskAssigned: process.env.NOVU_WORKFLOW_TASK_ASSIGNED ?? '',
  novuWorkflowTaskCompleted: process.env.NOVU_WORKFLOW_TASK_COMPLETED ?? '',
  novuWorkflowDeadlineNear: process.env.NOVU_WORKFLOW_DEADLINE_NEAR ?? '',
  novuWorkflowPasswordReset: process.env.NOVU_WORKFLOW_PASSWORD_RESET ?? '',
  novuWorkflowTeamInviteSent: process.env.NOVU_WORKFLOW_TEAM_INVITE_SENT ?? '',
  novuWorkflowTeamInviteAccepted: process.env.NOVU_WORKFLOW_TEAM_INVITE_ACCEPTED ?? '',
  novuWorkflowTeamInviteDeclined: process.env.NOVU_WORKFLOW_TEAM_INVITE_DECLINED ?? '',
  novuWorkflowTeamInviteJoined: process.env.NOVU_WORKFLOW_TEAM_INVITE_JOINED ?? '',
  authJwtSecret: process.env.AUTH_JWT_SECRET ?? '',
  authJwtExpiresIn: process.env.AUTH_JWT_EXPIRES_IN ?? '7d',
  authDefaultPassword: process.env.AUTH_DEFAULT_PASSWORD ?? 'Pass@12345',
  authPasswordResetTokenMinutes: Number(process.env.AUTH_PASSWORD_RESET_TOKEN_MINUTES ?? 30),
}

export function validateEnv() {
  if (!env.mongoUri) {
    throw new Error(
      'Missing MONGODB_URI. Create a .env file using .env.example and set a MongoDB connection string.'
    )
  }
  if (!env.authJwtSecret) {
    throw new Error(
      'Missing AUTH_JWT_SECRET. Create a .env file using .env.example and set a secure JWT secret.'
    )
  }
}
