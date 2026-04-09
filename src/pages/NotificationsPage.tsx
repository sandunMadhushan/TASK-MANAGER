import { motion } from 'framer-motion'
import { BellRing } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'

export function NotificationsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          Notifications
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Use the top-right bell for the live Novu inbox and actions.
        </p>
      </motion.div>

      <Card className="border-dashed border-white/15 bg-white/4 backdrop-blur-md">
        <CardContent className="flex min-h-[280px] flex-col items-center justify-center px-6 py-12 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500/20 to-fuchsia-500/15 ring-1 ring-white/10">
            <BellRing className="size-7 text-muted-foreground" aria-hidden />
          </div>
          <h2 className="font-heading text-lg font-semibold">Live inbox is in the header bell</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Open notifications from the bell icon in the top navigation to mark read/unread and
            manage the feed in real time.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

