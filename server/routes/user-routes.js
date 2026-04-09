import { Router } from 'express'

import {
  getNovuSubscriberAuthHandler,
  getUsersHandler,
} from '../controllers/user-controller.js'

export const userRouter = Router()

userRouter.get('/', getUsersHandler)
userRouter.get('/:userId/novu-auth', getNovuSubscriberAuthHandler)
