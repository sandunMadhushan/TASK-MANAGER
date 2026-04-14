import { Inbox } from '@novu/react'
import { Bell } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { emitNovuNotificationsUpdated } from '@/lib/novu-events'
import { fetchNovuSubscriberAuthApi } from '@/services/task-api'
import { useAuthStore } from '@/store/auth-store'

const APP_ID = import.meta.env.VITE_NOVU_APPLICATION_IDENTIFIER as string | undefined
const BACKEND_URL =
  (import.meta.env.VITE_NOVU_BACKEND_URL as string | undefined) ?? 'http://localhost:5000'
const RAW_SOCKET_URL =
  (import.meta.env.VITE_NOVU_SOCKET_URL as string | undefined) ?? 'ws://localhost:3002'
const SOCKET_URL = normalizeSocketUrl(RAW_SOCKET_URL)

type SubscriberConfig = {
  subscriberId: string
  subscriberHash?: string
}

export function NovuInboxBell() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.currentUser)
  const [subscriberConfig, setSubscriberConfig] = useState<SubscriberConfig | null>(null)
  const [hasAuthError, setHasAuthError] = useState(false)
  const currentUserId = useMemo(() => currentUser?.id ?? null, [currentUser])
  const lastUnreadRef = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadSubscriberAuth() {
      if (!currentUserId) {
        setSubscriberConfig(null)
        setHasAuthError(false)
        return
      }

      try {
        const auth = await fetchNovuSubscriberAuthApi(currentUserId)
        if (cancelled) return
        setHasAuthError(false)
        setSubscriberConfig(
          auth.subscriberHash
            ? { subscriberId: auth.subscriberId, subscriberHash: auth.subscriberHash }
            : { subscriberId: auth.subscriberId }
        )
      } catch {
        if (cancelled) return
        setHasAuthError(true)
        setSubscriberConfig(null)
      }
    }

    void loadSubscriberAuth()

    return () => {
      cancelled = true
    }
  }, [currentUserId])

  const configured = Boolean(APP_ID && subscriberConfig)
  const inboxSessionKey = useMemo(() => {
    if (!subscriberConfig) return 'novu-inbox-anon'
    return `novu-inbox-${subscriberConfig.subscriberId}-${subscriberConfig.subscriberHash ?? 'nohash'}`
  }, [subscriberConfig])

  function syncUnreadBroadcast(unreadCount: number) {
    if (!subscriberConfig?.subscriberId) return
    if (lastUnreadRef.current === unreadCount) return
    lastUnreadRef.current = unreadCount
    emitNovuNotificationsUpdated({
      subscriberId: subscriberConfig.subscriberId,
      unreadCount,
    })
  }

  if (!configured || hasAuthError) {
    return (
      <Button
        aria-label="Open notifications"
        className="relative hidden sm:inline-flex"
        size="icon-sm"
        variant="ghost"
        type="button"
        disabled
      >
        <Bell className="size-[18px]" />
      </Button>
    )
  }

  return (
    <Inbox
      key={inboxSessionKey}
      applicationIdentifier={APP_ID!}
      subscriber={subscriberConfig!.subscriberId}
      subscriberHash={subscriberConfig?.subscriberHash}
      backendUrl={BACKEND_URL}
      socketUrl={SOCKET_URL}
      socketOptions={{ socketType: 'self-hosted' }}
      placement="bottom-end"
      placementOffset={10}
      routerPush={(url) => {
        navigate(url)
      }}
      onNotificationClick={(notification) => {
        const inviteId = extractTeamInviteIdFromNovuNotification(notification)
        if (inviteId) {
          navigate(`/notifications?teamInvite=${encodeURIComponent(inviteId)}`)
        }
      }}
      appearance={{
        variables: {
          colorPrimary: '#A78BFA',
          colorForeground: '#E5E7EB',
          colorBackground: '#0B0F19',
        },
      }}
      renderBell={(unreadCount) => (
        (() => {
          const effectiveUnread = getUnreadCount(unreadCount)
          syncUnreadBroadcast(effectiveUnread)

          return (
            <Button
              aria-label="Open notifications"
              className="relative hidden sm:inline-flex"
              size="icon-sm"
              variant="ghost"
              type="button"
            >
              <Bell
                className={`size-[18px] transition-colors ${
                  effectiveUnread > 0 ? 'text-violet-300' : ''
                }`}
              />
              {effectiveUnread > 0 ? (
                <>
                  <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary shadow-[0_0_12px_rgba(167,139,250,0.9)]" />
                  <span className="absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-violet-500 px-1 text-[10px] font-semibold leading-4 text-white">
                    {formatUnreadCount(effectiveUnread)}
                  </span>
                </>
              ) : null}
            </Button>
          )
        })()
      )}
    />
  )
}

function getUnreadCount(value: unknown): number {
  if (typeof value === 'number') return Math.max(0, value)
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (typeof record.total === 'number') return Math.max(0, record.total)
    if (typeof record.count === 'number') return Math.max(0, record.count)
  }
  return 0
}

function formatUnreadCount(value: number): string {
  if (value > 99) return '99+'
  return String(value)
}

function normalizeSocketUrl(value: string): string {
  if (value.startsWith('ws://')) return value.replace('ws://', 'http://')
  if (value.startsWith('wss://')) return value.replace('wss://', 'https://')
  return value
}

/** Novu inbox passes `data` (sometimes stringified) for workflow payload. */
function parseNovuDataField(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {
      return null
    }
    return null
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>
  }
  return null
}

function extractTeamInviteIdFromNovuNotification(notification: unknown): string | null {
  if (!notification || typeof notification !== 'object') return null
  const n = notification as Record<string, unknown>
  const data = parseNovuDataField(n.data) ?? parseNovuDataField(n.payload)
  if (!data) return null

  const nested = data.payload
  const payload =
    nested && typeof nested === 'object' && !Array.isArray(nested)
      ? (nested as Record<string, unknown>)
      : data

  if (payload.type !== 'team-invite') return null
  const required = payload.actionRequired
  if (required === false || required === 'false') return null

  const inviteId = payload.inviteId
  return typeof inviteId === 'string' && inviteId.length > 0 ? inviteId : null
}
