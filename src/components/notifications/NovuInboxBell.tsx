import { NovuProvider, useNotifications } from '@novu/react'
import { Bell, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useTaskStore } from '@/store/task-store'

const APP_ID = import.meta.env.VITE_NOVU_APPLICATION_IDENTIFIER as string | undefined
const BACKEND_URL =
  (import.meta.env.VITE_NOVU_BACKEND_URL as string | undefined) ?? 'http://localhost:5000'
const SOCKET_URL =
  (import.meta.env.VITE_NOVU_SOCKET_URL as string | undefined) ?? 'ws://localhost:3002'

export function NovuInboxBell() {
  const [open, setOpen] = useState(false)
  const [showInboxContent, setShowInboxContent] = useState(false)
  const users = useTaskStore((s) => s.users)

  const subscriber = useMemo(() => {
    if (users.length === 0) return null
    return users[0].id
  }, [users])

  const configured = Boolean(APP_ID && subscriber)

  useEffect(() => {
    if (!open || !configured) {
      setShowInboxContent(false)
      return
    }

    // Delay mounting content slightly for smooth panel open.
    const timer = window.setTimeout(() => setShowInboxContent(true), 120)
    return () => window.clearTimeout(timer)
  }, [open, configured])

  return (
    <>
      <Button
        aria-label="Open notifications"
        className="relative hidden sm:inline-flex"
        size="icon-sm"
        variant="ghost"
        type="button"
        disabled={!configured}
        onClick={() => setOpen(true)}
      >
        <Bell className="size-[18px]" />
        <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary shadow-[0_0_12px_rgba(167,139,250,0.9)]" />
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50">
          <button
            aria-label="Close notifications panel"
            type="button"
            className="absolute inset-0 bg-black/25 backdrop-blur-[1px]"
            onClick={() => setOpen(false)}
          />

          <aside className="absolute right-3 top-20 flex h-[calc(100vh-6rem)] w-[min(460px,calc(100vw-1.5rem))] flex-col rounded-2xl border border-white/10 bg-popover/96 p-3 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between px-1.5">
              <h2 className="text-sm font-semibold">Notifications</h2>
              <Button
                aria-label="Close notifications panel"
                size="icon-sm"
                variant="ghost"
                type="button"
                onClick={() => setOpen(false)}
              >
                ×
              </Button>
            </div>

            {!APP_ID ? (
              <p className="px-2 pb-3 text-sm text-muted-foreground">
                Set `VITE_NOVU_APPLICATION_IDENTIFIER` in `.env` to enable Inbox.
              </p>
            ) : !subscriber ? (
              <p className="px-2 pb-3 text-sm text-muted-foreground">
                No users loaded yet. Create/seed users and retry.
              </p>
            ) : (
              <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-white/10 bg-black/20">
                {showInboxContent ? (
                  <NovuProvider
                    applicationIdentifier={APP_ID}
                    subscriber={subscriber}
                    backendUrl={BACKEND_URL}
                    socketUrl={SOCKET_URL}
                  >
                    <NovuNotificationFeed />
                  </NovuProvider>
                ) : null}

                {!showInboxContent ? (
                  <div className="absolute inset-0 flex flex-col gap-3 p-4">
                    <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Loading notifications...</span>
                    </div>
                    <div className="h-12 animate-pulse rounded-lg border border-white/10 bg-white/5" />
                    <div className="h-20 animate-pulse rounded-lg border border-white/10 bg-white/5" />
                    <div className="h-20 animate-pulse rounded-lg border border-white/10 bg-white/5" />
                  </div>
                ) : null}
              </div>
            )}
          </aside>
        </div>
      ) : null}
    </>
  )
}

function NovuNotificationFeed() {
  const { notifications, isLoading, error } = useNotifications({ limit: 25 })

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        <span>Loading notifications...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
        Unable to load notifications right now.
      </div>
    )
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
        No notifications yet.
      </div>
    )
  }

  return (
    <div className="scrollbar-glass h-full space-y-2 overflow-y-auto p-3">
      {notifications.map((notification) => {
        const title = pickNotificationText(notification, ['subject', 'title']) || 'Notification'
        const body = pickNotificationText(notification, ['body', 'content'])
        const timestamp = getRelativeTime(notification)

        return (
          <article
            key={String(notification.id)}
            className="rounded-lg border border-white/10 bg-white/4 p-3"
          >
            <p className="text-sm font-medium text-foreground">{title}</p>
            {body ? (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
            ) : null}
            {timestamp ? <p className="mt-2 text-[11px] text-muted-foreground">{timestamp}</p> : null}
          </article>
        )
      })}
    </div>
  )
}

function pickNotificationText(
  notification: unknown,
  keys: string[]
): string | null {
  if (!notification || typeof notification !== 'object') return null
  const record = notification as Record<string, unknown>

  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

function getRelativeTime(notification: unknown): string | null {
  if (!notification || typeof notification !== 'object') return null
  const record = notification as Record<string, unknown>
  const raw =
    (typeof record.createdAt === 'string' && record.createdAt) ||
    (typeof record.created_at === 'string' && record.created_at) ||
    (typeof record.updatedAt === 'string' && record.updatedAt)

  if (!raw) return null
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return null

  const diffMs = Date.now() - date.getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  if (diffMs < minute) return 'Just now'
  if (diffMs < hour) return `${Math.max(1, Math.floor(diffMs / minute))}m ago`
  return `${Math.max(1, Math.floor(diffMs / hour))}h ago`
}
