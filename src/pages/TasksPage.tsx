import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useState } from 'react'

import { CreateTaskModal } from '@/components/tasks/CreateTaskModal'
import { TaskListView } from '@/components/tasks/TaskListView'
import { Button } from '@/components/ui/button'

export function TasksPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [createSession, setCreateSession] = useState(0)

  function openCreateModal() {
    setCreateSession((s) => s + 1)
    setCreateOpen(true)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <CreateTaskModal key={createSession} open={createOpen} onOpenChange={setCreateOpen} />

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.3 }}
      >
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Tasks
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage all tasks with status updates, assignees, and due dates.
          </p>
        </div>
        <Button className="shadow-lg shadow-primary/25" type="button" onClick={openCreateModal}>
          <Plus className="size-4" />
          New task
        </Button>
      </motion.div>

      <TaskListView onCreateClick={openCreateModal} />
    </div>
  )
}

