import {
  notifyTeamInviteAccepted,
  notifyTeamInviteDeclined,
  notifyTeamInviteJoined,
  notifyTeamInviteSent,
  getNotificationFeed,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  sendDeadlineNearReminders,
} from '../services/notification-service.js'
import {
  acceptTeamInvite as acceptTeamInviteAction,
  declineTeamInvite as declineTeamInviteAction,
  getPendingTeamInvitesForUser as getPendingTeamInvitesAction,
} from '../services/team-invite-service.js'
import { getUserById } from '../services/user-service.js'

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
    const currentUserId = req.user?.id
    if (!subscriberId) {
      return res.status(400).json({ message: 'Missing subscriberId' })
    }
    if (!currentUserId || subscriberId !== currentUserId) {
      return res.status(403).json({ message: 'Forbidden' })
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
    const currentUserId = req.user?.id
    if (!subscriberId) {
      return res.status(400).json({ message: 'Missing subscriberId' })
    }
    if (!currentUserId || subscriberId !== currentUserId) {
      return res.status(403).json({ message: 'Forbidden' })
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
    const currentUserId = req.user?.id
    if (!subscriberId) {
      return res.status(400).json({ message: 'Missing subscriberId' })
    }
    if (!currentUserId || subscriberId !== currentUserId) {
      return res.status(403).json({ message: 'Forbidden' })
    }
    const result = await markAllNotificationsRead(subscriberId)
    return res.status(200).json({ subscriberId, ...result })
  } catch (error) {
    return next(error)
  }
}

export async function getTeamInvitesHandler(req, res, next) {
  try {
    const currentUserId = req.user?.id
    const currentUserEmail = req.user?.email
    if (!currentUserId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
    const invites = await getPendingTeamInvitesAction(currentUserId, currentUserEmail)
    return res.status(200).json({ invites })
  } catch (error) {
    return next(error)
  }
}

export async function acceptTeamInviteHandler(req, res, next) {
  try {
    const currentUser = req.user
    const { inviteId } = req.params
    if (!currentUser?.id) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
    if (!inviteId) {
      return res.status(400).json({ message: 'Missing inviteId' })
    }
    const result = await acceptTeamInviteAction(inviteId, currentUser)
    if (!result.ok) {
      return res.status(result.statusCode).json({ message: result.message })
    }

    const inviter = await getUserById(String(result.invite.inviterUserId ?? ''))
    const invitee = await getUserById(String(currentUser.id))
    if (inviter && invitee) {
      await notifyTeamInviteAccepted(inviter, {
        type: 'team-invite-response',
        status: 'accepted',
        inviteId: result.invite.id,
        inviteeName: invitee.name,
        inviteeEmail: invitee.email,
        message: `${invitee.name} accepted your team invite.`,
      })
      await notifyTeamInviteJoined(invitee, {
        type: 'team-invite-joined',
        status: 'accepted',
        inviteId: result.invite.id,
        inviterName: result.invite.inviterName,
        message: `You were added to ${result.invite.inviterName}'s team successfully.`,
      })
    }
    return res.status(200).json({ message: 'Invite accepted.', invite: result.invite })
  } catch (error) {
    return next(error)
  }
}

export async function declineTeamInviteHandler(req, res, next) {
  try {
    const currentUser = req.user
    const { inviteId } = req.params
    if (!currentUser?.id) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
    if (!inviteId) {
      return res.status(400).json({ message: 'Missing inviteId' })
    }
    const result = await declineTeamInviteAction(inviteId, currentUser)
    if (!result.ok) {
      return res.status(result.statusCode).json({ message: result.message })
    }

    const inviter = await getUserById(String(result.invite.inviterUserId ?? ''))
    const invitee = await getUserById(String(currentUser.id))
    if (inviter && invitee) {
      await notifyTeamInviteDeclined(inviter, {
        type: 'team-invite-response',
        status: 'declined',
        inviteId: result.invite.id,
        inviteeName: invitee.name,
        inviteeEmail: invitee.email,
        message: `${invitee.name} declined your team invite.`,
      })
    }
    return res.status(200).json({ message: 'Invite declined.', invite: result.invite })
  } catch (error) {
    return next(error)
  }
}
