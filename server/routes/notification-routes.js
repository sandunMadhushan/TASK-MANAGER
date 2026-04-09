import { Router } from 'express'

import {
  getUnreadCountHandler,
  sendDeadlineRemindersHandler,
} from '../controllers/notification-controller.js'

export const notificationRouter = Router()

notificationRouter.post('/deadline-reminders', sendDeadlineRemindersHandler)
notificationRouter.get('/unread-count/:subscriberId', getUnreadCountHandler)
