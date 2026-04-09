import { signAccessToken } from '../services/auth-service.js'
import { createUser, getUserByEmail, getUserById } from '../services/user-service.js'

export async function loginHandler(req, res, next) {
  try {
    const email = String(req.body?.email ?? '').trim().toLowerCase()
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' })
    }

    const user = await getUserByEmail(email)
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
    const user = await getUserById(userId)
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

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required.' })
    }

    const existing = await getUserByEmail(email)
    if (existing) {
      return res.status(409).json({ message: 'A user with this email already exists.' })
    }

    const user = await createUser({ name, email })
    const accessToken = signAccessToken(user)
    return res.status(201).json({ accessToken, user })
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'A user with this email already exists.' })
    }
    return next(error)
  }
}

