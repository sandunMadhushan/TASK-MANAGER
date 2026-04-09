import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { AlertCircle, LayoutList, Plus, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { TaskCard } from '@/components/tasks/TaskCard'
import { useTaskStore } from '@/store/task-store'
import type { Task } from '@/types/task'

type TaskListViewProps = {
  onCreateClick: () => void
  tasks?: Task[]
  emptyTitle?: string
  emptyDescription?: string
}

export function TaskListView({
  onCreateClick,
  tasks,
  emptyTitle = 'No tasks yet',
  emptyDescription = 'Create your first task to see it appear here with motion.',
}: TaskListViewProps) {
  const storeTasks = useTaskStore((s) => s.tasks)
  const isLoading = useTaskStore((s) => s.isLoading)
  const error = useTaskStore((s) => s.error)
  const fetchTasks = useTaskStore((s) => s.fetchTasks)
  const reduceMotion = useReducedMotion()
  const renderedTasks = tasks ?? storeTasks

  if (isLoading) {
    return (
      <motion.div
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={reduceMotion ? undefined : { opacity: 1 }}
      >
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="overflow-hidden rounded-2xl border border-white/10 bg-card/60 p-4 shadow-lg shadow-black/20 backdrop-blur-xl"
            aria-hidden
          >
            <div className="h-4 w-20 animate-pulse rounded bg-white/10" />
            <div className="mt-3 h-6 w-3/4 animate-pulse rounded bg-white/10" />
            <div className="mt-2 h-4 w-full animate-pulse rounded bg-white/8" />
            <div className="mt-1 h-4 w-5/6 animate-pulse rounded bg-white/8" />
            <div className="mt-6 h-8 w-full animate-pulse rounded bg-white/10" />
            <div className="mt-4 h-9 w-full animate-pulse rounded bg-white/10" />
          </div>
        ))}
        <span className="sr-only" aria-live="polite">
          Loading tasks
        </span>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-destructive/25 bg-destructive/8 px-6 py-16 text-center backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <AlertCircle className="size-8 text-destructive" aria-hidden />
        <p className="mt-3 max-w-md text-sm text-destructive/90" role="status" aria-live="polite">
          {error}
        </p>
        <Button
          className="mt-5"
          variant="secondary"
          type="button"
          onClick={() => void fetchTasks()}
        >
          <RefreshCw className="size-4" />
          Retry
        </Button>
      </motion.div>
    )
  }

  if (renderedTasks.length === 0) {
    return (
      <motion.div
        className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/4 px-5 py-14 text-center backdrop-blur-md sm:px-6 sm:py-16"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500/20 to-fuchsia-500/15 ring-1 ring-white/10">
          <LayoutList className="size-7 text-muted-foreground" aria-hidden />
        </div>
        <h3 className="font-heading text-lg font-semibold text-foreground">{emptyTitle}</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {emptyDescription}
        </p>
        <Button
          className="mt-6 min-w-28 shadow-lg shadow-primary/20 focus-visible:ring-primary/40"
          type="button"
          onClick={onCreateClick}
        >
          <Plus className="size-4" />
          New task
        </Button>
      </motion.div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <AnimatePresence mode="popLayout">
        {renderedTasks.map((task, index) => (
          <TaskCard key={task.id} index={index} task={task} />
        ))}
      </AnimatePresence>
    </div>
  )
}
