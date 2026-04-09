import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
} from '../services/user-service.js'
import { createNovuSubscriberHash } from '../services/novu-auth-service.js'

export async function getUsersHandler(_req, res, next) {
  try {
    const users = await getUsers()
    return res.status(200).json(users)
  } catch (error) {
    return next(error)
  }
}

export async function getNovuSubscriberAuthHandler(req, res, next) {
  try {
    const { userId } = req.params
    if (!userId) {
      return res.status(400).json({ message: 'Missing userId' })
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
    const name = String(req.body?.name ?? '').trim()
    const email = String(req.body?.email ?? '').trim().toLowerCase()
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required.' })
    }
    const user = await createUser({ name, email })
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
    const { userId } = req.params
    const name = req.body?.name !== undefined ? String(req.body.name).trim() : undefined
    const email =
      req.body?.email !== undefined ? String(req.body.email).trim().toLowerCase() : undefined

    if (name === '') {
      return res.status(400).json({ message: 'Name cannot be empty.' })
    }
    if (email === '') {
      return res.status(400).json({ message: 'Email cannot be empty.' })
    }

    const user = await updateUser(userId, { name, email })
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
    const { userId } = req.params
    const deleted = await deleteUser(userId)
    if (!deleted) {
      return res.status(404).json({ message: 'User not found.' })
    }
    return res.status(200).json({ message: 'User deleted.' })
  } catch (error) {
    return next(error)
  }
}
