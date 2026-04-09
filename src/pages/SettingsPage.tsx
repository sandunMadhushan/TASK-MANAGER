import { motion } from 'framer-motion'
import { Settings2 } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'

export function SettingsPage() {
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

      <Card className="border-dashed border-white/15 bg-white/4 backdrop-blur-md">
        <CardContent className="flex min-h-[280px] flex-col items-center justify-center px-6 py-12 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500/20 to-fuchsia-500/15 ring-1 ring-white/10">
            <Settings2 className="size-7 text-muted-foreground" aria-hidden />
          </div>
          <h2 className="font-heading text-lg font-semibold">Settings panel coming next</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Preference controls will be added in the next iteration, including notification and
            workspace options.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

