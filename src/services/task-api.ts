import type { Task, TaskStatus } from '@/types/task'

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim()
  ? (import.meta.env.VITE_API_URL as string).trim()
  : 'http://localhost:4000/api'

type TaskDto = {
  id: string
  title: string
  description: string
  status: TaskStatus
  assignedTo?: string | null
  dueDate: string
  createdAt?: string
}

function mapTaskDto(dto: TaskDto): Task {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description ?? '',
    status: dto.status,
    tag: dto.assignedTo ? 'Assigned' : 'General',
    dueDate: toDateInputValue(dto.dueDate),
    assignedTo: dto.assignedTo ?? null,
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
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })

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

export async function fetchTasksApi(): Promise<Task[]> {
  const data = await request<TaskDto[]>('/tasks')
  return data.map(mapTaskDto)
}

type CreateTaskInput = {
  title: string
  description: string
  status: TaskStatus
  dueDate: string
  assignedTo?: string | null
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

export async function deleteTaskApi(taskId: string): Promise<void> {
  await request<{ message: string }>(`/tasks/${taskId}`, {
    method: 'DELETE',
  })
}
