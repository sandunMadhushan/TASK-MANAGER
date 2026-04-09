import jwt from 'jsonwebtoken'

import { env } from '../config/env.js'

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      email: user.email,
      name: user.name,
      workspaceId: user.workspaceId ? String(user.workspaceId) : String(user.id),
    },
    env.authJwtSecret,
    { expiresIn: env.authJwtExpiresIn }
  )
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.authJwtSecret)
}

