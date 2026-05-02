/** HTML month input and API format. */
export const PLAN_MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/

export function currentPlanMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function addPlanMonths(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function monthStartDate(ym: string): Date {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1, 0, 0, 0, 0)
}

export function monthEndDate(ym: string): Date {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m, 0, 23, 59, 59, 999)
}

export function formatPlanMonthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  if (!y || !m) return ym
  return new Date(y, m - 1, 1).toLocaleString(undefined, { month: 'short', year: 'numeric' })
}
