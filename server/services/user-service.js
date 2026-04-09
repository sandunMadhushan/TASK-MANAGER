import { UserModel } from '../models/user-model.js'
import { env } from '../config/env.js'
import { hashPassword } from './password-service.js'
import { unassignUserFromAllTasks } from './task-service.js'

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

export async function getUsers(workspaceId) {
  const workspace = normalizeWorkspaceId(workspaceId)
  const query = workspace ? { workspaceId: workspace } : {}
  const users = await UserModel.find(query).sort({ name: 1 })
  return users.map((user) => user.toJSON())
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
    return { ...raw, id: raw._id.toString() }
  }
  return user.toJSON()
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
    return { ...raw, id: raw._id.toString() }
  }
  return user.toJSON()
}

export async function ensureUserWorkspace(userId) {
  if (!userId) return null
  const user = await UserModel.findById(userId)
  if (!user) return null
  if (!user.workspaceId) {
    user.workspaceId = user._id
    await user.save()
  }
  return user.toJSON()
}

export async function getUsersByIds(userIds, workspaceId) {
  if (!Array.isArray(userIds) || userIds.length === 0) return []
  const query = { _id: { $in: userIds } }
  const workspace = normalizeWorkspaceId(workspaceId)
  if (workspace) {
    query.workspaceId = workspace
  }
  const users = await UserModel.find(query)
  return users.map((user) => user.toJSON())
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
  })
  if (!user.workspaceId) {
    user = await UserModel.findByIdAndUpdate(
      user._id,
      { workspaceId: user._id },
      { new: true }
    )
  }
  return user.toJSON()
}

export async function updateUser(userId, payload, workspaceId) {
  const update = {}
  if (payload.name !== undefined) update.name = payload.name
  if (payload.email !== undefined) update.email = payload.email
  if (payload.avatarUrl !== undefined) update.avatarUrl = payload.avatarUrl
  const query = { _id: userId }
  const workspace = normalizeWorkspaceId(workspaceId)
  if (workspace) {
    query.workspaceId = workspace
  }

  const user = await UserModel.findOneAndUpdate(query, update, {
    new: true,
    runValidators: true,
  })
  return user ? user.toJSON() : null
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

export async function deleteUser(userId, workspaceId) {
  const query = { _id: userId }
  const workspace = normalizeWorkspaceId(workspaceId)
  if (workspace) {
    query.workspaceId = workspace
  }
  const user = await UserModel.findOneAndDelete(query)
  if (!user) return false
  await unassignUserFromAllTasks(userId)
  return true
}
