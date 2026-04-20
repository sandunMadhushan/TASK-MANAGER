import { TeamInviteModel } from '../models/team-invite-model.js'
import { UserModel } from '../models/user-model.js'

function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase()
}

function normalizeWorkspaceId(workspaceId) {
  if (!workspaceId) return null
  return String(workspaceId)
}

function normalizeWorkspaceIds(rawWorkspaceIds, fallbackWorkspaceId, userId) {
  const set = new Set()
  if (Array.isArray(rawWorkspaceIds)) {
    for (const id of rawWorkspaceIds) {
      const normalized = normalizeWorkspaceId(id)
      if (normalized) set.add(normalized)
    }
  }
  const fallback = normalizeWorkspaceId(fallbackWorkspaceId)
  if (fallback) set.add(fallback)
  const self = normalizeWorkspaceId(userId)
  if (self) set.add(self)
  return Array.from(set)
}

export async function createTeamInvite(payload) {
  const workspaceId = String(payload.workspaceId ?? '')
  const targetUserIdRaw = payload.targetUserId
  const targetUserId = targetUserIdRaw ? String(targetUserIdRaw) : null
  const targetEmail = normalizeEmail(payload.targetEmail)

  const existingPending = await TeamInviteModel.findOne({
    workspaceId,
    targetEmail,
    status: 'pending',
  })
  if (existingPending) {
    return { invite: existingPending.toJSON(), created: false }
  }

  const invite = await TeamInviteModel.create({
    workspaceId,
    inviterUserId: String(payload.inviterUserId ?? ''),
    inviterName: String(payload.inviterName ?? '').trim(),
    inviterEmail: normalizeEmail(payload.inviterEmail),
    targetUserId,
    targetEmail,
    status: 'pending',
  })

  return { invite: invite.toJSON(), created: true }
}

export async function getPendingTeamInvitesForUser(userId, email) {
  const normalizedEmail = normalizeEmail(email)
  const invites = await TeamInviteModel.find({
    status: 'pending',
    $or: [{ targetUserId: String(userId) }, { targetEmail: normalizedEmail }],
  }).sort({ createdAt: -1 })

  return invites.map((invite) => invite.toJSON())
}

export async function getPendingTeamInvitesForWorkspace(workspaceId) {
  const ws = String(workspaceId ?? '')
  if (!ws) return []
  const invites = await TeamInviteModel.find({
    workspaceId: ws,
    status: 'pending',
  }).sort({ createdAt: -1 })
  return invites.map((invite) => invite.toJSON())
}

export async function acceptTeamInvite(inviteId, currentUser) {
  const invite = await TeamInviteModel.findOne({
    _id: inviteId,
    status: 'pending',
    $or: [{ targetUserId: String(currentUser.id) }, { targetEmail: normalizeEmail(currentUser.email) }],
  })
  if (!invite) return { ok: false, statusCode: 404, message: 'Invite not found.' }

  const user = await UserModel.findById(currentUser.id)
  if (!user) return { ok: false, statusCode: 404, message: 'User not found.' }
  const workspaceId = String(invite.workspaceId)
  const nextWorkspaceIds = normalizeWorkspaceIds(
    user.workspaceIds,
    user.workspaceId,
    user._id
  )
  if (!nextWorkspaceIds.includes(workspaceId)) {
    nextWorkspaceIds.push(workspaceId)
  }
  user.workspaceIds = nextWorkspaceIds
  // Keep the account's own workspace as primary; joined teams stay in workspaceIds.
  user.workspaceId = String(user._id)
  await user.save()

  invite.status = 'accepted'
  invite.respondedAt = new Date()
  await invite.save()

  return { ok: true, invite: invite.toJSON() }
}

export async function declineTeamInvite(inviteId, currentUser) {
  const invite = await TeamInviteModel.findOne({
    _id: inviteId,
    status: 'pending',
    $or: [{ targetUserId: String(currentUser.id) }, { targetEmail: normalizeEmail(currentUser.email) }],
  })
  if (!invite) return { ok: false, statusCode: 404, message: 'Invite not found.' }

  invite.status = 'declined'
  invite.respondedAt = new Date()
  await invite.save()

  return { ok: true, invite: invite.toJSON() }
}

/** Inviter (workspace admin) withdraws a pending invite for their workspace. */
export async function cancelPendingTeamInvite(inviteId, workspaceId) {
  const ws = String(workspaceId ?? '')
  if (!ws) return { ok: false, statusCode: 400, message: 'Workspace is missing.' }

  const deleted = await TeamInviteModel.findOneAndDelete({
    _id: inviteId,
    workspaceId: ws,
    status: 'pending',
  })
  if (!deleted) {
    return { ok: false, statusCode: 404, message: 'Pending invite not found.' }
  }
  return { ok: true }
}
