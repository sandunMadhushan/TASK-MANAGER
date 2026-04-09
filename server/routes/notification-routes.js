import { Router } from 'express'

import {
  getNotificationFeedHandler,
  getUnreadCountHandler,
  markAllReadHandler,
  sendDeadlineRemindersHandler,
} from '../controllers/notification-controller.js'

export const notificationRouter = Router()

notificationRouter.post('/deadline-reminders', sendDeadlineRemindersHandler)
notificationRouter.get('/unread-count/:subscriberId', getUnreadCountHandler)
notificationRouter.get('/feed/:subscriberId', getNotificationFeedHandler)
notificationRouter.post('/mark-all-read/:subscriberId', markAllReadHandler)
