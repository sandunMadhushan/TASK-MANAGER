import { motion } from 'framer-motion'
import { Settings2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSettingsStore } from '@/store/settings-store'
import type { TaskSortOption } from '@/store/settings-store'

export function SettingsPage() {
  const reducedMotion = useSettingsStore((s) => s.reducedMotion)
  const compactCards = useSettingsStore((s) => s.compactCards)
  const defaultTaskSort = useSettingsStore((s) => s.defaultTaskSort)
  const setReducedMotion = useSettingsStore((s) => s.setReducedMotion)
  const setCompactCards = useSettingsStore((s) => s.setCompactCards)
  const setDefaultTaskSort = useSettingsStore((s) => s.setDefaultTaskSort)
  const sortLabel: Record<TaskSortOption, string> = {
    'due-asc': 'Due soonest',
    'due-desc': 'Due latest',
    newest: 'Newest',
    oldest: 'Oldest',
    title: 'Title A-Z',
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Workspace and profile preferences will be configured here.
        </p>
      </motion.div>

      <Card className="border-white/10 bg-white/4 backdrop-blur-md">
        <CardContent className="space-y-4 px-4 py-5 sm:px-6 sm:py-6">
          <div className="mb-1 flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-linear-to-br from-violet-500/20 to-fuchsia-500/15 ring-1 ring-white/10">
              <Settings2 className="size-4.5 text-muted-foreground" aria-hidden />
            </div>
            <h2 className="font-heading text-base font-semibold">Experience</h2>
          </div>

          <div className="grid gap-3">
            <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-foreground">Reduced motion</p>
                <p className="text-xs text-muted-foreground">
                  Minimizes animations and transitions across the app.
                </p>
              </div>
              <Button
                size="sm"
                variant={reducedMotion ? 'default' : 'outline'}
                type="button"
                onClick={() => setReducedMotion(!reducedMotion)}
              >
                {reducedMotion ? 'On' : 'Off'}
              </Button>
            </label>

            <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-foreground">Compact task cards</p>
                <p className="text-xs text-muted-foreground">
                  Shows denser spacing in task grids for more content on screen.
                </p>
              </div>
              <Button
                size="sm"
                variant={compactCards ? 'default' : 'outline'}
                type="button"
                onClick={() => setCompactCards(!compactCards)}
              >
                {compactCards ? 'On' : 'Off'}
              </Button>
            </label>

            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
              <p className="text-sm font-medium text-foreground">Default task sort</p>
              <p className="mb-2 text-xs text-muted-foreground">
                Used as the default order in the Tasks page.
              </p>
              <Select
                value={defaultTaskSort}
                onValueChange={(value) => setDefaultTaskSort(value as TaskSortOption)}
              >
                <SelectTrigger className="w-full" aria-label="Default task sort">
                  <SelectValue>{sortLabel[defaultTaskSort]}</SelectValue>
                </SelectTrigger>
                <SelectContent side="bottom" sideOffset={8} align="start" alignItemWithTrigger={false}>
                  <SelectItem value="due-asc">Due soonest</SelectItem>
                  <SelectItem value="due-desc">Due latest</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="title">Title A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

