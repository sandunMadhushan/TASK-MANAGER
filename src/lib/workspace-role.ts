import type { User } from '@/types/user'

/** Row for the signed-in user in GET /users (includes fresh `workspaceId`). */
export function getSelfTeamRow(currentUser: User | null, teamUsers: User[]): User | undefined {
  if (!currentUser) return undefined
  return teamUsers.find((u) => u.id === currentUser.id)
}

/**
 * Owner = their user id equals workspace root id (stored as `workspaceId` on their row).
 * Prefer the team list row when present so we stay correct after invites without a stale auth user.
 */
export function isWorkspaceOwnerUser(currentUser: User | null, teamUsers: User[]): boolean {
  if (!currentUser) return false
  const selfRow = getSelfTeamRow(currentUser, teamUsers)
  if (selfRow?.workspaceId) {
    return String(currentUser.id) === String(selfRow.workspaceId)
  }
  return Boolean(
    currentUser.workspaceId && String(currentUser.id) === String(currentUser.workspaceId)
  )
}

/** Workspace root id (owner's user id) for the current membership. */
export function getWorkspaceRootId(currentUser: User | null, teamUsers: User[]): string {
  if (!currentUser) return ''
  const selfRow = getSelfTeamRow(currentUser, teamUsers)
  if (selfRow?.workspaceId) return String(selfRow.workspaceId)
  if (currentUser.workspaceId) return String(currentUser.workspaceId)
  return ''
}

/**
 * Only true when we have a team row and it says this user is the root owner.
 * Use this before calling owner-only APIs (e.g. pending invites) to avoid 403 noise when auth user is stale.
 */
export function isWorkspaceOwnerConfirmedFromTeam(
  currentUser: User | null,
  teamUsers: User[]
): boolean {
  if (!currentUser) return false
  const selfRow = getSelfTeamRow(currentUser, teamUsers)
  if (!selfRow?.workspaceId) return false
  return String(currentUser.id) === String(selfRow.workspaceId)
}
