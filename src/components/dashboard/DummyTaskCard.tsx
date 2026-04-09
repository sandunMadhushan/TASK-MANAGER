import { motion } from 'framer-motion'
import { CalendarDays, MoreHorizontal } from 'lucide-react'

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
import { cn } from '@/lib/utils'

export type DummyTask = {
  id: string
  title: string
  description: string
  status: 'todo' | 'in-progress' | 'done'
  dueLabel: string
  tag: string
}

const statusStyles: Record<
  DummyTask['status'],
  { label: string; className: string }
> = {
  todo: {
    label: 'To do',
    className:
      'border-white/15 bg-white/5 text-muted-foreground hover:bg-white/10',
  },
  'in-progress': {
    label: 'In progress',
    className:
      'border-amber-400/25 bg-amber-400/10 text-amber-100 hover:bg-amber-400/15',
  },
  done: {
    label: 'Done',
    className:
      'border-emerald-400/25 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/15',
  },
}

type DummyTaskCardProps = {
  task: DummyTask
  index: number
}

export function DummyTaskCard({ task, index }: DummyTaskCardProps) {
  const s = statusStyles[task.status]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{
        delay: 0.06 * index,
        duration: 0.4,
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
            <Button
              aria-label="Task actions"
              size="icon-sm"
              variant="ghost"
              type="button"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn('border', s.className)} variant="outline">
              {s.label}
            </Badge>
            <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="size-3.5" aria-hidden />
              <span>{task.dueLabel}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="justify-between border-white/10 bg-white/[0.03]">
          <div className="flex -space-x-2">
            {['SK', 'LM', 'JR'].map((initials) => (
              <div
                key={initials}
                className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-white/15 to-white/5 text-[10px] font-semibold text-foreground shadow-sm"
              >
                {initials}
              </div>
            ))}
          </div>
          <Button size="sm" variant="secondary" type="button">
            Open
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
