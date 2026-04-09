import { TaskModel } from '../models/task-model.js'

export async function createTask(payload) {
  const task = await TaskModel.create({
    title: payload.title,
    description: payload.description ?? '',
    status: payload.status ?? 'todo',
    assignedTo: payload.assignedTo ?? null,
    dueDate: payload.dueDate,
  })

  return task.toJSON()
}

export async function getTasks() {
  const tasks = await TaskModel.find().sort({ createdAt: -1 })
  return tasks.map((task) => task.toJSON())
}

export async function updateTaskStatus(taskId, status) {
  const task = await TaskModel.findByIdAndUpdate(
    taskId,
    { status },
    { new: true, runValidators: true }
  )

  return task ? task.toJSON() : null
}

export async function deleteTask(taskId) {
  const deleted = await TaskModel.findByIdAndDelete(taskId)
  return Boolean(deleted)
}
