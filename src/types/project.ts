export type ProjectStatus = 'active' | 'archived'

export type Project = {
  id: string
  name: string
  description?: string
  workspaceId: string
  createdBy: string
  status: ProjectStatus
  /** Planned first month `YYYY-MM` (month picker). */
  planStartMonth?: string
  /** Planned last month `YYYY-MM` (estimated close). */
  planEndMonth?: string
  createdAt?: string
  updatedAt?: string
}
