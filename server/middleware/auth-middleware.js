import { verifyAccessToken } from '../services/auth-service.js'

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    const payload = verifyAccessToken(token)
    req.user = {
      id: String(payload.sub),
      email: String(payload.email ?? ''),
      name: String(payload.name ?? ''),
      workspaceId: String(payload.workspaceId ?? payload.sub ?? ''),
    }
    return next()
  } catch {
    return res.status(401).json({ message: 'Unauthorized' })
  }
}

