import { motion } from 'framer-motion'

import { DummyTaskCard, type DummyTask } from '@/components/dashboard/DummyTaskCard'

const DUMMY_TASKS: DummyTask[] = [
  {
    id: '1',
    title: 'Design system audit',
    description:
      'Review tokens, spacing, and motion across dashboard surfaces for consistency.',
    status: 'in-progress',
    dueLabel: 'Due Apr 12',
    tag: 'Design',
  },
  {
    id: '2',
    title: 'API contract for tasks',
    description:
      'Draft request/response shapes for create, list, and status transitions.',
    status: 'todo',
    dueLabel: 'Due Apr 15',
    tag: 'Backend',
  },
  {
    id: '3',
    title: 'Notification templates',
    description:
      'Map Novu workflows for assignment, completion, and deadline reminders.',
    status: 'todo',
    dueLabel: 'Due Apr 18',
    tag: 'Notifications',
  },
  {
    id: '4',
    title: 'Mobile navigation polish',
    description:
      'Tighten hit targets, springy drawer motion, and focus order for a11y.',
    status: 'done',
    dueLabel: 'Completed',
    tag: 'Frontend',
  },
  {
    id: '5',
    title: 'Weekly stakeholder sync',
    description:
      'Share progress on task flows, assignments, and notification triggers.',
    status: 'in-progress',
    dueLabel: 'Due Apr 10',
    tag: 'Ops',
  },
  {
    id: '6',
    title: 'Empty & loading states',
    description:
      'Add skeleton rows and friendly copy for first-time project setup.',
    status: 'todo',
    dueLabel: 'Due Apr 22',
    tag: 'UX',
  },
]

export function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
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
              Here is a glassmorphism preview of your workspace. Task data is
              static for now — we will connect APIs in later steps.
            </p>
          </div>
          <motion.div
            className="flex gap-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35 }}
          >
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left shadow-lg shadow-black/20 backdrop-blur-md">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Active
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                18
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left shadow-lg shadow-black/20 backdrop-blur-md">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Due soon
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                6
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <section aria-labelledby="tasks-heading" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2
            id="tasks-heading"
            className="font-heading text-lg font-semibold tracking-tight"
          >
            Focus for this week
          </h2>
          <p className="text-xs text-muted-foreground">Dummy cards · Step 1</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {DUMMY_TASKS.map((task, index) => (
            <DummyTaskCard key={task.id} index={index} task={task} />
          ))}
        </div>
      </section>
    </div>
  )
}
