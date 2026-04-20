export type User = {
  id: string
  name: string
  email: string
  avatarUrl?: string
  /** When equal to `id`, this user is the workspace owner (root). */
  workspaceId?: string
  /** All workspace memberships this user belongs to. */
  workspaceIds?: string[]
  /** Human labels for memberships (owner/team names), supplied by backend list API. */
  workspaceNames?: string[]
}
