import type { User } from '@/types/user'

/** True if `user` is a member of the workspace rooted at `workspaceRootId` (ObjectId string). */
export function userBelongsToWorkspace(user: User, workspaceRootId: string): boolean {
  const ws = String(workspaceRootId).trim()
  if (!ws) return false
  if (String(user.workspaceId ?? '') === ws) return true
  return (user.workspaceIds ?? []).some((id) => String(id) === ws)
}

export function filterUsersInWorkspace(users: User[], workspaceRootId: string | undefined): User[] {
  const ws = String(workspaceRootId ?? '').trim()
  if (!ws) return []
  return users.filter((u) => userBelongsToWorkspace(u, ws))
}
