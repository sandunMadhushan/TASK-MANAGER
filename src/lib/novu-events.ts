export const NOVU_NOTIFICATIONS_UPDATED_EVENT = 'novu:notifications-updated'

type NovuNotificationsUpdatedDetail = {
  subscriberId: string
  unreadCount: number
}

export function emitNovuNotificationsUpdated(detail: NovuNotificationsUpdatedDetail): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<NovuNotificationsUpdatedDetail>(NOVU_NOTIFICATIONS_UPDATED_EVENT, { detail })
  )
}

