import { Router } from 'express'

import {
  createUserHandler,
  deleteUserHandler,
  getNovuSubscriberAuthHandler,
  getUsersHandler,
  updateUserHandler,
} from '../controllers/user-controller.js'

export const userRouter = Router()

userRouter.get('/', getUsersHandler)
userRouter.post('/', createUserHandler)
userRouter.get('/:userId/novu-auth', getNovuSubscriberAuthHandler)
userRouter.patch('/:userId', updateUserHandler)
userRouter.delete('/:userId', deleteUserHandler)
