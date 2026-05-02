export const NOVU_NOTIFICATIONS_UPDATED_EVENT = 'novu:notifications-updated'

const STORAGE_PREFIX = 'novu:inbox-unread:'

type NovuNotificationsUpdatedDetail = {
  subscriberId: string
  unreadCount: number
}

function persistInboxUnread(subscriberId: string, unreadCount: number): void {
  if (typeof window === 'undefined' || !subscriberId) return
  try {
    window.sessionStorage.setItem(STORAGE_PREFIX + subscriberId, String(Math.max(0, unreadCount)))
  } catch {
    /* private mode / quota */
  }
}

/** Last inbox unread synced from `<Inbox />` (same as the header bell). Survives client navigations and refresh. */
export function readCachedNovuInboxUnread(subscriberId: string): number | null {
  if (typeof window === 'undefined' || !subscriberId) return null
  try {
    const raw = window.sessionStorage.getItem(STORAGE_PREFIX + subscriberId)
    if (raw == null || raw === '') return null
    const n = Number.parseInt(raw, 10)
    return Number.isFinite(n) && n >= 0 ? n : null
  } catch {
    return null
  }
}

export function emitNovuNotificationsUpdated(detail: NovuNotificationsUpdatedDetail): void {
  if (typeof window === 'undefined') return
  persistInboxUnread(detail.subscriberId, detail.unreadCount)
  window.dispatchEvent(
    new CustomEvent<NovuNotificationsUpdatedDetail>(NOVU_NOTIFICATIONS_UPDATED_EVENT, { detail })
  )
}

/** Call when server-side actions clear unread so the cache matches before the bell re-renders. */
export function cacheNovuInboxUnread(subscriberId: string, unreadCount: number): void {
  persistInboxUnread(subscriberId, unreadCount)
}

