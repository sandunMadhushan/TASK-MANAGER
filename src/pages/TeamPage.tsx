import { motion } from 'framer-motion'
import { Mail, Users } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTaskStore } from '@/store/task-store'

export function TeamPage() {
  const users = useTaskStore((s) => s.users)

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
        {users.map((user, index) => (
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
              <CardContent className="pt-0 text-sm text-muted-foreground">
                <p className="inline-flex items-center gap-2">
                  <Mail className="size-3.5" />
                  {user.email}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

