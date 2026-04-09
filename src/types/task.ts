export type TaskStatus = 'todo' | 'in-progress' | 'done'

export type Task = {
  id: string
  title: string
  description: string
  status: TaskStatus
  /** Local date string `YYYY-MM-DD` (from `<input type="date" />`). */
  dueDate: string
  tag: string
  assignedTo?: string | null
  createdAt?: string
}
