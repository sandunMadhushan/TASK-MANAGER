import { motion } from 'framer-motion'
import { BellRing, Loader2, RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  acceptTeamInviteApi,
  declineTeamInviteApi,
  fetchNotificationFeedApi,
  fetchTeamInvitesApi,
  fetchUnreadNotificationCountApi,
  markAllNotificationsReadApi,
  type NotificationFeedItem,
  type TeamInviteItem,
} from '@/services/task-api'
import { useAuthStore } from '@/store/auth-store'
import { useTaskStore } from '@/store/task-store'

export function NotificationsPage() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const [, setSearchParams] = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [isMarking, setIsMarking] = useState(false)
  const [inviteActionId, setInviteActionId] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<NotificationFeedItem[]>([])
  const [teamInvites, setTeamInvites] = useState<TeamInviteItem[]>([])
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [selectedInvite, setSelectedInvite] = useState<TeamInviteItem | null>(null)
  const fetchUsers = useTaskStore((s) => s.fetchUsers)
  const fetchTasks = useTaskStore((s) => s.fetchTasks)

  const subscriberId = useMemo(() => currentUser?.id ?? null, [currentUser])

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
      const invites = await fetchTeamInvitesApi()
      setTeamInvites(invites)

      const pendingId =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('teamInvite')
          : null
      if (pendingId) {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev)
            next.delete('teamInvite')
            return next
          },
          { replace: true }
        )
        const inv = invites.find((i) => i.id === pendingId)
        if (inv) {
          setSelectedInvite(inv)
          setInviteDialogOpen(true)
        } else {
          toast.info('Invite unavailable', {
            description: 'It may have been cancelled or already accepted or declined.',
          })
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load notifications.'
      toast.error('Failed to load notifications', { description: message })
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
      toast.success('Marked all notifications as read')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to mark all as read.'
      toast.error('Failed to update notifications', { description: message })
    } finally {
      setIsMarking(false)
    }
  }

  async function acceptInvite(inviteId: string) {
    setInviteActionId(inviteId)
    try {
      await acceptTeamInviteApi(inviteId)
      await useAuthStore.getState().bootstrap()
      await Promise.all([loadData(), fetchUsers(), fetchTasks()])
      setInviteDialogOpen(false)
      setSelectedInvite(null)
      toast.success('Invite accepted', {
        description: 'You are now a member of that team workspace.',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to accept invite.'
      toast.error('Failed to accept invite', { description: message })
    } finally {
      setInviteActionId(null)
    }
  }

  async function declineInvite(inviteId: string) {
    setInviteActionId(inviteId)
    try {
      await declineTeamInviteApi(inviteId)
      await loadData()
      setInviteDialogOpen(false)
      setSelectedInvite(null)
      toast.success('Invite declined')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to decline invite.'
      toast.error('Failed to decline invite', { description: message })
    } finally {
      setInviteActionId(null)
    }
  }

  function openInviteDialogFromNotification(item: NotificationFeedItem) {
    const payload = (item.payload ?? {}) as Record<string, unknown>
    if (payload.type !== 'team-invite' || !payload.actionRequired) return
    const inviteId = typeof payload.inviteId === 'string' ? payload.inviteId : ''
    if (!inviteId) return
    const invite = teamInvites.find((x) => x.id === inviteId)
    if (!invite) {
      toast.info('Invite already handled or expired')
      return
    }
    setSelectedInvite(invite)
    setInviteDialogOpen(true)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Team invite</DialogTitle>
            <DialogDescription>
              {selectedInvite
                ? `${selectedInvite.inviterName} invited you to join their team.`
                : 'Review this invite and choose an action.'}
            </DialogDescription>
          </DialogHeader>
          {selectedInvite ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Invite sent to <span className="font-medium text-foreground">{selectedInvite.targetEmail}</span>
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={inviteActionId === selectedInvite.id}
                  onClick={() => void declineInvite(selectedInvite.id)}
                >
                  Decline
                </Button>
                <Button
                  type="button"
                  disabled={inviteActionId === selectedInvite.id}
                  onClick={() => void acceptInvite(selectedInvite.id)}
                >
                  {inviteActionId === selectedInvite.id ? <Loader2 className="size-4 animate-spin" /> : null}
                  Accept
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

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
          {teamInvites.length > 0 ? (
            <div className="mb-4 space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Team invites</p>
              {teamInvites.map((invite) => {
                const isActing = inviteActionId === invite.id
                return (
                  <article key={invite.id} className="rounded-xl border border-emerald-400/35 bg-emerald-500/10 p-3">
                    <p className="text-sm font-medium text-foreground">
                      {invite.inviterName} invited you to join their team
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Invite sent to {invite.targetEmail} by {invite.inviterEmail}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <Button
                        size="sm"
                        type="button"
                        onClick={() => void acceptInvite(invite.id)}
                        disabled={isActing}
                      >
                        {isActing ? <Loader2 className="size-4 animate-spin" /> : null}
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={() => void declineInvite(invite.id)}
                        disabled={isActing}
                      >
                        Decline
                      </Button>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : null}

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
                  className={`rounded-xl border px-3 py-2.5 ${
                    item.isRead
                      ? 'border-white/10 bg-white/5'
                      : 'border-violet-400/35 bg-violet-500/10 shadow-[0_0_0_1px_rgba(167,139,250,0.25)]'
                  } ${
                    (item.payload as Record<string, unknown> | undefined)?.type === 'team-invite'
                      ? 'cursor-pointer hover:border-emerald-300/45'
                      : ''
                  }`}
                  onClick={() => openInviteDialogFromNotification(item)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-2">
                      {!item.isRead ? (
                        <span
                          className="mt-1.5 inline-block size-2 shrink-0 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.9)]"
                          aria-label="Unread notification"
                        />
                      ) : null}
                      <p className="text-sm font-medium text-foreground">
                        {item.subject ?? 'Notification'}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                    </span>
                  </div>
                  {!item.isRead ? (
                    <span className="mt-1 inline-flex rounded-md border border-violet-300/35 bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-medium text-violet-200">
                      Unread
                    </span>
                  ) : null}
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

