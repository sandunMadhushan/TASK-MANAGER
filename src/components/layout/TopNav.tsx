import { motion } from 'framer-motion'
import { Menu, Search } from 'lucide-react'
import { useMemo } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { NovuInboxBell } from '@/components/notifications/NovuInboxBell'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth-store'

type TopNavProps = {
  onMenuClick: () => void
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const currentUser = useAuthStore((s) => s.currentUser)
  const logout = useAuthStore((s) => s.logout)
  const [searchParams, setSearchParams] = useSearchParams()
  const fallbackName = (currentUser?.name ?? 'User').slice(0, 2).toUpperCase()

  const location = useLocation()
  const navigate = useNavigate()
  const searchText = useMemo(() => searchParams.get('q') ?? '', [searchParams])

  function updateSearchQuery(value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value.trim()) {
        next.set('q', value)
      } else {
        next.delete('q')
      }
      return next
    })
  }

  return (
    <motion.header
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-30 border-b border-white/10 bg-background/55 px-3 py-3 backdrop-blur-xl md:px-6"
      initial={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-2 sm:gap-3">
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
            value={searchText}
            onChange={(event) => updateSearchQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return
              if (location.pathname !== '/tasks') {
                navigate(
                  `/tasks${searchText.trim() ? `?q=${encodeURIComponent(searchText.trim())}` : ''}`
                )
              }
            }}
          />
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <NovuInboxBell />

          <div className="hidden h-8 w-px bg-white/10 sm:block" />

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 py-1 pl-1 pr-2 backdrop-blur-md">
            <Button
              type="button"
              variant="ghost"
              className="h-auto cursor-pointer rounded-lg px-1.5 py-1"
              onClick={() => navigate('/profile')}
            >
              <Avatar className="size-8 ring-2 ring-primary/30">
                <AvatarImage
                  alt={currentUser?.name ?? 'User avatar'}
                  src={currentUser?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nexus'}
                />
                <AvatarFallback className="text-xs">{fallbackName}</AvatarFallback>
              </Avatar>
              <div className="hidden leading-tight md:block">
                <p className="text-xs font-medium text-foreground">{currentUser?.name ?? 'User'}</p>
                <p className="text-[11px] text-muted-foreground">{currentUser?.email ?? ''}</p>
              </div>
            </Button>
            <Button size="sm" variant="ghost" type="button" className="cursor-pointer" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
