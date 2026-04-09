import {
  createTask,
  deleteTask,
  getTasks,
  updateTaskStatus,
} from '../services/task-service.js'

const statusValues = new Set(['todo', 'in-progress', 'done'])

export async function createTaskHandler(req, res, next) {
  try {
    const { title, description, status, assignedTo, dueDate } = req.body ?? {}

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ message: 'title is required' })
    }

    if (!dueDate || Number.isNaN(new Date(dueDate).getTime())) {
      return res.status(400).json({ message: 'dueDate must be a valid date' })
    }

    if (status && !statusValues.has(status)) {
      return res.status(400).json({ message: 'status is invalid' })
    }

    const task = await createTask({
      title,
      description,
      status,
      assignedTo,
      dueDate,
    })

    return res.status(201).json(task)
  } catch (error) {
    return next(error)
  }
}

export async function getTasksHandler(_req, res, next) {
  try {
    const tasks = await getTasks()
    return res.status(200).json(tasks)
  } catch (error) {
    return next(error)
  }
}

export async function updateTaskStatusHandler(req, res, next) {
  try {
    const { taskId } = req.params
    const { status } = req.body ?? {}

    if (!status || !statusValues.has(status)) {
      return res.status(400).json({ message: 'status is invalid' })
    }

    const task = await updateTaskStatus(taskId, status)
    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    return res.status(200).json(task)
  } catch (error) {
    return next(error)
  }
}

export async function deleteTaskHandler(req, res, next) {
  try {
    const { taskId } = req.params
    const deleted = await deleteTask(taskId)

    if (!deleted) {
      return res.status(404).json({ message: 'Task not found' })
    }

    return res.status(200).json({ message: 'Task deleted' })
  } catch (error) {
    return next(error)
  }
}
