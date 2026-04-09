import { Novu } from '@novu/api'

import { env } from '../config/env.js'
import { TaskModel } from '../models/task-model.js'

const novu =
  env.novuSecretKey
    ? new Novu({
        secretKey: env.novuSecretKey,
        ...(env.novuBackendUrl ? { serverURL: env.novuBackendUrl } : {}),
      })
    : null

const novuRestBaseUrl = env.novuBackendUrl || 'https://api.novu.co'

function canSend(workflowId) {
  return Boolean(novu && workflowId)
}

function getRecipient(user) {
  return {
    subscriberId: user.id,
    email: user.email,
  }
}

async function triggerForUsers({ workflowId, users, payload }) {
  if (!canSend(workflowId) || !Array.isArray(users) || users.length === 0) return

  await Promise.all(
    users.map((user) =>
      novu.trigger({
        workflowId,
        to: getRecipient(user),
        payload,
      })
    )
  )
}

export async function notifyTaskAssigned(task, users) {
  if (!env.novuWorkflowTaskAssigned) return
  await triggerForUsers({
    workflowId: env.novuWorkflowTaskAssigned,
    users,
    payload: {
      taskId: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      dueDate: task.dueDate,
    },
  })
}

export async function notifyTaskCompleted(task, users) {
  if (!env.novuWorkflowTaskCompleted) return
  await triggerForUsers({
    workflowId: env.novuWorkflowTaskCompleted,
    users,
    payload: {
      taskId: task.id,
      title: task.title,
      status: task.status,
      dueDate: task.dueDate,
    },
  })
}

export async function sendDeadlineNearReminders(hoursAhead = 24) {
  if (!env.novuWorkflowDeadlineNear || !canSend(env.novuWorkflowDeadlineNear)) {
    return { scanned: 0, triggered: 0 }
  }

  const now = new Date()
  const until = new Date(now)
  until.setHours(until.getHours() + hoursAhead)

  const tasks = await TaskModel.find({
    status: { $ne: 'done' },
    dueDate: { $gte: now, $lte: until },
    assignedTo: { $exists: true, $ne: [] },
  }).populate('assignedTo')

  let triggered = 0

  for (const taskDoc of tasks) {
    const task = taskDoc.toJSON()
    const users = (task.assignedTo ?? []).filter(Boolean)
    if (users.length === 0) continue

    await triggerForUsers({
      workflowId: env.novuWorkflowDeadlineNear,
      users,
      payload: {
        taskId: task.id,
        title: task.title,
        status: task.status,
        dueDate: task.dueDate,
        hoursAhead,
      },
    })
    triggered += users.length
  }

  return { scanned: tasks.length, triggered }
}

export async function getUnreadNotificationCount(subscriberId) {
  if (!env.novuSecretKey || !subscriberId) return 0

  const url = new URL(
    `/v1/subscribers/${encodeURIComponent(subscriberId)}/notifications/feed`,
    novuRestBaseUrl
  )
  url.searchParams.set('page', '0')
  url.searchParams.set('limit', '1')
  url.searchParams.set('read', 'false')

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `ApiKey ${env.novuSecretKey}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Unable to fetch unread count from Novu: ${response.status} ${text}`)
  }

  const body = await response.json()
  const totalCount = body?.totalCount
  return typeof totalCount === 'number' && totalCount >= 0 ? totalCount : 0
}
