import { getUsers } from '../services/user-service.js'
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
