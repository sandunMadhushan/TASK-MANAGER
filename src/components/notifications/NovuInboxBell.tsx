import { Inbox } from '@novu/react'
import { Bell } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useTaskStore } from '@/store/task-store'

const APP_ID = import.meta.env.VITE_NOVU_APPLICATION_IDENTIFIER as string | undefined
const BACKEND_URL =
  (import.meta.env.VITE_NOVU_BACKEND_URL as string | undefined) ?? 'http://localhost:5000'
const SOCKET_URL =
  (import.meta.env.VITE_NOVU_SOCKET_URL as string | undefined) ?? 'ws://localhost:3002'

export function NovuInboxBell() {
  const [open, setOpen] = useState(false)
  const users = useTaskStore((s) => s.users)

  const subscriber = useMemo(() => {
    if (users.length === 0) return null
    const primary = users[0]
    return {
      subscriberId: primary.id,
      firstName: primary.name.split(' ')[0] ?? primary.name,
      lastName: primary.name.split(' ').slice(1).join(' '),
      email: primary.email,
    }
  }, [users])

  const configured = Boolean(APP_ID && subscriber)

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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton
          className="scrollbar-glass max-h-[min(90vh,760px)] overflow-y-auto border-white/10 bg-popover/95 p-3 shadow-2xl ring-white/10 backdrop-blur-xl sm:max-w-2xl"
        >
          <DialogHeader className="px-2 pt-1">
            <DialogTitle>Notifications</DialogTitle>
          </DialogHeader>

          {!APP_ID ? (
            <p className="px-2 pb-3 text-sm text-muted-foreground">
              Set `VITE_NOVU_APPLICATION_IDENTIFIER` in `.env` to enable Inbox.
            </p>
          ) : !subscriber ? (
            <p className="px-2 pb-3 text-sm text-muted-foreground">
              No users loaded yet. Create/seed users and retry.
            </p>
          ) : (
            <div className="h-[620px] overflow-hidden rounded-xl border border-white/10 bg-black/20">
              <Inbox
                applicationIdentifier={APP_ID}
                subscriber={subscriber}
                backendUrl={BACKEND_URL}
                socketUrl={SOCKET_URL}
                appearance={{
                  variables: {
                    colorPrimary: '#A78BFA',
                    colorForeground: '#E5E7EB',
                    colorBackground: '#0B0F19',
                  },
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
