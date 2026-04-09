import { motion } from 'framer-motion'
import { CalendarDays, Loader2, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EditTaskModal } from '@/components/tasks/EditTaskModal'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDueDateLabel } from '@/lib/format-due-date'
import { cn } from '@/lib/utils'
import { useTaskStore } from '@/store/task-store'
import type { Task, TaskStatus } from '@/types/task'

type TaskCardProps = {
  task: Task
  index: number
}

export function TaskCard({ task, index }: TaskCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [editSession, setEditSession] = useState(0)
  const users = useTaskStore((s) => s.users)
  const deleteTask = useTaskStore((s) => s.deleteTask)
  const updateTaskStatus = useTaskStore((s) => s.updateTaskStatus)
  const updatingTaskId = useTaskStore((s) => s.updatingTaskId)
  const deletingTaskId = useTaskStore((s) => s.deletingTaskId)
  const isUpdating = updatingTaskId === task.id
  const isDeleting = deletingTaskId === task.id
  const resolvedAssignees =
    task.assignees && task.assignees.length > 0
      ? task.assignees
      : (task.assignedToIds ?? [])
          .map((id) => users.find((user) => user.id === id))
          .filter((user): user is NonNullable<typeof user> => Boolean(user))

  function openEdit() {
    setEditSession((s) => s + 1)
    setEditOpen(true)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, filter: 'blur(4px)' }}
      transition={{
        delay: 0.04 * Math.min(index, 8),
        duration: 0.38,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -4 }}
    >
      <EditTaskModal
        key={`${task.id}-${editSession}`}
        task={task}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <Card
        className={cn(
          'border-white/10 bg-card/70 shadow-xl shadow-black/25 ring-1 ring-white/10 backdrop-blur-xl transition-[transform,box-shadow] duration-300',
          'hover:shadow-2xl hover:shadow-violet-500/10'
        )}
      >
        <CardHeader className="gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <Badge
                className="rounded-lg border border-white/10 bg-white/5 text-[11px] text-muted-foreground"
                variant="outline"
              >
                {task.tag}
              </Badge>
              <CardTitle className="text-balance pt-1">{task.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {task.description}
              </CardDescription>
              <p className="pt-1 text-[11px] text-muted-foreground">
                Assigned to:{' '}
                <span className="font-medium text-foreground/90">
                  {resolvedAssignees.length
                    ? resolvedAssignees.map((u) => u.name).join(', ')
                    : 'Unassigned'}
                </span>
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5" aria-hidden />
            <span>Due {formatDueDateLabel(task.dueDate)}</span>
          </div>

          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground">
              Status
            </p>
            <Select
              value={task.status}
              onValueChange={(value) =>
                updateTaskStatus(task.id, value as TaskStatus)
              }
            >
              <SelectTrigger
                className="h-8 w-full min-w-0"
                size="default"
                disabled={isUpdating || isDeleting}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">To do</SelectItem>
                <SelectItem value="in-progress">In progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>

        <CardFooter className="justify-between gap-2 border-white/10 bg-white/3">
          <div className="text-xs text-muted-foreground">
            {resolvedAssignees.length
              ? resolvedAssignees.map((u) => u.email).join(', ')
              : 'No assignee email'}
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            {isUpdating || isDeleting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                <span>{isDeleting ? 'Deleting...' : 'Saving...'}</span>
              </>
            ) : (
              <span>Synced</span>
            )}
          </div>
          <Button
            aria-label={`Edit ${task.title}`}
            size="sm"
            variant="ghost"
            type="button"
            className="hover:bg-white/10"
            disabled={isDeleting || isUpdating}
            onClick={openEdit}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            aria-label={`Delete ${task.title}`}
            size="sm"
            variant="ghost"
            type="button"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={isDeleting || isUpdating}
            onClick={() => void deleteTask(task.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
