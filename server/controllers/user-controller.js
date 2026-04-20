import {
  getUserByEmail,
  getUsers,
  removeMemberFromWorkspace,
  updateWorkspaceName,
  updateUser,
} from '../services/user-service.js'
import { createNovuSubscriberHash } from '../services/novu-auth-service.js'
import {
  cancelPendingTeamInvite,
  createTeamInvite,
  getPendingTeamInvitesForWorkspace,
} from '../services/team-invite-service.js'
import { notifyTeamInviteSent } from '../services/notification-service.js'
import { env } from '../config/env.js'

export async function getUsersHandler(req, res, next) {
  try {
    const workspaceIds = req.user?.workspaceIds ?? [req.user?.workspaceId]
    const users = await getUsers(workspaceIds)
    return res.status(200).json(users)
  } catch (error) {
    return next(error)
  }
}

export async function getNovuSubscriberAuthHandler(req, res, next) {
  try {
    const { userId } = req.params
    const currentUserId = req.user?.id
    if (!userId) {
      return res.status(400).json({ message: 'Missing userId' })
    }
    if (!currentUserId || userId !== currentUserId) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    return res.status(200).json({
      subscriberId: userId,
      subscriberHash: createNovuSubscriberHash(userId),
    })
  } catch (error) {
    return next(error)
  }
}

export async function createUserHandler(req, res, next) {
  try {
    if (!isWorkspaceOwner(req)) {
      return res.status(403).json({ message: 'Only the workspace owner can invite users.' })
    }
    const workspaceId = req.user?.workspaceId
    const inviterUserId = req.user?.id
    const inviterName = req.user?.name
    const inviterEmail = req.user?.email
    const name = String(req.body?.name ?? '').trim()
    const email = String(req.body?.email ?? '').trim().toLowerCase()
    const avatarUrl =
      req.body?.avatarUrl !== undefined ? String(req.body.avatarUrl).trim() : undefined
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required.' })
    }
    if (!isValidAvatarValue(avatarUrl)) {
      return res.status(400).json({ message: 'Avatar must be a valid image URL or uploaded image data.' })
    }

    const existing = await getUserByEmail(email)
    if (!existing) {
      const { invite, created } = await createTeamInvite({
        workspaceId,
        inviterUserId,
        inviterName,
        inviterEmail,
        targetEmail: email,
      })

      if (created) {
        await notifyTeamInviteSent(
          { id: `invite:${email}`, email, name },
          {
            type: 'team-invite',
            actionRequired: true,
            inviteId: invite.id,
            inviterName: inviterName ?? 'A teammate',
            inviterEmail: inviterEmail ?? '',
            targetEmail: email,
            signupUrl: `${env.clientOrigin.replace(/\/$/, '')}/login`,
            message: `${inviterName ?? 'A teammate'} invited you to join their team. Create an account with this email to accept the invite.`,
          }
        )
      }

      return res.status(created ? 202 : 200).json({
        id: `invite:${email}`,
        name,
        email,
        inviteStatus: 'pending',
        inviteId: invite.id,
        message: created
          ? 'Invite email sent. Ask them to sign up with this email, then accept from Notifications.'
          : 'This email already has a pending invite from your workspace.',
      })
    }

    if (existing.id === inviterUserId) {
      return res.status(400).json({ message: 'You cannot invite the account you are logged in with.' })
    }
    const memberWorkspaceIds = Array.isArray(existing.workspaceIds)
      ? existing.workspaceIds.map((id) => String(id))
      : []
    if (memberWorkspaceIds.includes(String(workspaceId ?? ''))) {
      return res.status(409).json({ message: 'This user is already on your team.' })
    }

    const { invite, created } = await createTeamInvite({
      workspaceId,
      inviterUserId,
      inviterName,
      inviterEmail,
      targetUserId: existing.id,
      targetEmail: existing.email,
    })

    if (created) {
      await notifyTeamInviteSent(existing, {
        type: 'team-invite',
        actionRequired: true,
        inviteId: invite.id,
        inviterName: inviterName ?? 'A teammate',
        inviterEmail: inviterEmail ?? '',
        targetEmail: existing.email,
        message: `${inviterName ?? 'A teammate'} invited you to join their team.`,
      })
    }

    return res.status(created ? 202 : 200).json({
      ...existing,
      inviteStatus: 'pending',
      inviteId: invite.id,
      message: created
        ? 'Invite sent. The user can accept or decline from their Notifications page.'
        : 'This user already has a pending invite from your workspace.',
    })
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'A user with this email already exists.' })
    }
    return next(error)
  }
}

export async function getPendingWorkspaceInvitesHandler(req, res, next) {
  try {
    if (!isWorkspaceOwner(req)) {
      return res.status(403).json({ message: 'Only the workspace owner can view pending invites.' })
    }
    const workspaceId = req.user?.workspaceId
    const invites = await getPendingTeamInvitesForWorkspace(workspaceId)
    return res.status(200).json({ invites })
  } catch (error) {
    return next(error)
  }
}

export async function cancelPendingWorkspaceInviteHandler(req, res, next) {
  try {
    if (!isWorkspaceOwner(req)) {
      return res.status(403).json({ message: 'Only the workspace owner can cancel invites.' })
    }
    const workspaceId = req.user?.workspaceId
    const { inviteId } = req.params
    if (!inviteId) {
      return res.status(400).json({ message: 'Missing inviteId.' })
    }
    const result = await cancelPendingTeamInvite(inviteId, workspaceId)
    if (!result.ok) {
      return res.status(result.statusCode).json({ message: result.message })
    }
    return res.status(200).json({ message: 'Invite cancelled.' })
  } catch (error) {
    return next(error)
  }
}

export async function updateUserHandler(req, res, next) {
  try {
    const { userId } = req.params
    if (String(userId) !== String(req.user?.id)) {
      return res.status(403).json({ message: 'You can only update your own profile.' })
    }
    const workspaceId = req.user?.workspaceId
    const name = req.body?.name !== undefined ? String(req.body.name).trim() : undefined
    const email =
      req.body?.email !== undefined ? String(req.body.email).trim().toLowerCase() : undefined
    const avatarUrl =
      req.body?.avatarUrl !== undefined ? String(req.body.avatarUrl).trim() : undefined

    if (name === '') {
      return res.status(400).json({ message: 'Name cannot be empty.' })
    }
    if (email === '') {
      return res.status(400).json({ message: 'Email cannot be empty.' })
    }
    if (!isValidAvatarValue(avatarUrl)) {
      return res.status(400).json({ message: 'Avatar must be a valid image URL or uploaded image data.' })
    }

    const user = await updateUser(userId, { name, email, avatarUrl }, workspaceId)
    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }
    return res.status(200).json(user)
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'A user with this email already exists.' })
    }
    return next(error)
  }
}

export async function deleteUserHandler(req, res, next) {
  try {
    const workspaceId = req.user?.workspaceId
    const actorId = req.user?.id
    const { userId } = req.params
    const isSelf = String(userId) === String(actorId)
    const result = await removeMemberFromWorkspace(userId, workspaceId, actorId)
    if (!result.ok) {
      return res.status(result.statusCode).json({ message: result.message })
    }
    const message = isSelf
      ? 'You left the workspace. Your account is unchanged.'
      : 'Member removed from your team. Their account still exists.'
    return res.status(200).json({
      message,
      user: result.user,
    })
  } catch (error) {
    return next(error)
  }
}

export async function updateWorkspaceNameHandler(req, res, next) {
  try {
    const actorId = req.user?.id
    const { workspaceId } = req.params
    const workspaceName = String(req.body?.workspaceName ?? '').trim()
    const result = await updateWorkspaceName(workspaceId, actorId, workspaceName)
    if (!result.ok) {
      return res.status(result.statusCode).json({ message: result.message })
    }
    return res.status(200).json({
      message: 'Group name updated.',
      workspaceName: result.workspaceName,
    })
  } catch (error) {
    return next(error)
  }
}

function isWorkspaceOwner(req) {
  const id = req.user?.id
  const ws = req.user?.workspaceId
  return Boolean(id && ws && String(id) === String(ws))
}

function isValidAvatarValue(value) {
  if (value === undefined) return true
  if (value === '') return true
  if (/^https?:\/\//i.test(value)) return true
  return /^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=]+$/i.test(value)
}
