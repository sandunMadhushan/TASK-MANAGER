import { motion } from 'framer-motion'
import { Menu, Search } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { NovuInboxBell } from '@/components/notifications/NovuInboxBell'
import { Button } from '@/components/ui/button'

type TopNavProps = {
  onMenuClick: () => void
}

export function TopNav({ onMenuClick }: TopNavProps) {
  return (
    <motion.header
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-30 border-b border-white/10 bg-background/55 px-3 py-3 backdrop-blur-xl md:px-6"
      initial={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <Button
          aria-label="Open navigation"
          className="md:hidden"
          size="icon-sm"
          variant="outline"
          type="button"
          onClick={onMenuClick}
        >
          <Menu className="size-[18px]" />
        </Button>

        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            aria-label="Search"
            className="h-10 w-full max-w-xl rounded-xl border border-white/10 bg-white/6 pl-10 pr-3 text-sm text-foreground outline-none ring-primary/30 transition-[box-shadow,border-color] placeholder:text-muted-foreground focus:border-primary/40 focus:ring-4"
            placeholder="Search tasks, people, or tags…"
            type="search"
          />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <NovuInboxBell />

          <div className="hidden h-8 w-px bg-white/10 sm:block" />

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 py-1 pl-1 pr-2 backdrop-blur-md">
            <Avatar className="size-8 ring-2 ring-primary/30">
              <AvatarImage alt="" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Nexus" />
              <AvatarFallback className="text-xs">NX</AvatarFallback>
            </Avatar>
            <div className="hidden leading-tight sm:block">
              <p className="text-xs font-medium text-foreground">Alex Morgan</p>
              <p className="text-[11px] text-muted-foreground">Product</p>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
