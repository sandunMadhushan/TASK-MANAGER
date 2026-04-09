import { motion } from 'framer-motion'
import { CheckCircle2, ListChecks, Mail, Timer, Users } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTaskStore } from '@/store/task-store'

export function TeamPage() {
  const users = useTaskStore((s) => s.users)
  const tasks = useTaskStore((s) => s.tasks)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const searchText = (searchParams.get('q') ?? '').trim().toLowerCase()

  const statsByUser = useMemo(() => {
    const map = new Map<
      string,
      { total: number; todo: number; inProgress: number; done: number }
    >()

    for (const task of tasks) {
      for (const assigneeId of task.assignedToIds ?? []) {
        const current = map.get(assigneeId) ?? { total: 0, todo: 0, inProgress: 0, done: 0 }
        current.total += 1
        if (task.status === 'todo') current.todo += 1
        if (task.status === 'in-progress') current.inProgress += 1
        if (task.status === 'done') current.done += 1
        map.set(assigneeId, current)
      }
    }

    return map
  }, [tasks])

  const visibleUsers = useMemo(() => {
    if (!searchText) return users
    return users.filter((user) => {
      const haystack = `${user.name} ${user.email}`.toLowerCase()
      return haystack.includes(searchText)
    })
  }, [searchText, users])

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">Team</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Workspace members available for task assignments.
        </p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visibleUsers.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.3 }}
          >
            <Card className="border-white/10 bg-card/70 backdrop-blur-xl">
              <CardHeader className="pb-2">
                <CardTitle className="inline-flex items-center gap-2 text-base">
                  <Users className="size-4 text-primary" />
                  {user.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0 text-sm text-muted-foreground">
                <p className="inline-flex items-center gap-2">
                  <Mail className="size-3.5" />
                  {user.email}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-2">
                    <p className="text-muted-foreground">Total</p>
                    <p className="mt-1 inline-flex items-center gap-1 font-semibold text-foreground">
                      <ListChecks className="size-3.5 text-primary" />
                      {statsByUser.get(user.id)?.total ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-2">
                    <p className="text-muted-foreground">To do</p>
                    <p className="mt-1 inline-flex items-center gap-1 font-semibold text-foreground">
                      <Timer className="size-3.5 text-amber-300" />
                      {statsByUser.get(user.id)?.todo ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-2">
                    <p className="text-muted-foreground">In progress</p>
                    <p className="mt-1 font-semibold text-foreground">
                      {statsByUser.get(user.id)?.inProgress ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-2">
                    <p className="text-muted-foreground">Done</p>
                    <p className="mt-1 inline-flex items-center gap-1 font-semibold text-foreground">
                      <CheckCircle2 className="size-3.5 text-emerald-300" />
                      {statsByUser.get(user.id)?.done ?? 0}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full"
                  type="button"
                  onClick={() => navigate(`/tasks?assignee=${encodeURIComponent(user.id)}`)}
                >
                  View assigned tasks
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      {visibleUsers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/4 p-8 text-center text-sm text-muted-foreground">
          No team members match your search.
        </div>
      ) : null}
    </div>
  )
}

