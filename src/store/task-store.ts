import { create } from 'zustand'
import { toast } from 'sonner'

import {
  createTaskApi,
  deleteTaskApi,
  fetchTasksApi,
  fetchUsersApi,
  updateTaskApi,
  updateTaskStatusApi,
} from '@/services/task-api'
import type { Task, TaskStatus } from '@/types/task'
import type { User } from '@/types/user'

type TaskStore = {
  tasks: Task[]
  users: User[]
  isLoading: boolean
  isUsersLoading: boolean
  isCreating: boolean
  isEditing: boolean
  updatingTaskId: string | null
  deletingTaskId: string | null
  error: string | null
  fetchTasks: (options?: { silent?: boolean }) => Promise<void>
  fetchUsers: (options?: { silent?: boolean }) => Promise<void>
  addTask: (
    input: Pick<Task, 'title' | 'description' | 'status' | 'dueDate' | 'assignedToIds'>
  ) => Promise<boolean>
  editTask: (
    id: string,
    input: Pick<Task, 'title' | 'description' | 'status' | 'dueDate' | 'assignedToIds'>
  ) => Promise<boolean>
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<void>
  deleteTask: (id: string) => Promise<void>
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  users: [],
  isLoading: false,
  isUsersLoading: false,
  isCreating: false,
  isEditing: false,
  updatingTaskId: null,
  deletingTaskId: null,
  error: null,
  fetchTasks: async (options) => {
    if (!options?.silent) {
      set({ isLoading: true, error: null })
    }
    try {
      const tasks = await fetchTasksApi()
      if (options?.silent) {
        set({ tasks, error: null })
      } else {
        set({ tasks, isLoading: false, error: null })
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to load tasks. Please try again.'
      if (options?.silent) {
        set({ error: message })
      } else {
        set({
          isLoading: false,
          error: message,
        })
      }
      if (!options?.silent) {
        toast.error('Failed to load tasks', { description: message })
      }
    }
  },
  fetchUsers: async (options) => {
    if (!options?.silent) {
      set({ isUsersLoading: true, error: null })
    }
    try {
      const users = await fetchUsersApi()
      if (options?.silent) {
        set({ users, error: null })
      } else {
        set({ users, isUsersLoading: false, error: null })
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to load users. Please try again.'
      if (options?.silent) {
        set({ error: message })
      } else {
        set({
          isUsersLoading: false,
          error: message,
        })
      }
      if (!options?.silent) {
        toast.error('Failed to load team', { description: message })
      }
    }
  },
  addTask: async (input) => {
    set({ isCreating: true, error: null })
    try {
      const task = await createTaskApi(input)
      set((s) => ({
        tasks: [task, ...s.tasks],
        isCreating: false,
        error: null,
      }))
      toast.success('Task created')
      return true
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to create task. Please try again.'
      set({
        isCreating: false,
        error: message,
      })
      toast.error('Task creation failed', { description: message })
      return false
    }
  },
  editTask: async (id, input) => {
    set({ isEditing: true, error: null })
    try {
      const task = await updateTaskApi(id, input)
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === id ? task : t)),
        isEditing: false,
      }))
      toast.success('Task updated')
      return true
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to update task. Please try again.'
      set({
        isEditing: false,
        error: message,
      })
      toast.error('Task update failed', { description: message })
      return false
    }
  },
  updateTaskStatus: async (id, status) => {
    set({ updatingTaskId: id, error: null })
    try {
      const updated = await updateTaskStatusApi(id, status)
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === id ? updated : t)),
        updatingTaskId: null,
      }))
      toast.success('Task status updated')
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to update status. Please try again.'
      set({
        updatingTaskId: null,
        error: message,
      })
      toast.error('Status update failed', { description: message })
    }
  },
  deleteTask: async (id) => {
    set({ deletingTaskId: id, error: null })
    try {
      await deleteTaskApi(id)
      set((s) => ({
        tasks: s.tasks.filter((t) => t.id !== id),
        deletingTaskId: null,
      }))
      toast.success('Task deleted')
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to delete task. Please try again.'
      set({
        deletingTaskId: null,
        error: message,
      })
      toast.error('Task deletion failed', { description: message })
    }
  },
}))
