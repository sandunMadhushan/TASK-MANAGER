export type ProjectStatus = 'active' | 'archived'

export type Project = {
  id: string
  name: string
  description?: string
  workspaceId: string
  createdBy: string
  status: ProjectStatus
  createdAt?: string
  updatedAt?: string
}
