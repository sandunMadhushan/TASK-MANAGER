import { motion } from 'framer-motion'
import { CalendarDays, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  const removeTask = useTaskStore((s) => s.removeTask)
  const updateTaskStatus = useTaskStore((s) => s.updateTaskStatus)

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
              <SelectTrigger className="h-8 w-full min-w-0" size="default">
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
          <div className="flex -space-x-2">
            {['SK', 'LM', 'JR'].map((initials) => (
              <div
                key={initials}
                className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-linear-to-br from-white/15 to-white/5 text-[10px] font-semibold text-foreground shadow-sm"
              >
                {initials}
              </div>
            ))}
          </div>
          <Button
            aria-label={`Delete ${task.title}`}
            size="sm"
            variant="ghost"
            type="button"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => removeTask(task.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
