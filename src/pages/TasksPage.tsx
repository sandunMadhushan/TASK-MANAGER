import { motion } from 'framer-motion'
import { Archive, ArrowUpDown, Pencil, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { CreateTaskModal } from '@/components/tasks/CreateTaskModal'
import { TaskListView } from '@/components/tasks/TaskListView'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTaskStore } from '@/store/task-store'
import type { TaskStatus } from '@/types/task'
import { useSettingsStore } from '@/store/settings-store'
import { useAuthStore } from '@/store/auth-store'

export function TasksPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [createSession, setCreateSession] = useState(0)
  const [searchParams, setSearchParams] = useSearchParams()
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all')
  const sortBy = useSettingsStore((s) => s.defaultTaskSort)
  const setDefaultTaskSort = useSettingsStore((s) => s.setDefaultTaskSort)
  const tasks = useTaskStore((s) => s.tasks)
  const users = useTaskStore((s) => s.users)
  const projects = useTaskStore((s) => s.projects)
  const activeProjectId = useTaskStore((s) => s.activeProjectId)
  const setActiveProjectId = useTaskStore((s) => s.setActiveProjectId)
  const addProject = useTaskStore((s) => s.addProject)
  const editProject = useTaskStore((s) => s.editProject)
  const currentUser = useAuthStore((s) => s.currentUser)
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [showArchivedProjects, setShowArchivedProjects] = useState(false)
  const [projectEditDialogOpen, setProjectEditDialogOpen] = useState(false)
  const [projectEditingId, setProjectEditingId] = useState<string | null>(null)
  const [projectEditingName, setProjectEditingName] = useState('')
  const assigneeFilter = searchParams.get('assignee') ?? 'all'
  const searchText = searchParams.get('q') ?? ''
  const assigneeLabel =
    assigneeFilter === 'all'
      ? 'All'
      : (users.find((user) => user.id === assigneeFilter)?.name ?? 'All')
  const statusLabel: Record<'all' | TaskStatus, string> = {
    all: 'All',
    todo: 'To do',
    'in-progress': 'In progress',
    done: 'Done',
  }
  const sortLabel: Record<'due-asc' | 'due-desc' | 'newest' | 'oldest' | 'title', string> = {
    'due-asc': 'Due soonest',
    'due-desc': 'Due latest',
    newest: 'Newest',
    oldest: 'Oldest',
    title: 'Title A-Z',
  }
  const projectLabel =
    activeProjectId === null
      ? 'All projects'
      : (projects.find((project) => project.id === activeProjectId)?.name ?? 'All projects')
  const workspaceNameById = useMemo(() => {
    const ids = currentUser?.workspaceIds ?? []
    const names = currentUser?.workspaceNames ?? []
    const map = new Map<string, string>()
    ids.forEach((id, index) => {
      map.set(String(id), names[index] || String(id))
    })
    return map
  }, [currentUser?.workspaceIds, currentUser?.workspaceNames])
  const groupedProjects = useMemo(() => {
    const map = new Map<string, { label: string; items: typeof projects }>()
    for (const project of projects) {
      const key = String(project.workspaceId)
      const bucket = map.get(key) ?? {
        label: workspaceNameById.get(key) ?? key,
        items: [],
      }
      bucket.items.push(project)
      map.set(key, bucket)
    }
    return Array.from(map.entries())
      .map(([workspaceId, entry]) => ({
        workspaceId,
        label: entry.label,
        items: [...entry.items].sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [projects, workspaceNameById])
  const groupedProjectsForFilter = useMemo(() => {
    return groupedProjects
      .map((group) => ({
        ...group,
        items: group.items.filter((project) => showArchivedProjects || project.status === 'active'),
      }))
      .filter((group) => group.items.length > 0)
  }, [groupedProjects, showArchivedProjects])

  function openCreateModal() {
    setCreateSession((s) => s + 1)
    setCreateOpen(true)
  }

  async function handleCreateProject() {
    const name = projectName.trim()
    if (!name) return
    const ok = await addProject({ name })
    if (!ok) return
    setProjectDialogOpen(false)
    setProjectName('')
  }

  function openEditProject(projectId: string, name: string) {
    setProjectEditingId(projectId)
    setProjectEditingName(name)
    setProjectEditDialogOpen(true)
  }

  async function handleSaveProjectName() {
    const projectId = projectEditingId
    const name = projectEditingName.trim()
    if (!projectId || !name) return
    const ok = await editProject(projectId, { name })
    if (!ok) return
    setProjectEditDialogOpen(false)
    setProjectEditingId(null)
    setProjectEditingName('')
  }

  async function handleArchiveProject(projectId: string) {
    const ok = await editProject(projectId, { status: 'archived' })
    if (!ok) return
    if (activeProjectId === projectId) {
      setActiveProjectId(null)
    }
  }

  function updateAssigneeFilter(value: string | null) {
    if (!value) return
    if (value === 'all') {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.delete('assignee')
        return next
      })
      return
    }

    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('assignee', value)
      return next
    })
  }

  function updateSearchQuery(value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value.trim()) {
        next.set('q', value)
      } else {
        next.delete('q')
      }
      return next
    })
  }

  const filteredTasks = useMemo(() => {
    const loweredSearch = searchText.trim().toLowerCase()
    const byFilters = tasks.filter((task) => {
      if (statusFilter !== 'all' && task.status !== statusFilter) return false
      if (assigneeFilter !== 'all' && !(task.assignedToIds ?? []).includes(assigneeFilter)) {
        return false
      }
      if (!loweredSearch) return true

      const assigneeNames = (task.assignees ?? []).map((u) => u.name.toLowerCase()).join(' ')
      const haystack = `${task.title} ${task.description} ${assigneeNames}`.toLowerCase()
      return haystack.includes(loweredSearch)
    })

    return [...byFilters].sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title)
      if (sortBy === 'newest') return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      if (sortBy === 'oldest') return new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
      const dateA = new Date(a.dueDate).getTime()
      const dateB = new Date(b.dueDate).getTime()
      if (sortBy === 'due-desc') return dateB - dateA
      return dateA - dateB
    })
  }, [assigneeFilter, searchText, sortBy, statusFilter, tasks])

  const hasFilters = Boolean(searchText.trim()) || statusFilter !== 'all' || assigneeFilter !== 'all'

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <CreateTaskModal key={createSession} open={createOpen} onOpenChange={setCreateOpen} />
      <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create project</DialogTitle>
            <DialogDescription>Create a project to organize tasks.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="Project name"
              maxLength={80}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setProjectDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={() => void handleCreateProject()}>
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={projectEditDialogOpen}
        onOpenChange={(open) => {
          setProjectEditDialogOpen(open)
          if (!open) {
            setProjectEditingId(null)
            setProjectEditingName('')
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename project</DialogTitle>
            <DialogDescription>Update project name.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={projectEditingName}
              onChange={(event) => setProjectEditingName(event.target.value)}
              placeholder="Project name"
              maxLength={80}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setProjectEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={() => void handleSaveProjectName()}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.3 }}
      >
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Tasks
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage all tasks with status updates, assignees, and due dates.
          </p>
        </div>
        <div className="inline-flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => setProjectDialogOpen(true)}>
            New project
          </Button>
          <Button className="shadow-lg shadow-primary/25" type="button" onClick={openCreateModal}>
            <Plus className="size-4" />
            New task
          </Button>
        </div>
      </motion.div>

      <section className="rounded-2xl border border-white/10 bg-white/4 p-3 backdrop-blur-md sm:p-4">
        <div className="grid gap-3 md:grid-cols-5">
          <label className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchText}
              onChange={(event) => updateSearchQuery(event.target.value)}
              placeholder="Search by title, description, assignee..."
              className="pl-9"
              aria-label="Search tasks"
            />
          </label>

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3">
            <span className="text-xs text-muted-foreground">Status</span>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as 'all' | TaskStatus)}
            >
              <SelectTrigger
                className="h-9 w-full border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                aria-label="Filter by status"
              >
                <SelectValue>{statusLabel[statusFilter]}</SelectValue>
              </SelectTrigger>
              <SelectContent side="bottom" sideOffset={8} align="start" alignItemWithTrigger={false}>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="todo">To do</SelectItem>
                <SelectItem value="in-progress">In progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3">
            <span className="text-xs text-muted-foreground">Project</span>
            <Select
              value={activeProjectId ?? '__all__'}
              onValueChange={(value) => setActiveProjectId(value === '__all__' ? null : value)}
            >
              <SelectTrigger
                className="h-9 w-full border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                aria-label="Filter by project"
              >
                <SelectValue>{projectLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent side="bottom" sideOffset={8} align="start" alignItemWithTrigger={false}>
                <SelectItem value="__all__">All projects</SelectItem>
                {groupedProjectsForFilter.map((group) => (
                  <div key={`project-group-${group.workspaceId}`}>
                    <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {group.label}
                    </p>
                    {group.items.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3">
            <span className="text-xs text-muted-foreground">Assignee</span>
            <Select value={assigneeFilter} onValueChange={updateAssigneeFilter}>
              <SelectTrigger
                className="h-9 w-full border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                aria-label="Filter by assignee"
              >
                <SelectValue>{assigneeLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent side="bottom" sideOffset={8} align="start" alignItemWithTrigger={false}>
                <SelectItem value="all">All</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-2 flex justify-end">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setShowArchivedProjects((v) => !v)}
          >
            {showArchivedProjects ? 'Hide archived projects' : 'Show archived projects'}
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
          <p className="text-xs text-muted-foreground">
            Showing {filteredTasks.length} of {tasks.length} task(s)
          </p>
          <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-muted-foreground">
            <ArrowUpDown className="size-3.5" />
            <span>Sort</span>
            <Select
              value={sortBy}
              onValueChange={(value) =>
                setDefaultTaskSort(value as 'due-asc' | 'due-desc' | 'newest' | 'oldest' | 'title')
              }
            >
              <SelectTrigger
                className="h-auto border-0 bg-transparent px-0 py-0 text-xs shadow-none focus-visible:ring-0"
                aria-label="Sort tasks"
              >
                <SelectValue>{sortLabel[sortBy]}</SelectValue>
              </SelectTrigger>
              <SelectContent side="bottom" sideOffset={8} align="start" alignItemWithTrigger={false}>
                <SelectItem value="due-asc">Due soonest</SelectItem>
                <SelectItem value="due-desc">Due latest</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="title">Title A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/4 p-3 backdrop-blur-md sm:p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold tracking-tight">Projects</h2>
          <p className="text-xs text-muted-foreground">
            {projects.filter((p) => p.status === 'active').length} active / {projects.length} total
          </p>
        </div>
        <div className="space-y-3">
          {groupedProjects.map((group) => {
            const canManage = currentUser?.id === group.workspaceId
            return (
              <div key={`project-manage-${group.workspaceId}`} className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.label}
                </p>
                <div className="space-y-2">
                  {group.items.map((project) => (
                    <div
                      key={`project-row-${project.id}`}
                      className="flex items-center justify-between rounded-md border border-white/10 bg-black/20 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{project.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {project.status === 'archived' ? 'Archived' : 'Active'}
                        </p>
                      </div>
                      {canManage ? (
                        <div className="inline-flex items-center gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="size-7"
                            onClick={() => openEditProject(project.id, project.name)}
                            aria-label={`Rename ${project.name}`}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          {project.status !== 'archived' ? (
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="size-7"
                              onClick={() => void handleArchiveProject(project.id)}
                              aria-label={`Archive ${project.name}`}
                            >
                              <Archive className="size-3.5" />
                            </Button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <TaskListView
        onCreateClick={openCreateModal}
        tasks={filteredTasks}
        emptyTitle={hasFilters ? 'No tasks match your filters' : 'No tasks yet'}
        emptyDescription={
          hasFilters
            ? 'Try changing search/filter options or clear the selected assignee.'
            : 'Create your first task to see it appear here with motion.'
        }
      />
    </div>
  )
}

