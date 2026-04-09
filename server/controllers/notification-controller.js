import {
  getNotificationFeed,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  sendDeadlineNearReminders,
} from '../services/notification-service.js'

export async function sendDeadlineRemindersHandler(req, res, next) {
  try {
    const hours = Number(req.body?.hoursAhead ?? 24)
    const hoursAhead = Number.isFinite(hours) && hours > 0 ? hours : 24

    const result = await sendDeadlineNearReminders(hoursAhead)
    return res.status(200).json({
      message: 'Deadline reminder job completed',
      hoursAhead,
      ...result,
    })
  } catch (error) {
    return next(error)
  }
}

export async function getUnreadCountHandler(req, res, next) {
  try {
    const { subscriberId } = req.params
    if (!subscriberId) {
      return res.status(400).json({ message: 'Missing subscriberId' })
    }

    const unreadCount = await getUnreadNotificationCount(subscriberId)
    return res.status(200).json({ subscriberId, unreadCount })
  } catch (error) {
    return next(error)
  }
}

export async function getNotificationFeedHandler(req, res, next) {
  try {
    const { subscriberId } = req.params
    if (!subscriberId) {
      return res.status(400).json({ message: 'Missing subscriberId' })
    }
    const limitRaw = Number(req.query?.limit ?? 20)
    const limit = Number.isFinite(limitRaw) ? limitRaw : 20
    const unreadOnly = String(req.query?.unreadOnly ?? 'false') === 'true'

    const notifications = await getNotificationFeed(subscriberId, { limit, unreadOnly })
    return res.status(200).json({ subscriberId, notifications })
  } catch (error) {
    return next(error)
  }
}

export async function markAllReadHandler(req, res, next) {
  try {
    const { subscriberId } = req.params
    if (!subscriberId) {
      return res.status(400).json({ message: 'Missing subscriberId' })
    }
    const result = await markAllNotificationsRead(subscriberId)
    return res.status(200).json({ subscriberId, ...result })
  } catch (error) {
    return next(error)
  }
}
