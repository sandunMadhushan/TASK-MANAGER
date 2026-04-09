import { motion } from 'framer-motion'
import { BellRing, Loader2, RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  fetchNotificationFeedApi,
  fetchUnreadNotificationCountApi,
  markAllNotificationsReadApi,
  type NotificationFeedItem,
} from '@/services/task-api'
import { useTaskStore } from '@/store/task-store'

export function NotificationsPage() {
  const users = useTaskStore((s) => s.users)
  const [isLoading, setIsLoading] = useState(false)
  const [isMarking, setIsMarking] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<NotificationFeedItem[]>([])

  const subscriberId = useMemo(() => {
    if (users.length === 0) return null
    const preferred =
      users.find((user) => user.email.toLowerCase() === 'alex@company.com') ??
      users.find((user) => user.name.toLowerCase() === 'alex morgan')
    return (preferred ?? users[0]).id
  }, [users])

  async function loadData() {
    if (!subscriberId) return
    setIsLoading(true)
    try {
      const [feed, unread] = await Promise.all([
        fetchNotificationFeedApi(subscriberId, { limit: 12 }),
        fetchUnreadNotificationCountApi(subscriberId),
      ])
      setNotifications(feed)
      setUnreadCount(unread)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [subscriberId])

  async function markAllRead() {
    if (!subscriberId) return
    setIsMarking(true)
    try {
      await markAllNotificationsReadApi(subscriberId)
      await loadData()
    } finally {
      setIsMarking(false)
    }
  }

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
          Inbox summary with quick actions. Use the top-right bell for full live inbox controls.
        </p>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-white/10 bg-white/4 backdrop-blur-md">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Unread</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">{unreadCount}</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/4 backdrop-blur-md md:col-span-2">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm font-medium text-foreground">Notification actions</p>
              <p className="text-xs text-muted-foreground">
                Keep your feed tidy without opening each item.
              </p>
            </div>
            <div className="inline-flex items-center gap-2">
              <Button variant="outline" type="button" onClick={() => void loadData()} disabled={isLoading}>
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                Refresh
              </Button>
              <Button type="button" onClick={() => void markAllRead()} disabled={isMarking || unreadCount === 0}>
                {isMarking ? <Loader2 className="size-4 animate-spin" /> : null}
                Mark all as read
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-white/4 backdrop-blur-md">
        <CardContent className="p-4">
          {isLoading ? (
            <div className="flex min-h-[220px] items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
              <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-linear-to-br from-violet-500/20 to-fuchsia-500/15 ring-1 ring-white/10">
                <BellRing className="size-6 text-muted-foreground" aria-hidden />
              </div>
              <p className="text-sm font-medium text-foreground">No notifications yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                New task events will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{item.subject ?? 'Notification'}</p>
                    <span className="text-[10px] text-muted-foreground">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{item.body ?? ''}</p>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

