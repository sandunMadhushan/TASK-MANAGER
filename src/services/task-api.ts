import type { Task, TaskStatus } from '@/types/task'
import type { User } from '@/types/user'

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim()
  ? (import.meta.env.VITE_API_URL as string).trim()
  : 'http://localhost:4000/api'

type TaskDto = {
  id: string
  title: string
  description: string
  status: TaskStatus
  assignedTo?: string | User | Array<string | User> | null
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

  return {
    id: dto.id,
    title: dto.title,
    description: dto.description ?? '',
    status: dto.status,
    tag: assignees.length > 0 ? `${assignees.length} assignee(s)` : 'Unassigned',
    dueDate: toDateInputValue(dto.dueDate),
    assignedToIds,
    assignees,
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
  const requestInit: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
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

async function fetchWithTransientRetry(
  requestUrl: string,
  requestInit: RequestInit
): Promise<Response> {
  try {
    return await fetch(requestUrl, requestInit)
  } catch (error) {
    // API dev server can briefly restart while watching files; retry once.
    if (!isTransientNetworkError(error)) throw error
    await delay(350)
    return fetch(requestUrl, requestInit)
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

export async function deleteUserApi(userId: string): Promise<void> {
  await request<{ message: string }>(`/users/${userId}`, {
    method: 'DELETE',
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
