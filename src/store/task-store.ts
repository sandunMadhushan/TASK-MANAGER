import { create } from 'zustand'

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
  fetchTasks: () => Promise<void>
  fetchUsers: () => Promise<void>
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
  fetchTasks: async () => {
    set({ isLoading: true, error: null })
    try {
      const tasks = await fetchTasksApi()
      set({ tasks, isLoading: false, error: null })
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to load tasks. Please try again.',
      })
    }
  },
  fetchUsers: async () => {
    set({ isUsersLoading: true, error: null })
    try {
      const users = await fetchUsersApi()
      set({ users, isUsersLoading: false, error: null })
    } catch (error) {
      set({
        isUsersLoading: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to load users. Please try again.',
      })
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
      return true
    } catch (error) {
      set({
        isCreating: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to create task. Please try again.',
      })
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
      return true
    } catch (error) {
      set({
        isEditing: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to update task. Please try again.',
      })
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
    } catch (error) {
      set({
        updatingTaskId: null,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to update status. Please try again.',
      })
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
    } catch (error) {
      set({
        deletingTaskId: null,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to delete task. Please try again.',
      })
    }
  },
}))
