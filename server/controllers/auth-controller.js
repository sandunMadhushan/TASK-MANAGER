import { signAccessToken } from '../services/auth-service.js'
import {
  createUser,
  ensureUserWorkspace,
  getUserByEmail,
  getUserById,
  getUserByPasswordResetToken,
  setPasswordResetTokenByEmail,
  updatePassword,
} from '../services/user-service.js'
import { env } from '../config/env.js'
import { hashPassword, verifyPassword } from '../services/password-service.js'
import { notifyPasswordReset, notifyWelcome } from '../services/notification-service.js'
import crypto from 'crypto'

export async function loginHandler(req, res, next) {
  try {
    const email = String(req.body?.email ?? '').trim().toLowerCase()
    const password = String(req.body?.password ?? '')
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' })
    }

    const foundUser = await getUserByEmail(email, { includePasswordHash: true })
    if (!foundUser) {
      return res.status(401).json({ message: 'Invalid credentials.' })
    }
    const validPassword = await verifyPassword(password, foundUser.passwordHash)
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials.' })
    }
    const user = await ensureUserWorkspace(foundUser.id)
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' })
    }

    const accessToken = signAccessToken(user)
    return res.status(200).json({ accessToken, user })
  } catch (error) {
    return next(error)
  }
}

export async function meHandler(req, res, next) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
    const user = await ensureUserWorkspace(userId)
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
    return res.status(200).json(user)
  } catch (error) {
    return next(error)
  }
}

export async function signupHandler(req, res, next) {
  try {
    const name = String(req.body?.name ?? '').trim()
    const email = String(req.body?.email ?? '').trim().toLowerCase()
    const password = String(req.body?.password ?? '')

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' })
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message:
          'Password must be at least 8 characters and include upper, lower, number, and symbol.',
      })
    }

    const existing = await getUserByEmail(email)
    if (existing) {
      return res.status(409).json({ message: 'A user with this email already exists.' })
    }

    const passwordHash = await hashPassword(password)
    const user = await createUser({ name, email, passwordHash })
    await runNotificationSafely(() =>
      notifyWelcome(user, {
        name: user.name,
        email: user.email,
        message: `Welcome to Nexus Tasks, ${user.name}! Your workspace is ready.`,
        appUrl: env.clientOrigin.replace(/\/$/, ''),
      })
    )
    const accessToken = signAccessToken(user)
    return res.status(201).json({ accessToken, user })
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'A user with this email already exists.' })
    }
    return next(error)
  }
}

export async function changePasswordHandler(req, res, next) {
  try {
    const userId = req.user?.id
    const currentPassword = String(req.body?.currentPassword ?? '')
    const newPassword = String(req.body?.newPassword ?? '')
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required.' })
    }
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        message:
          'New password must be at least 8 characters and include upper, lower, number, and symbol.',
      })
    }

    const user = await getUserById(userId, { includePasswordHash: true })
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
    const matches = await verifyPassword(currentPassword, user.passwordHash)
    if (!matches) {
      return res.status(401).json({ message: 'Current password is incorrect.' })
    }

    const passwordHash = await hashPassword(newPassword)
    await updatePassword(userId, passwordHash)
    return res.status(200).json({ message: 'Password updated.' })
  } catch (error) {
    return next(error)
  }
}

export async function forgotPasswordHandler(req, res, next) {
  try {
    const email = String(req.body?.email ?? '').trim().toLowerCase()
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const expiresAt = new Date(Date.now() + env.authPasswordResetTokenMinutes * 60_000)
    const user = await setPasswordResetTokenByEmail(email, tokenHash, expiresAt)
    if (user) {
      const resetUrl = `${env.clientOrigin.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`
      await notifyPasswordReset(user, {
        name: user.name,
        email: user.email,
        resetUrl,
        expiresInMinutes: env.authPasswordResetTokenMinutes,
      })
    }

    return res.status(200).json({
      message: 'If an account exists for this email, a password reset link has been sent.',
    })
  } catch (error) {
    return next(error)
  }
}

export async function resetPasswordHandler(req, res, next) {
  try {
    const token = String(req.body?.token ?? '').trim()
    const newPassword = String(req.body?.newPassword ?? '')
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required.' })
    }
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        message:
          'New password must be at least 8 characters and include upper, lower, number, and symbol.',
      })
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const user = await getUserByPasswordResetToken(tokenHash)
    if (!user) {
      return res.status(400).json({ message: 'Reset link is invalid or expired.' })
    }

    const passwordHash = await hashPassword(newPassword)
    await updatePassword(user.id, passwordHash)
    return res.status(200).json({ message: 'Password has been reset.' })
  } catch (error) {
    return next(error)
  }
}

function isStrongPassword(value) {
  if (value.length < 8) return false
  const hasUpper = /[A-Z]/.test(value)
  const hasLower = /[a-z]/.test(value)
  const hasNumber = /[0-9]/.test(value)
  const hasSymbol = /[^A-Za-z0-9]/.test(value)
  return hasUpper && hasLower && hasNumber && hasSymbol
}

async function runNotificationSafely(notify) {
  try {
    await notify()
  } catch (error) {
    console.warn('Notification dispatch failed:', error?.message ?? error)
  }
}

