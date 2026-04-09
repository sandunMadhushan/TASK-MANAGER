import { create } from 'zustand'

import { todayIsoDate } from '@/lib/format-due-date'
import type { Task, TaskStatus } from '@/types/task'

type TaskStore = {
  tasks: Task[]
  addTask: (input: Omit<Task, 'id'>) => void
  removeTask: (id: string) => void
  updateTaskStatus: (id: string, status: TaskStatus) => void
}

const seedTasks: Task[] = [
  {
    id: 'seed-1',
    title: 'Design system audit',
    description:
      'Review tokens, spacing, and motion across dashboard surfaces for consistency.',
    status: 'in-progress',
    dueDate: '2026-04-12',
    tag: 'Design',
  },
  {
    id: 'seed-2',
    title: 'API contract for tasks',
    description:
      'Draft request/response shapes for create, list, and status transitions.',
    status: 'todo',
    dueDate: '2026-04-15',
    tag: 'Backend',
  },
  {
    id: 'seed-3',
    title: 'Notification templates',
    description:
      'Map Novu workflows for assignment, completion, and deadline reminders.',
    status: 'todo',
    dueDate: '2026-04-18',
    tag: 'Notifications',
  },
  {
    id: 'seed-4',
    title: 'Mobile navigation polish',
    description:
      'Tighten hit targets, springy drawer motion, and focus order for a11y.',
    status: 'done',
    dueDate: todayIsoDate(),
    tag: 'Frontend',
  },
  {
    id: 'seed-5',
    title: 'Weekly stakeholder sync',
    description:
      'Share progress on task flows, assignments, and notification triggers.',
    status: 'in-progress',
    dueDate: '2026-04-10',
    tag: 'Ops',
  },
  {
    id: 'seed-6',
    title: 'Empty & loading states',
    description:
      'Add skeleton rows and friendly copy for first-time project setup.',
    status: 'todo',
    dueDate: '2026-04-22',
    tag: 'UX',
  },
]

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: seedTasks,
  addTask: (input) =>
    set((s) => ({
      tasks: [{ ...input, id: crypto.randomUUID() }, ...s.tasks],
    })),
  removeTask: (id) =>
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== id),
    })),
  updateTaskStatus: (id, status) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
    })),
}))
