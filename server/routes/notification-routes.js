import { Router } from 'express'

import {
  acceptTeamInviteHandler,
  declineTeamInviteHandler,
  getNotificationFeedHandler,
  getTeamInvitesHandler,
  getUnreadCountHandler,
  markAllReadHandler,
  sendDeadlineRemindersHandler,
} from '../controllers/notification-controller.js'

export const notificationRouter = Router()

notificationRouter.post('/deadline-reminders', sendDeadlineRemindersHandler)
notificationRouter.get('/unread-count/:subscriberId', getUnreadCountHandler)
notificationRouter.get('/feed/:subscriberId', getNotificationFeedHandler)
notificationRouter.post('/mark-all-read/:subscriberId', markAllReadHandler)
notificationRouter.get('/team-invites', getTeamInvitesHandler)
notificationRouter.post('/team-invites/:inviteId/accept', acceptTeamInviteHandler)
notificationRouter.post('/team-invites/:inviteId/decline', declineTeamInviteHandler)
