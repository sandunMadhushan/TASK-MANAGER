import {
  createTask,
  deleteTask,
  getTasks,
  updateTask,
  updateTaskStatus,
} from '../services/task-service.js'
import { getUsersByIds } from '../services/user-service.js'

const statusValues = new Set(['todo', 'in-progress', 'done'])

export async function createTaskHandler(req, res, next) {
  try {
    const { title, description, status, assignedToIds, assignedTo, dueDate } = req.body ?? {}

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ message: 'title is required' })
    }

    if (!dueDate || Number.isNaN(new Date(dueDate).getTime())) {
      return res.status(400).json({ message: 'dueDate must be a valid date' })
    }

    if (status && !statusValues.has(status)) {
      return res.status(400).json({ message: 'status is invalid' })
    }
    const normalizedAssigneeIds = normalizeAssigneeIds(assignedToIds ?? assignedTo)
    if (normalizedAssigneeIds.length > 0) {
      const users = await getUsersByIds(normalizedAssigneeIds)
      if (users.length !== normalizedAssigneeIds.length) {
        return res.status(400).json({ message: 'One or more assigned users not found' })
      }
    }

    const task = await createTask({
      title,
      description,
      status,
      assignedToIds: normalizedAssigneeIds,
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

export async function updateTaskHandler(req, res, next) {
  try {
    const { taskId } = req.params
    const { title, description, status, assignedToIds, assignedTo, dueDate } = req.body ?? {}

    if (title !== undefined && (!title || typeof title !== 'string')) {
      return res.status(400).json({ message: 'title is invalid' })
    }
    if (dueDate !== undefined && Number.isNaN(new Date(dueDate).getTime())) {
      return res.status(400).json({ message: 'dueDate must be a valid date' })
    }
    if (status !== undefined && !statusValues.has(status)) {
      return res.status(400).json({ message: 'status is invalid' })
    }
    const hasAssigneesPayload = assignedToIds !== undefined || assignedTo !== undefined
    const normalizedAssigneeIds = hasAssigneesPayload
      ? normalizeAssigneeIds(assignedToIds ?? assignedTo)
      : undefined

    if (normalizedAssigneeIds && normalizedAssigneeIds.length > 0) {
      const users = await getUsersByIds(normalizedAssigneeIds)
      if (users.length !== normalizedAssigneeIds.length) {
        return res.status(400).json({ message: 'One or more assigned users not found' })
      }
    }

    const task = await updateTask(taskId, {
      title,
      description,
      status,
      assignedToIds: normalizedAssigneeIds,
      dueDate,
    })

    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }
    return res.status(200).json(task)
  } catch (error) {
    return next(error)
  }
}

function normalizeAssigneeIds(value) {
  if (value === undefined || value === null || value === '') return []
  if (Array.isArray(value)) {
    return [...new Set(value.filter((id) => typeof id === 'string' && id.trim() !== ''))]
  }
  if (typeof value === 'string' && value.trim() !== '') {
    return [value]
  }
  return []
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
