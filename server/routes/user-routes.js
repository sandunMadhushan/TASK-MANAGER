import { Router } from 'express'

import { getUsersHandler } from '../controllers/user-controller.js'

export const userRouter = Router()

userRouter.get('/', getUsersHandler)
