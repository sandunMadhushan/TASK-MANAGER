import { isTauri } from '@tauri-apps/api/core'
import { resolveApiBaseUrl } from '@/lib/runtime-env'
import type { Task, TaskStatus } from '@/types/task'
import type { User } from '@/types/user'

const API_BASE_URL = resolveApiBaseUrl()

let authTokenGetter: (() => string | null) | null = null

export function setAuthTokenGetter(getter: (() => string | null) | null) {
  authTokenGetter = getter
}

type TaskDto = {
  id: string
  title: string
  description: string
  status: TaskStatus
  assignedTo?: string | User | Array<string | User> | null
  createdBy?: string | User | null
  dueDate: string
  createdAt?: string
}

function mapTaskDto(dto: TaskDto): Task {
  const rawAssignees = Array.isArray(dto.assignedTo)
    ? dto.assignedTo
    : dto.assignedTo
      ? [dto.assignedTo]
      : []

  const assignees = rawAssignees.filter(
    (v): v is User => typeof v === 'object' && v !== null
  )
  const assignedToIds = rawAssignees
    .map((v) => (typeof v === 'string' ? v : v.id))
    .filter(Boolean)
  const createdById =
    typeof dto.createdBy === 'string'
      ? dto.createdBy
      : dto.createdBy && typeof dto.createdBy === 'object'
        ? dto.createdBy.id
        : undefined
  const createdByName =
    dto.createdBy && typeof dto.createdBy === 'object' && typeof dto.createdBy.name === 'string'
      ? dto.createdBy.name
      : undefined

  return {
    id: dto.id,
    title: dto.title,
    description: dto.description ?? '',
    status: dto.status,
    tag: assignees.length > 0 ? `${assignees.length} assignee(s)` : 'Unassigned',
    dueDate: toDateInputValue(dto.dueDate),
    assignedToIds,
    assignees,
    createdById,
    createdByName,
    createdAt: dto.createdAt,
  }
}

function toDateInputValue(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const requestUrl = `${API_BASE_URL}${path}`
  const token = authTokenGetter?.()
  const headers = new Headers(init?.headers ?? {})
  headers.set('Content-Type', 'application/json')
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  const requestInit: RequestInit = {
    headers,
    ...init,
  }

  const response = await fetchWithTransientRetry(requestUrl, requestInit)

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    try {
      const body = (await response.json()) as { message?: string }
      if (body.message) message = body.message
    } catch {
      // Keep fallback message when response is not JSON.
    }
    throw new Error(message)
  }

  return (await response.json()) as T
}

/** WebView fetch blocks mixed content (https page → http API). Tauri’s HTTP plugin uses the OS client instead. */
async function appFetch(requestUrl: string, requestInit: RequestInit): Promise<Response> {
  if (isTauri()) {
    const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http')
    return tauriFetch(requestUrl, requestInit)
  }
  return fetch(requestUrl, requestInit)
}

async function fetchWithTransientRetry(
  requestUrl: string,
  requestInit: RequestInit
): Promise<Response> {
  try {
    return await appFetch(requestUrl, requestInit)
  } catch (error) {
    // API dev server can briefly restart while watching files; retry once.
    if (!isTransientNetworkError(error)) throw error
    await delay(350)
    return appFetch(requestUrl, requestInit)
  }
}

function isTransientNetworkError(error: unknown): boolean {
  return (
    error instanceof TypeError &&
    error.message.toLowerCase().includes('failed to fetch')
  )
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchTasksApi(): Promise<Task[]> {
  const data = await request<TaskDto[]>('/tasks')
  return data.map(mapTaskDto)
}

export type AuthSession = {
  accessToken: string
  user: User
}

export async function loginApi(input: { email: string; password: string }): Promise<AuthSession> {
  return request<AuthSession>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function signupApi(input: {
  name: string
  email: string
  password: string
}): Promise<AuthSession> {
  return request<AuthSession>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function fetchMeApi(): Promise<User> {
  return request<User>('/auth/me')
}

export async function changePasswordApi(input: {
  currentPassword: string
  newPassword: string
}): Promise<void> {
  await request<{ message: string }>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function forgotPasswordApi(email: string): Promise<void> {
  await request<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function resetPasswordApi(input: {
  token: string
  newPassword: string
}): Promise<void> {
  await request<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

type CreateTaskInput = {
  title: string
  description: string
  status: TaskStatus
  dueDate: string
  assignedToIds?: string[]
}

export async function createTaskApi(input: CreateTaskInput): Promise<Task> {
  const data = await request<TaskDto>('/tasks', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return mapTaskDto(data)
}

export async function updateTaskStatusApi(
  taskId: string,
  status: TaskStatus
): Promise<Task> {
  const data = await request<TaskDto>(`/tasks/${taskId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
  return mapTaskDto(data)
}

type UpdateTaskInput = {
  title: string
  description: string
  status: TaskStatus
  dueDate: string
  assignedToIds?: string[]
}

export async function updateTaskApi(
  taskId: string,
  input: UpdateTaskInput
): Promise<Task> {
  const data = await request<TaskDto>(`/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  return mapTaskDto(data)
}

export async function deleteTaskApi(taskId: string): Promise<void> {
  await request<{ message: string }>(`/tasks/${taskId}`, {
    method: 'DELETE',
  })
}

export async function fetchUsersApi(): Promise<User[]> {
  return request<User[]>('/users')
}

type UserInput = {
  name: string
  email: string
  avatarUrl?: string
}

export async function createUserApi(input: UserInput): Promise<User> {
  return request<User>('/users', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function updateUserApi(userId: string, input: UserInput): Promise<User> {
  return request<User>(`/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export async function deleteUserApi(userId: string): Promise<{ message: string }> {
  return request<{ message: string }>(`/users/${userId}`, {
    method: 'DELETE',
  })
}

export async function updateWorkspaceNameApi(
  workspaceId: string,
  workspaceName: string
): Promise<{ message: string; workspaceName: string }> {
  return request<{ message: string; workspaceName: string }>(`/users/workspaces/${workspaceId}/name`, {
    method: 'PATCH',
    body: JSON.stringify({ workspaceName }),
  })
}

export type NovuSubscriberAuth = {
  subscriberId: string
  subscriberHash: string | null
}

export async function fetchNovuSubscriberAuthApi(userId: string): Promise<NovuSubscriberAuth> {
  return request<NovuSubscriberAuth>(`/users/${userId}/novu-auth`)
}

export async function fetchUnreadNotificationCountApi(subscriberId: string): Promise<number> {
  const result = await request<{ subscriberId: string; unreadCount: number }>(
    `/notifications/unread-count/${subscriberId}`
  )
  return typeof result.unreadCount === 'number' ? Math.max(0, result.unreadCount) : 0
}

export type NotificationFeedItem = {
  id: string
  subject?: string
  body?: string
  createdAt?: string
  isRead?: boolean
  payload?: Record<string, unknown>
}

export type TeamInviteItem = {
  id: string
  workspaceId?: string
  inviterUserId?: string
  inviterName: string
  inviterEmail: string
  targetUserId?: string
  targetEmail: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt?: string
}

export async function fetchNotificationFeedApi(
  subscriberId: string,
  options?: { limit?: number; unreadOnly?: boolean }
): Promise<NotificationFeedItem[]> {
  const search = new URLSearchParams()
  if (options?.limit) search.set('limit', String(options.limit))
  if (options?.unreadOnly) search.set('unreadOnly', 'true')
  const suffix = search.toString() ? `?${search.toString()}` : ''
  const result = await request<{ notifications: NotificationFeedItem[] }>(
    `/notifications/feed/${subscriberId}${suffix}`
  )
  return Array.isArray(result.notifications) ? result.notifications : []
}

export async function markAllNotificationsReadApi(subscriberId: string): Promise<number> {
  const result = await request<{ updated: number }>(`/notifications/mark-all-read/${subscriberId}`, {
    method: 'POST',
  })
  return typeof result.updated === 'number' ? result.updated : 0
}

export async function fetchTeamInvitesApi(): Promise<TeamInviteItem[]> {
  const result = await request<{ invites: TeamInviteItem[] }>('/notifications/team-invites')
  return Array.isArray(result.invites) ? result.invites : []
}

export async function fetchWorkspacePendingInvitesApi(): Promise<TeamInviteItem[]> {
  const result = await request<{ invites: TeamInviteItem[] }>('/users/pending-invites')
  return Array.isArray(result.invites) ? result.invites : []
}

export async function cancelWorkspacePendingInviteApi(inviteId: string): Promise<void> {
  await request<{ message: string }>(`/users/pending-invites/${inviteId}`, {
    method: 'DELETE',
  })
}

export async function acceptTeamInviteApi(inviteId: string): Promise<void> {
  await request<{ message: string }>(`/notifications/team-invites/${inviteId}/accept`, {
    method: 'POST',
  })
}

export async function declineTeamInviteApi(inviteId: string): Promise<void> {
  await request<{ message: string }>(`/notifications/team-invites/${inviteId}/decline`, {
    method: 'POST',
  })
}
