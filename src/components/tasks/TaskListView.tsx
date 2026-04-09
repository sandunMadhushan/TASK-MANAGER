import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, LayoutList, Loader2, Plus, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { TaskCard } from '@/components/tasks/TaskCard'
import { useTaskStore } from '@/store/task-store'

type TaskListViewProps = {
  onCreateClick: () => void
}

export function TaskListView({ onCreateClick }: TaskListViewProps) {
  const tasks = useTaskStore((s) => s.tasks)
  const isLoading = useTaskStore((s) => s.isLoading)
  const error = useTaskStore((s) => s.error)
  const fetchTasks = useTaskStore((s) => s.fetchTasks)

  if (isLoading) {
    return (
      <motion.div
        className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/4 px-6 py-16 text-center backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
        <p className="mt-3 text-sm text-muted-foreground">Loading tasks...</p>
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
        <p className="mt-3 max-w-md text-sm text-destructive/90">{error}</p>
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

  if (tasks.length === 0) {
    return (
      <motion.div
        className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/4 px-6 py-16 text-center backdrop-blur-md"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500/20 to-fuchsia-500/15 ring-1 ring-white/10">
          <LayoutList className="size-7 text-muted-foreground" aria-hidden />
        </div>
        <h3 className="font-heading text-lg font-semibold text-foreground">
          No tasks yet
        </h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Create your first task to see it appear here with motion.
        </p>
        <Button
          className="mt-6 shadow-lg shadow-primary/20"
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
        {tasks.map((task, index) => (
          <TaskCard key={task.id} index={index} task={task} />
        ))}
      </AnimatePresence>
    </div>
  )
}
