import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
} from '../services/user-service.js'
import { createNovuSubscriberHash } from '../services/novu-auth-service.js'

export async function getUsersHandler(req, res, next) {
  try {
    const workspaceId = req.user?.workspaceId
    const users = await getUsers(workspaceId)
    return res.status(200).json(users)
  } catch (error) {
    return next(error)
  }
}

export async function getNovuSubscriberAuthHandler(req, res, next) {
  try {
    const { userId } = req.params
    const currentUserId = req.user?.id
    if (!userId) {
      return res.status(400).json({ message: 'Missing userId' })
    }
    if (!currentUserId || userId !== currentUserId) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    return res.status(200).json({
      subscriberId: userId,
      subscriberHash: createNovuSubscriberHash(userId),
    })
  } catch (error) {
    return next(error)
  }
}

export async function createUserHandler(req, res, next) {
  try {
    const workspaceId = req.user?.workspaceId
    const name = String(req.body?.name ?? '').trim()
    const email = String(req.body?.email ?? '').trim().toLowerCase()
    const avatarUrl =
      req.body?.avatarUrl !== undefined ? String(req.body.avatarUrl).trim() : undefined
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required.' })
    }
    if (!isValidAvatarValue(avatarUrl)) {
      return res.status(400).json({ message: 'Avatar must be a valid image URL or uploaded image data.' })
    }
    const user = await createUser({ name, email, avatarUrl, workspaceId })
    return res.status(201).json(user)
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'A user with this email already exists.' })
    }
    return next(error)
  }
}

export async function updateUserHandler(req, res, next) {
  try {
    const workspaceId = req.user?.workspaceId
    const { userId } = req.params
    const name = req.body?.name !== undefined ? String(req.body.name).trim() : undefined
    const email =
      req.body?.email !== undefined ? String(req.body.email).trim().toLowerCase() : undefined
    const avatarUrl =
      req.body?.avatarUrl !== undefined ? String(req.body.avatarUrl).trim() : undefined

    if (name === '') {
      return res.status(400).json({ message: 'Name cannot be empty.' })
    }
    if (email === '') {
      return res.status(400).json({ message: 'Email cannot be empty.' })
    }
    if (!isValidAvatarValue(avatarUrl)) {
      return res.status(400).json({ message: 'Avatar must be a valid image URL or uploaded image data.' })
    }

    const user = await updateUser(userId, { name, email, avatarUrl }, workspaceId)
    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }
    return res.status(200).json(user)
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'A user with this email already exists.' })
    }
    return next(error)
  }
}

export async function deleteUserHandler(req, res, next) {
  try {
    const workspaceId = req.user?.workspaceId
    const { userId } = req.params
    const deleted = await deleteUser(userId, workspaceId)
    if (!deleted) {
      return res.status(404).json({ message: 'User not found.' })
    }
    return res.status(200).json({ message: 'User deleted.' })
  } catch (error) {
    return next(error)
  }
}

function isValidAvatarValue(value) {
  if (value === undefined) return true
  if (value === '') return true
  if (/^https?:\/\//i.test(value)) return true
  return /^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=]+$/i.test(value)
}
