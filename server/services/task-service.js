import { TaskModel } from '../models/task-model.js'

export async function getTaskById(taskId) {
  const task = await TaskModel.findById(taskId).populate('assignedTo')
  return task ? task.toJSON() : null
}

export async function createTask(payload) {
  const task = await TaskModel.create({
    title: payload.title,
    description: payload.description ?? '',
    status: payload.status ?? 'todo',
    assignedTo: payload.assignedToIds ?? [],
    dueDate: payload.dueDate,
  })

  const hydrated = await TaskModel.findById(task._id).populate('assignedTo')
  return hydrated.toJSON()
}

export async function getTasks() {
  const tasks = await TaskModel.find().populate('assignedTo').sort({ createdAt: -1 })
  return tasks.map((task) => task.toJSON())
}

export async function updateTaskStatus(taskId, status) {
  const task = await TaskModel.findByIdAndUpdate(
    taskId,
    { status },
    { new: true, runValidators: true }
  )

  if (!task) return null
  const hydrated = await TaskModel.findById(task._id).populate('assignedTo')
  return hydrated.toJSON()
}

export async function updateTask(taskId, payload) {
  const update = {}
  if (payload.title !== undefined) update.title = payload.title
  if (payload.description !== undefined) update.description = payload.description
  if (payload.status !== undefined) update.status = payload.status
  if (payload.dueDate !== undefined) update.dueDate = payload.dueDate
  if (payload.assignedToIds !== undefined) update.assignedTo = payload.assignedToIds

  const task = await TaskModel.findByIdAndUpdate(taskId, update, {
    new: true,
    runValidators: true,
  })

  if (!task) return null
  const hydrated = await TaskModel.findById(task._id).populate('assignedTo')
  return hydrated.toJSON()
}

export async function deleteTask(taskId) {
  const deleted = await TaskModel.findByIdAndDelete(taskId)
  return Boolean(deleted)
}

export async function unassignUserFromAllTasks(userId) {
  if (!userId) return
  await TaskModel.updateMany(
    { assignedTo: userId },
    { $pull: { assignedTo: userId } }
  )
}
