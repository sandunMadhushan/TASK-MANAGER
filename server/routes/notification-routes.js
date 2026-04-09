import { Router } from 'express'

import { sendDeadlineRemindersHandler } from '../controllers/notification-controller.js'

export const notificationRouter = Router()

notificationRouter.post('/deadline-reminders', sendDeadlineRemindersHandler)
