import { getUsers } from '../services/user-service.js'

export async function getUsersHandler(_req, res, next) {
  try {
    const users = await getUsers()
    return res.status(200).json(users)
  } catch (error) {
    return next(error)
  }
}
