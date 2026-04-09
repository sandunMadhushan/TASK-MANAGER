import { Router } from 'express'

import {
  changePasswordHandler,
  forgotPasswordHandler,
  loginHandler,
  meHandler,
  resetPasswordHandler,
  signupHandler,
} from '../controllers/auth-controller.js'
import { requireAuth } from '../middleware/auth-middleware.js'

export const authRouter = Router()

authRouter.post('/login', loginHandler)
authRouter.post('/signup', signupHandler)
authRouter.post('/forgot-password', forgotPasswordHandler)
authRouter.post('/reset-password', resetPasswordHandler)
authRouter.get('/me', requireAuth, meHandler)
authRouter.post('/change-password', requireAuth, changePasswordHandler)

