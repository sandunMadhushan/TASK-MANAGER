import { sendDeadlineNearReminders } from '../services/notification-service.js'

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
