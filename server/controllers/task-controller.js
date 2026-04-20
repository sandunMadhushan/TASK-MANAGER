import {
  createTask,
  deleteTask,
  getTaskById,
  getTasksForUser,
  updateTask,
  updateTaskStatus,
} from '../services/task-service.js'
import { getProjectById } from '../services/project-service.js'
import { getUserById, getUsersByIds } from '../services/user-service.js'
import {
  notifyTaskAssigned,
  notifyTaskCompleted,
} from '../services/notification-service.js'

const statusValues = new Set(['todo', 'in-progress', 'done'])

export async function createTaskHandler(req, res, next) {
  try {
    const currentUserId = req.user?.id
    const workspaceIds = req.user?.workspaceIds ?? [req.user?.workspaceId]
    const workspaceId = req.user?.workspaceId
    const { title, description, status, assignedToIds, assignedTo, dueDate, projectId } = req.body ?? {}

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ message: 'title is required' })
    }

    if (!dueDate || Number.isNaN(new Date(dueDate).getTime())) {
      return res.status(400).json({ message: 'dueDate must be a valid date' })
    }
    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({ message: 'projectId is required' })
    }
    const project = await getProjectById(projectId)
    if (!project || !workspaceIds.map(String).includes(String(project.workspaceId))) {
      return res.status(400).json({ message: 'projectId is invalid for your workspace' })
    }
    if (project.status === 'archived') {
      return res.status(400).json({ message: 'Cannot create tasks in an archived project.' })
    }

    if (status && !statusValues.has(status)) {
      return res.status(400).json({ message: 'status is invalid' })
    }
    const normalizedAssigneeIds = normalizeAssigneeIds(assignedToIds ?? assignedTo)
    if (normalizedAssigneeIds.length > 0) {
      const users = await getUsersByIds(normalizedAssigneeIds, project.workspaceId)
      if (users.length !== normalizedAssigneeIds.length) {
        return res.status(400).json({ message: 'One or more assigned users not found' })
      }
    }

    const task = await createTask({
      title,
      description,
      status,
      assignedToIds: normalizedAssigneeIds,
      createdById: currentUserId,
      workspaceId: project.workspaceId ?? workspaceId,
      projectId,
      dueDate,
    })

    const assignedUsers = getAssignedUsers(task)
    await runNotificationSafely(() => notifyTaskAssigned(task, assignedUsers))

    return res.status(201).json(task)
  } catch (error) {
    return next(error)
  }
}

export async function getTasksHandler(req, res, next) {
  try {
    const currentUserId = req.user?.id
    const workspaceIds = req.user?.workspaceIds ?? [req.user?.workspaceId]
    const projectScopeAll =
      req.query?.projectScope === 'all' || req.query?.projectScope === 'true'
    const projectIdQuery =
      typeof req.query?.projectId === 'string' && !projectScopeAll ? req.query.projectId : ''
    if (!currentUserId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
    if (projectIdQuery) {
      const project = await getProjectById(projectIdQuery)
      if (!project || !workspaceIds.map(String).includes(String(project.workspaceId))) {
        return res.status(400).json({ message: 'projectId is invalid for your workspace' })
      }
    }
    const tasks = await getTasksForUser(currentUserId, workspaceIds, projectIdQuery || undefined)
    return res.status(200).json(tasks)
  } catch (error) {
    return next(error)
  }
}

export async function updateTaskStatusHandler(req, res, next) {
  try {
    const currentUserId = req.user?.id
    const { taskId } = req.params
    const { status } = req.body ?? {}

    if (!status || !statusValues.has(status)) {
      return res.status(400).json({ message: 'status is invalid' })
    }

    const previousTask = await getTaskById(taskId)
    if (!canAccessTask(previousTask, currentUserId)) {
      return res.status(404).json({ message: 'Task not found' })
    }
    const task = await updateTaskStatus(taskId, status)
    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    if (previousTask && previousTask.status !== 'done' && task.status === 'done') {
      const recipients = await getTaskCompletedRecipients(task, currentUserId)
      const completedBy = await getUserById(currentUserId)
      await runNotificationSafely(() =>
        notifyTaskCompleted(task, recipients, {
          completedByName: completedBy?.name ?? '',
          completedByEmail: completedBy?.email ?? '',
        })
      )
    }

    return res.status(200).json(task)
  } catch (error) {
    return next(error)
  }
}

export async function updateTaskHandler(req, res, next) {
  try {
    const currentUserId = req.user?.id
    const workspaceId = req.user?.workspaceId
    const workspaceIds = req.user?.workspaceIds ?? [workspaceId]
    const { taskId } = req.params
    const { title, description, status, assignedToIds, assignedTo, dueDate, projectId } = req.body ?? {}

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

    let nextProjectId
    let assigneeWorkspaceId = workspaceId
    if (projectId !== undefined) {
      if (!projectId || typeof projectId !== 'string') {
        return res.status(400).json({ message: 'projectId must be a valid id' })
      }
      const project = await getProjectById(projectId)
      if (!project || !workspaceIds.map(String).includes(String(project.workspaceId))) {
        return res.status(400).json({ message: 'projectId is invalid for your workspace' })
      }
      if (project.status === 'archived') {
        return res.status(400).json({ message: 'Cannot move task to an archived project.' })
      }
      nextProjectId = projectId
      assigneeWorkspaceId = project.workspaceId
    }
    if (normalizedAssigneeIds && normalizedAssigneeIds.length > 0) {
      const users = await getUsersByIds(normalizedAssigneeIds, assigneeWorkspaceId)
      if (users.length !== normalizedAssigneeIds.length) {
        return res.status(400).json({ message: 'One or more assigned users not found' })
      }
    }

    const previousTask = await getTaskById(taskId)
    if (!canAccessTask(previousTask, currentUserId)) {
      return res.status(404).json({ message: 'Task not found' })
    }
    const createdById =
      previousTask?.createdBy && typeof previousTask.createdBy === 'object'
        ? previousTask.createdBy.id
        : previousTask?.createdBy
    if (String(createdById ?? '') !== String(currentUserId ?? '')) {
      return res.status(403).json({ message: 'Only the task creator can edit this task.' })
    }

    const task = await updateTask(taskId, {
      title,
      description,
      status,
      assignedToIds: normalizedAssigneeIds,
      projectId: nextProjectId,
      dueDate,
    })

    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    if (previousTask) {
      const previousIds = new Set(getAssignedUsers(previousTask).map((u) => u.id))
      const newlyAssigned = getAssignedUsers(task).filter((u) => !previousIds.has(u.id))
      if (newlyAssigned.length > 0) {
        await runNotificationSafely(() => notifyTaskAssigned(task, newlyAssigned))
      }

      if (previousTask.status !== 'done' && task.status === 'done') {
        const recipients = await getTaskCompletedRecipients(task, currentUserId)
        const completedBy = await getUserById(currentUserId)
        await runNotificationSafely(() =>
          notifyTaskCompleted(task, recipients, {
            completedByName: completedBy?.name ?? '',
            completedByEmail: completedBy?.email ?? '',
          })
        )
      }
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

function getAssignedUsers(task) {
  if (!task?.assignedTo || !Array.isArray(task.assignedTo)) return []
  return task.assignedTo.filter(
    (user) => user && typeof user === 'object' && user.id && user.email
  )
}

async function getTaskCompletedRecipients(task, actorUserId) {
  const actorId = String(actorUserId ?? '')
  const recipients = new Map()

  for (const user of getAssignedUsers(task)) {
    if (String(user.id) === actorId) continue
    recipients.set(String(user.id), user)
  }

  const createdById =
    task?.createdBy && typeof task.createdBy === 'object'
      ? task.createdBy.id
      : task?.createdBy
  if (createdById) {
    const creator = await getUserById(createdById)
    if (creator?.id && creator?.email && String(creator.id) !== actorId) {
      recipients.set(String(creator.id), creator)
    }
  }

  return Array.from(recipients.values())
}

async function runNotificationSafely(notify) {
  try {
    await notify()
  } catch (error) {
    console.warn('Notification dispatch failed:', error?.message ?? error)
  }
}

export async function deleteTaskHandler(req, res, next) {
  try {
    const currentUserId = req.user?.id
    const { taskId } = req.params
    const task = await getTaskById(taskId)
    if (!canAccessTask(task, currentUserId)) {
      return res.status(404).json({ message: 'Task not found' })
    }
    const createdById =
      task?.createdBy && typeof task.createdBy === 'object'
        ? task.createdBy.id
        : task?.createdBy
    if (String(createdById ?? '') !== String(currentUserId ?? '')) {
      return res.status(403).json({ message: 'Only the task creator can delete this task.' })
    }
    const deleted = await deleteTask(taskId)

    if (!deleted) {
      return res.status(404).json({ message: 'Task not found' })
    }

    return res.status(200).json({ message: 'Task deleted' })
  } catch (error) {
    return next(error)
  }
}

function canAccessTask(task, userId) {
  if (!task || !userId) return false
  const createdById =
    task.createdBy && typeof task.createdBy === 'object'
      ? task.createdBy.id
      : task.createdBy
  if (String(createdById ?? '') === String(userId)) return true
  const assigned = Array.isArray(task.assignedTo) ? task.assignedTo : []
  return assigned.some((value) => {
    if (typeof value === 'string') return value === userId
    if (value && typeof value === 'object' && value.id) return value.id === userId
    return false
  })
}
