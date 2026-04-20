import { verifyAccessToken } from '../services/auth-service.js'
import { getUserById } from '../services/user-service.js'

/**
 * Loads the user from the DB after JWT verification so `workspaceId` stays
 * correct if an admin moved this account to another workspace (team invite).
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    const payload = verifyAccessToken(token)
    const user = await getUserById(String(payload.sub))
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      workspaceId: user.workspaceId ? String(user.workspaceId) : String(user.id),
      workspaceIds:
        Array.isArray(user.workspaceIds) && user.workspaceIds.length > 0
          ? user.workspaceIds.map((id) => String(id))
          : [user.workspaceId ? String(user.workspaceId) : String(user.id)],
    }
    return next()
  } catch {
    return res.status(401).json({ message: 'Unauthorized' })
  }
}

