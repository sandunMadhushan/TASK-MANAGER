import { TaskModel } from '../models/task-model.js'

export async function getTaskById(taskId) {
  const task = await TaskModel.findById(taskId)
    .populate('assignedTo')
    .populate('createdBy')
  return task ? task.toJSON() : null
}

export async function createTask(payload) {
  const task = await TaskModel.create({
    title: payload.title,
    description: payload.description ?? '',
    status: payload.status ?? 'todo',
    assignedTo: payload.assignedToIds ?? [],
    createdBy: payload.createdById,
    workspaceId: payload.workspaceId,
    dueDate: payload.dueDate,
  })

  const hydrated = await TaskModel.findById(task._id)
    .populate('assignedTo')
    .populate('createdBy')
  return hydrated.toJSON()
}

export async function getTasksForUser(userId, workspaceIds = []) {
  const workspaceList = Array.isArray(workspaceIds)
    ? workspaceIds.map((id) => String(id)).filter(Boolean)
    : [String(workspaceIds)].filter(Boolean)
  const baseQuery = {
    $or: [{ createdBy: userId }, { assignedTo: userId }],
  }
  if (workspaceList.length > 0) {
    baseQuery.$and = [
      {
        $or: [{ workspaceId: { $in: workspaceList } }, { workspaceId: { $exists: false } }],
      },
    ]
  }
  const tasks = await TaskModel.find(baseQuery)
    .populate('assignedTo')
    .populate('createdBy')
    .sort({ createdAt: -1 })
  return tasks.map((task) => task.toJSON())
}

export async function updateTaskStatus(taskId, status) {
  const task = await TaskModel.findByIdAndUpdate(
    taskId,
    { status },
    { new: true, runValidators: true }
  )

  if (!task) return null
  const hydrated = await TaskModel.findById(task._id)
    .populate('assignedTo')
    .populate('createdBy')
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
  const hydrated = await TaskModel.findById(task._id)
    .populate('assignedTo')
    .populate('createdBy')
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

export async function unassignUserFromTasksInWorkspace(userId, workspaceId) {
  if (!userId || !workspaceId) return
  await TaskModel.updateMany(
    { assignedTo: userId, workspaceId },
    { $pull: { assignedTo: userId } }
  )
}
