export type User = {
  id: string
  name: string
  email: string
  avatarUrl?: string
  /** When equal to `id`, this user is the workspace owner (root). */
  workspaceId?: string
}
