import { motion } from 'framer-motion'
import {
  Bell,
  CheckSquare,
  LayoutDashboard,
  Settings2,
  Sparkles,
  Users,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const nav = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
  { icon: CheckSquare, label: 'Tasks', to: '/tasks' },
  { icon: Users, label: 'Team', to: '/team' },
  { icon: Bell, label: 'Notifications', to: '/notifications' },
  { icon: Settings2, label: 'Settings', to: '/settings' },
] as const

type AppSidebarProps = {
  onNavigate?: () => void
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  return (
    <div className="flex h-full flex-col border-r border-white/10 bg-sidebar/70 py-6 shadow-[inset_-1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-2xl">
      <div className="px-5">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex size-11 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500/90 to-fuchsia-600/80 text-white shadow-lg shadow-violet-500/25 ring-1 ring-white/20">
            <Sparkles className="size-5" aria-hidden />
          </div>
          <div className="min-w-0 text-left">
            <p className="truncate font-heading text-base font-semibold tracking-tight text-foreground">
              Nexus Tasks
            </p>
            <p className="truncate text-xs text-muted-foreground">
              Workspace preview
            </p>
          </div>
        </motion.div>
      </div>

      <Separator className="my-6 bg-white/10" />

      <ScrollArea className="flex-1 px-3">
        <nav aria-label="Main" className="space-y-1">
          {nav.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.05 * i,
                duration: 0.3,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <NavLink
                to={item.to}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors',
                  'text-muted-foreground hover:bg-white/5 hover:text-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                  'aria-[current=page]:bg-white/10 aria-[current=page]:text-foreground aria-[current=page]:shadow-inner aria-[current=page]:ring-1 aria-[current=page]:ring-white/10'
                )}
                onClick={onNavigate}
              >
                <item.icon
                  className="size-[18px] shrink-0 opacity-80"
                  aria-hidden
                />
                {item.label}
              </NavLink>
            </motion.div>
          ))}
        </nav>
      </ScrollArea>

      <div className="mt-auto space-y-3 px-4 pt-4">
        <div className="rounded-2xl border border-white/10 bg-white/4 p-4 backdrop-blur-md">
          <p className="text-xs font-medium text-foreground">Pro tip</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Drag cards to reorder when we wire up the board in a later step.
          </p>
          <Button
            className="mt-3 w-full shadow-lg shadow-primary/20"
            size="sm"
            variant="secondary"
            type="button"
          >
            Explore
          </Button>
        </div>
      </div>
    </div>
  )
}
