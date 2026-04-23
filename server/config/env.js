import dotenv from 'dotenv'

dotenv.config()

const nodeEnv = process.env.NODE_ENV ?? 'development'

/** Canonical origin string (scheme + host + port) for CORS and email links. */
function normalizeClientOriginEntry(entry) {
  const t = entry.trim()
  if (!t) return ''
  try {
    return new URL(t).origin
  } catch {
    return t.replace(/\/$/, '')
  }
}

function parseClientOrigins(raw) {
  const fromEnv = typeof raw === 'string' ? raw.trim() : ''
  if (fromEnv) {
    return fromEnv
      .split(',')
      .map((s) => normalizeClientOriginEntry(s))
      .filter(Boolean)
  }
  if (nodeEnv === 'production') {
    return []
  }
  return ['http://localhost:5173']
}

const clientOrigins = parseClientOrigins(process.env.CLIENT_ORIGIN)

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGODB_URI ?? '',
  /** First origin: used in emails (welcome, reset). All entries are allowed for CORS. */
  clientOrigin: clientOrigins[0] ?? (nodeEnv === 'production' ? '' : 'http://localhost:5173'),
  clientOrigins,
  novuSecretKey: process.env.NOVU_API_KEY ?? '',
  novuApplicationIdentifier: process.env.VITE_NOVU_APPLICATION_IDENTIFIER ?? '',
  novuBackendUrl: process.env.NOVU_BACKEND_URL ?? '',
  novuWorkflowTaskAssigned: process.env.NOVU_WORKFLOW_TASK_ASSIGNED ?? '',
  novuWorkflowTaskCompleted: process.env.NOVU_WORKFLOW_TASK_COMPLETED ?? '',
  novuWorkflowDeadlineNear: process.env.NOVU_WORKFLOW_DEADLINE_NEAR ?? '',
  novuWorkflowPasswordReset: process.env.NOVU_WORKFLOW_PASSWORD_RESET ?? '',
  novuWorkflowWelcome: process.env.NOVU_WORKFLOW_WELCOME ?? '',
  novuWorkflowTeamInviteSent: process.env.NOVU_WORKFLOW_TEAM_INVITE_SENT ?? '',
  novuWorkflowTeamInviteAccepted: process.env.NOVU_WORKFLOW_TEAM_INVITE_ACCEPTED ?? '',
  novuWorkflowTeamInviteDeclined: process.env.NOVU_WORKFLOW_TEAM_INVITE_DECLINED ?? '',
  novuWorkflowTeamInviteJoined: process.env.NOVU_WORKFLOW_TEAM_INVITE_JOINED ?? '',
  novuWorkflowProjectCreated: process.env.NOVU_WORKFLOW_PROJECT_CREATED ?? '',
  novuWorkflowProjectDeleted: process.env.NOVU_WORKFLOW_PROJECT_DELETED ?? '',
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
  if (env.nodeEnv === 'production' && env.clientOrigins.length === 0) {
    throw new Error(
      'CLIENT_ORIGIN is required in production. Set it to your public web app URL (e.g. https://your-app.vercel.app). Use a comma-separated list if you need more than one origin for CORS.'
    )
  }
}
