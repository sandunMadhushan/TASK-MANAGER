import { UserModel } from '../models/user-model.js'
import { env } from '../config/env.js'
import { hashPassword } from './password-service.js'
import { unassignUserFromTasksInWorkspace } from './task-service.js'

const defaultUsers = [
  { name: 'Alex Morgan', email: 'alex@company.com' },
  { name: 'Sophie Kim', email: 'sophie@company.com' },
  { name: 'Liam Mendes', email: 'liam@company.com' },
  { name: 'Jade Rivera', email: 'jade@company.com' },
]

export async function ensureDefaultUsers() {
  const count = await UserModel.countDocuments()
  if (count > 0) return
  const passwordHash = await hashPassword(env.authDefaultPassword)
  const inserted = await UserModel.insertMany(
    defaultUsers.map((user) => ({
      ...user,
      passwordHash,
    }))
  )
  await Promise.all(
    inserted.map((user) =>
      UserModel.findByIdAndUpdate(user._id, { workspaceId: user._id })
    )
  )
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
  if (set.size === 0 && self) set.add(self)
  return Array.from(set)
}

function normalizeUserMembership(user) {
  if (!user) return user
  // Mongoose documents also expose `id`, but spreading them can drop actual fields like
  // name/email. Always normalize to a plain object when possible.
  const userObj =
    typeof user.toJSON === 'function'
      ? user.toJSON()
      : user
  const workspaceIds = normalizeWorkspaceIds(
    userObj.workspaceIds,
    userObj.workspaceId,
    userObj.id
  )
  return {
    ...userObj,
    workspaceId: userObj.workspaceId ? String(userObj.workspaceId) : workspaceIds[0],
    workspaceIds,
  }
}

export async function getUsers(workspaceId) {
  const workspaceIds = Array.isArray(workspaceId)
    ? workspaceId.map((id) => normalizeWorkspaceId(id)).filter(Boolean)
    : [normalizeWorkspaceId(workspaceId)].filter(Boolean)

  const query =
    workspaceIds.length > 0
      ? {
          $or: [
            { workspaceIds: { $in: workspaceIds } },
            { workspaceId: { $in: workspaceIds } },
          ],
        }
      : {}
  const users = await UserModel.find(query).sort({ name: 1 })
  const normalizedUsers = users.map((user) => normalizeUserMembership(user))

  const workspaceRoots = new Set(
    normalizedUsers.flatMap((u) => u.workspaceIds ?? [])
  )
  const owners = await UserModel.find({ _id: { $in: Array.from(workspaceRoots) } })
  const ownerById = new Map(
    owners.map((o) => [String(o._id), o.name || o.email || String(o._id)])
  )

  return normalizedUsers.map((user) => ({
    ...user,
    workspaceNames: (user.workspaceIds ?? []).map(
      (id) => ownerById.get(String(id)) ?? String(id)
    ),
  }))
}

export async function getUserById(userId, options = {}) {
  if (!userId) return null
  let query = UserModel.findById(userId)
  if (options.includePasswordHash) {
    query = query.select('+passwordHash')
  }
  const user = await query
  if (!user) return null
  if (options.includePasswordHash) {
    const raw = user.toObject()
    return normalizeUserMembership({ ...raw, id: raw._id.toString() })
  }
  return normalizeUserMembership(user.toJSON())
}

export async function getUserByEmail(email, options = {}) {
  if (!email) return null
  let query = UserModel.findOne({ email: String(email).trim().toLowerCase() })
  if (options.includePasswordHash) {
    query = query.select('+passwordHash')
  }
  const user = await query
  if (!user) return null
  if (options.includePasswordHash) {
    const raw = user.toObject()
    return normalizeUserMembership({ ...raw, id: raw._id.toString() })
  }
  return normalizeUserMembership(user.toJSON())
}

export async function ensureUserWorkspace(userId) {
  if (!userId) return null
  const user = await UserModel.findById(userId)
  if (!user) return null
  const selfWorkspaceId = String(user._id)
  user.workspaceIds = normalizeWorkspaceIds(
    user.workspaceIds?.map((id) => String(id)),
    String(user.workspaceId ?? ''),
    selfWorkspaceId
  )
  // Keep own workspace as primary/default so joining a new team never "moves" the account.
  user.workspaceId = selfWorkspaceId
  await user.save()
  return normalizeUserMembership(user.toJSON())
}

export async function getUsersByIds(userIds, workspaceId) {
  if (!Array.isArray(userIds) || userIds.length === 0) return []
  const query = { _id: { $in: userIds } }
  const workspace = normalizeWorkspaceId(workspaceId)
  if (workspace) {
    query.$or = [
      { workspaceIds: workspace },
      { workspaceId: workspace },
    ]
  }
  const users = await UserModel.find(query)
  return users.map((user) => normalizeUserMembership(user.toJSON()))
}

export async function createUser(payload) {
  const passwordHash = payload.passwordHash
    ? payload.passwordHash
    : await hashPassword(env.authDefaultPassword)
  let user = await UserModel.create({
    name: payload.name,
    email: payload.email,
    avatarUrl: payload.avatarUrl ?? '',
    passwordHash,
    workspaceId: payload.workspaceId,
    workspaceIds: payload.workspaceId ? [payload.workspaceId] : undefined,
  })
  if (!user.workspaceId) {
    user = await UserModel.findByIdAndUpdate(
      user._id,
      { workspaceId: user._id, workspaceIds: [user._id] },
      { new: true }
    )
  }
  return normalizeUserMembership(user.toJSON())
}

/**
 * Team invite: create a new user, or attach an existing account to this workspace.
 * Email stays globally unique (one login per email). Password is unchanged when joining.
 *
 * A user can belong to multiple workspaces (`workspaceIds`), while `workspaceId`
 * remains the primary/default workspace for compatibility.
 */
export async function inviteUserToWorkspace(payload, workspaceId, actorUserId) {
  const email = String(payload.email).trim().toLowerCase()
  const name = String(payload.name).trim()
  const ws = normalizeWorkspaceId(workspaceId)
  const actorId = String(actorUserId ?? '')

  if (!ws) {
    return { ok: false, statusCode: 400, message: 'Workspace is missing for the current user.' }
  }

  const existing = await UserModel.findOne({ email })
  if (!existing) {
    const user = await createUser({
      name,
      email,
      avatarUrl: payload.avatarUrl,
      workspaceId: ws,
    })
    return { ok: true, statusCode: 201, user, outcome: 'created' }
  }

  const existingId = existing._id.toString()
  if (existingId === actorId) {
    return {
      ok: false,
      statusCode: 400,
      message: 'You cannot invite the account you are logged in with.',
    }
  }

  const existingWorkspaceIds = normalizeWorkspaceIds(
    existing.workspaceIds?.map((id) => String(id)),
    String(existing.workspaceId ?? ''),
    existing._id.toString()
  )
  if (existingWorkspaceIds.includes(ws)) {
    return {
      ok: false,
      statusCode: 409,
      message: 'This user is already on your team.',
    }
  }

  existing.name = name
  if (payload.avatarUrl !== undefined && String(payload.avatarUrl).trim() !== '') {
    existing.avatarUrl = String(payload.avatarUrl).trim()
  }
  existing.workspaceIds = normalizeWorkspaceIds(existingWorkspaceIds, ws, existing._id.toString())
  await existing.save()

  return { ok: true, statusCode: 200, user: normalizeUserMembership(existing.toJSON()), outcome: 'joined' }
}

export async function updateUser(userId, payload, workspaceId) {
  const update = {}
  if (payload.name !== undefined) update.name = payload.name
  if (payload.email !== undefined) update.email = payload.email
  if (payload.avatarUrl !== undefined) update.avatarUrl = payload.avatarUrl
  const query = { _id: userId }
  const workspace = normalizeWorkspaceId(workspaceId)
  if (workspace) {
    query.$or = [{ workspaceIds: workspace }, { workspaceId: workspace }]
  }

  const user = await UserModel.findOneAndUpdate(query, update, {
    new: true,
    runValidators: true,
  })
  return user ? normalizeUserMembership(user.toJSON()) : null
}

export async function updatePassword(userId, passwordHash) {
  const user = await UserModel.findByIdAndUpdate(
    userId,
    {
      passwordHash,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
    },
    { new: true, runValidators: true }
  )
  return user ? user.toJSON() : null
}

export async function setPasswordResetTokenByEmail(email, tokenHash, expiresAt) {
  if (!email) return null
  const user = await UserModel.findOneAndUpdate(
    { email: String(email).trim().toLowerCase() },
    {
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: expiresAt,
    },
    { new: true }
  )
  return user ? user.toJSON() : null
}

export async function getUserByPasswordResetToken(tokenHash) {
  if (!tokenHash) return null
  const now = new Date()
  const user = await UserModel.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpiresAt: { $gt: now },
  }).select('+passwordResetTokenHash +passwordResetExpiresAt')
  if (!user) return null
  const raw = user.toObject()
  return { ...raw, id: raw._id.toString() }
}

/**
 * Detach a user from a workspace membership. Does not delete the User.
 * - Only the workspace owner (actor id === workspace root id) may remove someone else.
 * - The workspace root user row cannot be removed by others.
 * - A non-owner member may only detach themselves ("leave"); the owner cannot leave via this path.
 */
export async function removeMemberFromWorkspace(userId, workspaceId, actorUserId) {
  const ws = normalizeWorkspaceId(workspaceId)
  const actor = String(actorUserId ?? '')
  if (!ws) return { ok: false, statusCode: 400, message: 'Workspace is missing.' }

  const actorIsOwner = actor === ws
  const targetIsWorkspaceRoot = String(userId) === ws

  if (String(userId) !== actor) {
    if (!actorIsOwner) {
      return {
        ok: false,
        statusCode: 403,
        message: 'Only the workspace owner can remove other members.',
      }
    }
    if (targetIsWorkspaceRoot) {
      return {
        ok: false,
        statusCode: 400,
        message: 'Cannot remove the workspace owner from the team.',
      }
    }
  } else if (actorIsOwner) {
    return {
      ok: false,
      statusCode: 400,
      message: 'Workspace owner cannot leave their team this way.',
    }
  }

  const user = await UserModel.findOne({
    _id: userId,
    $or: [{ workspaceIds: ws }, { workspaceId: ws }],
  })
  if (!user) {
    return { ok: false, statusCode: 404, message: 'User not found in this workspace.' }
  }

  await unassignUserFromTasksInWorkspace(userId, ws)

  const nextWorkspaceIds = normalizeWorkspaceIds(
    user.workspaceIds?.map((id) => String(id)).filter((id) => id !== ws),
    user.workspaceId ? String(user.workspaceId) : '',
    user._id.toString()
  )
  user.workspaceIds = nextWorkspaceIds
  if (String(user.workspaceId ?? '') === ws) {
    user.workspaceId = nextWorkspaceIds[0] ?? user._id
  }
  await user.save()

  return { ok: true, user: normalizeUserMembership(user.toJSON()) }
}
