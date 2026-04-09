import { Inbox } from '@novu/react'
import { Bell } from 'lucide-react'
import { useMemo } from 'react'

import { Button } from '@/components/ui/button'
import { useTaskStore } from '@/store/task-store'

const APP_ID = import.meta.env.VITE_NOVU_APPLICATION_IDENTIFIER as string | undefined
const BACKEND_URL =
  (import.meta.env.VITE_NOVU_BACKEND_URL as string | undefined) ?? 'http://localhost:5000'
const RAW_SOCKET_URL =
  (import.meta.env.VITE_NOVU_SOCKET_URL as string | undefined) ?? 'ws://localhost:3002'
const SOCKET_URL = normalizeSocketUrl(RAW_SOCKET_URL)

export function NovuInboxBell() {
  const users = useTaskStore((s) => s.users)

  const subscriber = useMemo(() => {
    if (users.length === 0) return null
    const preferred =
      users.find((user) => user.email.toLowerCase() === 'alex@company.com') ??
      users.find((user) => user.name.toLowerCase() === 'alex morgan')
    return (preferred ?? users[0]).id
  }, [users])

  const configured = Boolean(APP_ID && subscriber)

  if (!configured) {
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
      applicationIdentifier={APP_ID!}
      subscriber={subscriber!}
      backendUrl={BACKEND_URL}
      socketUrl={SOCKET_URL}
      socketOptions={{ socketType: 'self-hosted' }}
      placement="bottom-end"
      placementOffset={10}
      appearance={{
        variables: {
          colorPrimary: '#A78BFA',
          colorForeground: '#E5E7EB',
          colorBackground: '#0B0F19',
        },
      }}
      renderBell={(unreadCount) => (
        <Button
          aria-label="Open notifications"
          className="relative hidden sm:inline-flex"
          size="icon-sm"
          variant="ghost"
          type="button"
        >
          <Bell className="size-[18px]" />
          {hasUnread(unreadCount) ? (
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary shadow-[0_0_12px_rgba(167,139,250,0.9)]" />
          ) : null}
        </Button>
      )}
    />
  )
}

function hasUnread(value: unknown): boolean {
  if (typeof value === 'number') return value > 0
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    const count = record.count
    if (typeof count === 'number') return count > 0
  }
  return false
}

function normalizeSocketUrl(value: string): string {
  if (value.startsWith('ws://')) return value.replace('ws://', 'http://')
  if (value.startsWith('wss://')) return value.replace('wss://', 'https://')
  return value
}
