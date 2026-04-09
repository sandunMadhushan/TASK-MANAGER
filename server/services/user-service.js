import { UserModel } from '../models/user-model.js'

const defaultUsers = [
  { name: 'Alex Morgan', email: 'alex@company.com' },
  { name: 'Sophie Kim', email: 'sophie@company.com' },
  { name: 'Liam Mendes', email: 'liam@company.com' },
  { name: 'Jade Rivera', email: 'jade@company.com' },
]

export async function ensureDefaultUsers() {
  const count = await UserModel.countDocuments()
  if (count > 0) return
  await UserModel.insertMany(defaultUsers)
}

export async function getUsers() {
  const users = await UserModel.find().sort({ name: 1 })
  return users.map((user) => user.toJSON())
}

export async function getUserById(userId) {
  if (!userId) return null
  const user = await UserModel.findById(userId)
  return user ? user.toJSON() : null
}

export async function getUsersByIds(userIds) {
  if (!Array.isArray(userIds) || userIds.length === 0) return []
  const users = await UserModel.find({ _id: { $in: userIds } })
  return users.map((user) => user.toJSON())
}
