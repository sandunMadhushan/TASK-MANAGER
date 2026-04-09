import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { todayIsoDate } from '@/lib/format-due-date'
import { useTaskStore } from '@/store/task-store'
import type { TaskStatus } from '@/types/task'

type CreateTaskModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateTaskModal({ open, onOpenChange }: CreateTaskModalProps) {
  const addTask = useTaskStore((s) => s.addTask)
  const users = useTaskStore((s) => s.users)
  const isUsersLoading = useTaskStore((s) => s.isUsersLoading)
  const isCreating = useTaskStore((s) => s.isCreating)
  const error = useTaskStore((s) => s.error)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [dueDate, setDueDate] = useState(todayIsoDate())
  const [assignedToIds, setAssignedToIds] = useState<string[]>([])
  const [titleError, setTitleError] = useState('')

  function toggleAssignee(userId: string) {
    setAssignedToIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) {
      setTitleError('Add a short title so the task is easy to find.')
      return
    }
    setTitleError('')
    const created = await addTask({
      title: trimmed,
      description: description.trim(),
      status,
      dueDate,
      assignedToIds,
    })
    if (created) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="scrollbar-glass max-h-[min(90vh,640px)] overflow-y-auto border-white/10 bg-popover/92 shadow-2xl ring-white/10 backdrop-blur-xl duration-300 data-closed:duration-200 sm:max-w-md"
      >
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <DialogHeader>
            <DialogTitle>Create task</DialogTitle>
            <DialogDescription>
              This creates a real task via the backend API.
            </DialogDescription>
          </DialogHeader>

          <form className="mt-2 space-y-4" onSubmit={handleSubmit}>
            {error ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            ) : null}

            <Field data-invalid={!!titleError || undefined}>
              <FieldLabel htmlFor="task-title">Title</FieldLabel>
              <FieldContent>
                <Input
                  id="task-title"
                  autoComplete="off"
                  aria-invalid={!!titleError}
                  placeholder="e.g. Draft API contract"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    if (titleError) setTitleError('')
                  }}
                />
              </FieldContent>
              {titleError ? <FieldError>{titleError}</FieldError> : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="task-description">Description</FieldLabel>
              <FieldContent>
                <Textarea
                  id="task-description"
                  className="min-h-[88px] resize-y"
                  placeholder="Context, acceptance criteria, links…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="task-status">Status</FieldLabel>
              <FieldContent>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as TaskStatus)}
                >
                  <SelectTrigger id="task-status" className="w-full min-w-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="bottom" sideOffset={8} align="start" alignItemWithTrigger={false}>
                    <SelectItem value="todo">To do</SelectItem>
                    <SelectItem value="in-progress">In progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="task-due">Due date</FieldLabel>
              <FieldContent>
                <Input
                  id="task-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Assign users (optional)</FieldLabel>
              <FieldContent>
                <div className="space-y-2 rounded-lg border border-white/10 bg-white/4 p-3">
                  {isUsersLoading ? (
                    <p className="text-xs text-muted-foreground">Loading users...</p>
                  ) : users.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No users available.</p>
                  ) : (
                    users.map((user) => (
                      <label
                        key={user.id}
                        className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 hover:bg-white/5"
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 h-4 w-4 accent-violet-500"
                          checked={assignedToIds.includes(user.id)}
                          onChange={() => toggleAssignee(user.id)}
                        />
                        <span className="text-sm">
                          {user.name}{' '}
                          <span className="text-muted-foreground">({user.email})</span>
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </FieldContent>
            </Field>

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={isCreating}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create task'
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
