/** Format `YYYY-MM-DD` for display in the current locale. */
export function formatDueDateLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  if (!y || !m || !d) return isoDate
  const date = new Date(y, m - 1, d)
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

/** Today as `YYYY-MM-DD` in local time. */
export function todayIsoDate(): string {
  const n = new Date()
  const y = n.getFullYear()
  const m = String(n.getMonth() + 1).padStart(2, '0')
  const d = String(n.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function isDueWithinDays(isoDate: string, days: number): boolean {
  const target = parseLocalDate(isoDate)
  if (Number.isNaN(target.getTime())) return false
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const end = new Date(now)
  end.setDate(end.getDate() + days)
  return target >= now && target <= end
}

function parseLocalDate(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y, m - 1, d)
}
