import { Router } from 'express'

import { loginHandler, meHandler, signupHandler } from '../controllers/auth-controller.js'
import { requireAuth } from '../middleware/auth-middleware.js'

export const authRouter = Router()

authRouter.post('/login', loginHandler)
authRouter.post('/signup', signupHandler)
authRouter.get('/me', requireAuth, meHandler)

