import { motion } from 'framer-motion'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [dueDate, setDueDate] = useState(todayIsoDate())
  const [tag, setTag] = useState('')
  const [titleError, setTitleError] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) {
      setTitleError('Add a short title so the task is easy to find.')
      return
    }
    setTitleError('')
    addTask({
      title: trimmed,
      description: description.trim(),
      status,
      dueDate,
      tag: tag.trim() || 'General',
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="max-h-[min(90vh,640px)] overflow-y-auto border-white/10 bg-popover/92 shadow-2xl ring-white/10 backdrop-blur-xl duration-300 data-closed:duration-200 sm:max-w-md"
      >
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <DialogHeader>
            <DialogTitle>Create task</DialogTitle>
            <DialogDescription>
              Tasks are saved in memory only for this step — no server yet.
            </DialogDescription>
          </DialogHeader>

          <form className="mt-2 space-y-4" onSubmit={handleSubmit}>
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
                  <SelectContent>
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
              <FieldLabel htmlFor="task-tag">Tag (optional)</FieldLabel>
              <FieldContent>
                <Input
                  id="task-tag"
                  placeholder="e.g. Backend"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                />
              </FieldContent>
            </Field>

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create task</Button>
            </div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
