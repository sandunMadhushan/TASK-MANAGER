import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { CreateTaskModal } from '@/components/tasks/CreateTaskModal'
import { TaskListView } from '@/components/tasks/TaskListView'
import { Button } from '@/components/ui/button'
import { isDueWithinDays } from '@/lib/format-due-date'
import { useTaskStore } from '@/store/task-store'

export function DashboardPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [createSession, setCreateSession] = useState(0)
  const tasks = useTaskStore((s) => s.tasks)
  const fetchTasks = useTaskStore((s) => s.fetchTasks)
  const fetchUsers = useTaskStore((s) => s.fetchUsers)

  function openCreateModal() {
    setCreateSession((s) => s + 1)
    setCreateOpen(true)
  }

  useEffect(() => {
    void fetchTasks()
    void fetchUsers()
  }, [fetchTasks, fetchUsers])

  const { activeCount, dueSoonCount } = useMemo(() => {
    const active = tasks.filter((t) => t.status !== 'done').length
    const dueSoon = tasks.filter(
      (t) =>
        t.status !== 'done' && isDueWithinDays(t.dueDate, 7)
    ).length
    return { activeCount: active, dueSoonCount: dueSoon }
  }, [tasks])

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <CreateTaskModal
        key={createSession}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
        initial={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Overview
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance md:text-4xl">
              Good afternoon, Alex
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Manage tasks with smooth interactions and real backend sync.
              Changes now persist to MongoDB through the Step 3 API.
            </p>
          </div>
          <motion.div
            className="flex flex-wrap items-center gap-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35 }}
          >
            <div className="flex gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left shadow-lg shadow-black/20 backdrop-blur-md">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Active
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                  {activeCount}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left shadow-lg shadow-black/20 backdrop-blur-md">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Due in 7d
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                  {dueSoonCount}
                </p>
              </div>
            </div>
            <Button
              className="shadow-lg shadow-primary/25"
              type="button"
              onClick={openCreateModal}
            >
              <Plus className="size-4" />
              New task
            </Button>
          </motion.div>
        </div>
      </motion.div>

      <section aria-labelledby="tasks-heading" className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2
            id="tasks-heading"
            className="font-heading text-lg font-semibold tracking-tight"
          >
            Your tasks
          </h2>
          <p className="text-xs text-muted-foreground">
            Step 4 · API connected
          </p>
        </div>

        <TaskListView onCreateClick={openCreateModal} />
      </section>
    </div>
  )
}
