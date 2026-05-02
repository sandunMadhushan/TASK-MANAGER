import { Novu } from '@novu/api'

import { env } from '../config/env.js'
import { TaskModel } from '../models/task-model.js'
import { createNovuSubscriberHash } from './novu-auth-service.js'

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

export async function notifyTaskAssigned(task, users, extraPayload = {}) {
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
      ...extraPayload,
    },
  })
}

export async function notifyTaskCompleted(task, users, extraPayload = {}) {
  if (!env.novuWorkflowTaskCompleted) return
  await triggerForUsers({
    workflowId: env.novuWorkflowTaskCompleted,
    users,
    payload: {
      taskId: task.id,
      title: task.title,
      status: task.status,
      dueDate: task.dueDate,
      ...extraPayload,
    },
  })
}

export async function notifyPasswordReset(user, payload) {
  if (!env.novuWorkflowPasswordReset || !canSend(env.novuWorkflowPasswordReset) || !user) return
  await triggerForUsers({
    workflowId: env.novuWorkflowPasswordReset,
    users: [user],
    payload,
  })
}

export async function notifyWelcome(user, payload) {
  if (!env.novuWorkflowWelcome || !canSend(env.novuWorkflowWelcome) || !user) return
  await triggerForUsers({
    workflowId: env.novuWorkflowWelcome,
    users: [user],
    payload,
  })
}

export async function notifyTeamInviteSent(inviteeUser, payload) {
  if (!env.novuWorkflowTeamInviteSent || !inviteeUser) return
  await triggerForUsers({
    workflowId: env.novuWorkflowTeamInviteSent,
    users: [inviteeUser],
    payload,
  })
}

export async function notifyTeamInviteAccepted(inviterUser, payload) {
  if (!env.novuWorkflowTeamInviteAccepted || !inviterUser) return
  await triggerForUsers({
    workflowId: env.novuWorkflowTeamInviteAccepted,
    users: [inviterUser],
    payload,
  })
}

export async function notifyTeamInviteDeclined(inviterUser, payload) {
  if (!env.novuWorkflowTeamInviteDeclined || !inviterUser) return
  await triggerForUsers({
    workflowId: env.novuWorkflowTeamInviteDeclined,
    users: [inviterUser],
    payload,
  })
}

export async function notifyTeamInviteJoined(inviteeUser, payload) {
  if (!env.novuWorkflowTeamInviteJoined || !inviteeUser) return
  await triggerForUsers({
    workflowId: env.novuWorkflowTeamInviteJoined,
    users: [inviteeUser],
    payload,
  })
}

export async function notifyProjectCreated(workspaceUsers, payload) {
  if (!env.novuWorkflowProjectCreated || !canSend(env.novuWorkflowProjectCreated)) return
  await triggerForUsers({
    workflowId: env.novuWorkflowProjectCreated,
    users: workspaceUsers,
    payload,
  })
}

export async function notifyProjectDeleted(workspaceUsers, payload) {
  if (!env.novuWorkflowProjectDeleted || !canSend(env.novuWorkflowProjectDeleted)) return
  await triggerForUsers({
    workflowId: env.novuWorkflowProjectDeleted,
    users: workspaceUsers,
    payload,
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

/**
 * Unread count for the same Inbox channel as {@link getNotificationFeed} and the Novu `<Inbox />` bell.
 * The legacy `/subscribers/.../notifications/feed` `totalCount` does not match the new inbox model (often stuck near 0–1).
 */
export async function getUnreadNotificationCount(subscriberId) {
  if (!subscriberId) return 0

  if (env.novuApplicationIdentifier) {
    try {
      const token = await createInboxSessionToken(subscriberId)
      const url = new URL('/v1/inbox/notifications/count', novuRestBaseUrl)
      url.searchParams.set('read', 'false')
      url.searchParams.set('archived', 'false')
      url.searchParams.set('snoozed', 'false')

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
          'novu-api-version': '2024-06-26',
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const body = await response.json()
        const count = body?.data?.count
        if (typeof count === 'number' && count >= 0) return count
      }
    } catch (error) {
      console.warn('[notifications] inbox unread count failed:', error?.message ?? error)
    }
  }

  if (!env.novuSecretKey) return 0

  const url = new URL(
    `/v1/subscribers/${encodeURIComponent(subscriberId)}/notifications/unseen`,
    novuRestBaseUrl
  )
  url.searchParams.set('seen', 'false')
  url.searchParams.set('limit', '10000')

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
  if (typeof body?.count === 'number' && body.count >= 0) return body.count
  return 0
}

async function createInboxSessionToken(subscriberId) {
  if (!env.novuApplicationIdentifier) {
    throw new Error('Missing VITE_NOVU_APPLICATION_IDENTIFIER in environment')
  }
  const subscriberHash = createNovuSubscriberHash(subscriberId)

  const response = await fetch(new URL('/v1/inbox/session', novuRestBaseUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'novu-api-version': '2024-06-26',
    },
    body: JSON.stringify({
      applicationIdentifier: env.novuApplicationIdentifier,
      subscriberId,
      ...(subscriberHash ? { subscriberHash } : {}),
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Unable to create Novu inbox session: ${response.status} ${text}`)
  }

  const body = await response.json()
  const token = body?.data?.token
  if (!token) {
    throw new Error('Novu inbox session did not return token')
  }
  return token
}

export async function getNotificationFeed(subscriberId, { limit = 20, unreadOnly = false } = {}) {
  if (!subscriberId) return []

  const token = await createInboxSessionToken(subscriberId)
  const url = new URL('/v1/inbox/notifications', novuRestBaseUrl)
  url.searchParams.set('limit', String(Math.max(1, Math.min(limit, 50))))
  url.searchParams.set('archived', 'false')
  url.searchParams.set('snoozed', 'false')
  if (unreadOnly) {
    url.searchParams.set('read', 'false')
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'novu-api-version': '2024-06-26',
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Unable to fetch notifications feed: ${response.status} ${text}`)
  }

  const body = await response.json()
  return Array.isArray(body?.data) ? body.data : []
}

export async function markAllNotificationsRead(subscriberId) {
  if (!subscriberId) return { updated: 0 }

  const unread = await getNotificationFeed(subscriberId, { limit: 50, unreadOnly: true })
  if (unread.length === 0) return { updated: 0 }

  const token = await createInboxSessionToken(subscriberId)
  await Promise.all(
    unread.map((item) =>
      fetch(new URL(`/v1/inbox/notifications/${encodeURIComponent(item.id)}/read`, novuRestBaseUrl), {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'novu-api-version': '2024-06-26',
          'Content-Type': 'application/json',
        },
      })
    )
  )

  return { updated: unread.length }
}
