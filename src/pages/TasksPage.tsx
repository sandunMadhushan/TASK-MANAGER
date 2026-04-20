import { motion } from 'framer-motion'
import { ArrowUpDown, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { CreateTaskModal } from '@/components/tasks/CreateTaskModal'
import { TaskListView } from '@/components/tasks/TaskListView'
import { Badge } from '@/components/ui/badge'
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
import type { Project } from '@/types/project'
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
  const deleteProject = useTaskStore((s) => s.deleteProject)
  const currentUser = useAuthStore((s) => s.currentUser)
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectEditDialogOpen, setProjectEditDialogOpen] = useState(false)
  const [projectEditingId, setProjectEditingId] = useState<string | null>(null)
  const [projectEditingName, setProjectEditingName] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleteBlockedOpen, setDeleteBlockedOpen] = useState(false)
  const [deleteBlockedMessage, setDeleteBlockedMessage] = useState('')
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
      const raw = names[index]
      if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
        map.set(String(id), String(raw).trim())
      }
    })
    return map
  }, [currentUser?.workspaceIds, currentUser?.workspaceNames])
  const rosterNameByUserId = useMemo(() => {
    const map = new Map<string, string>()
    for (const u of users) {
      if (u.id && u.name) map.set(String(u.id), u.name)
    }
    return map
  }, [users])
  const groupedProjects = useMemo(() => {
    const map = new Map<string, { label: string; items: typeof projects }>()
    for (const project of projects) {
      const key = String(project.workspaceId)
      const label =
        workspaceNameById.get(key) ?? rosterNameByUserId.get(key) ?? 'Workspace'
      const bucket = map.get(key) ?? {
        label,
        items: [],
      }
      bucket.items.push(project)
      map.set(key, bucket)
    }
    return Array.from(map.entries())
      .map(([workspaceId, entry]) => ({
        workspaceId,
        label: entry.label,
        items: [...entry.items].sort((a, b) => {
          const ar = a.status === 'archived' ? 1 : 0
          const br = b.status === 'archived' ? 1 : 0
          if (ar !== br) return ar - br
          return a.name.localeCompare(b.name)
        }),
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [projects, workspaceNameById, rosterNameByUserId])

  function projectRowLabel(project: Project) {
    return project.status === 'archived' ? `${project.name} · closed` : project.name
  }

  function countOpenTasksInProject(projectId: string) {
    return tasks.filter(
      (t) =>
        t.projectId === projectId &&
        (t.status === 'todo' || t.status === 'in-progress')
    ).length
  }

  function openDeleteProjectDialog(project: Project) {
    const openCount = countOpenTasksInProject(project.id)
    if (openCount > 0) {
      setDeleteBlockedMessage(
        openCount === 1
          ? 'This project still has 1 open task (to do or in progress). Complete or move it before deleting.'
          : `This project still has ${openCount} open tasks (to do or in progress). Complete or move them before deleting.`
      )
      setDeleteBlockedOpen(true)
      return
    }
    setDeleteTarget({ id: project.id, name: project.name })
    setDeleteConfirmOpen(true)
  }

  async function confirmDeleteProject() {
    if (!deleteTarget) return
    const result = await deleteProject(deleteTarget.id)
    setDeleteConfirmOpen(false)
    setDeleteTarget(null)
    if (result.ok) return
    if (result.blocked) {
      setDeleteBlockedMessage(result.message)
      setDeleteBlockedOpen(true)
    }
  }

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

      <Dialog
        open={deleteConfirmOpen}
        onOpenChange={(open) => {
          setDeleteConfirmOpen(open)
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent className="border-white/10 bg-popover/95 backdrop-blur-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete project?</DialogTitle>
            <DialogDescription className="space-y-2 text-left">
              <span className="block">
                <span className="font-medium text-foreground">{deleteTarget?.name}</span> will be
                removed permanently. Any completed tasks in this project are deleted with it.
              </span>
              <span className="block">You cannot delete while tasks are still to do or in progress.</span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false)
                setDeleteTarget(null)
              }}
            >
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={() => void confirmDeleteProject()}>
              Delete project
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteBlockedOpen} onOpenChange={setDeleteBlockedOpen}>
        <DialogContent className="border-amber-500/35 bg-amber-950/20 shadow-lg shadow-amber-900/20 backdrop-blur-xl sm:max-w-md dark:bg-amber-950/30">
          <DialogHeader>
            <DialogTitle className="text-amber-100">Cannot delete yet</DialogTitle>
            <DialogDescription className="text-amber-100/85">{deleteBlockedMessage}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={() => setDeleteBlockedOpen(false)}>
              Understood
            </Button>
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
                {groupedProjects.map((group) => (
                  <div key={`project-group-${group.workspaceId}`}>
                    <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {group.label}
                    </p>
                    {group.items.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {projectRowLabel(project)}
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
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-heading text-lg font-semibold tracking-tight">Projects</h2>
            <p className="mt-0.5 max-w-xl text-xs text-muted-foreground">
              Projects belong to a workspace (team). Only open projects accept new tasks. Delete removes
              the project and completed tasks; open tasks must be finished or moved first.
            </p>
          </div>
          <p className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-muted-foreground">
            {projects.filter((p) => p.status === 'active').length} open for tasks
            <span className="text-white/25"> · </span>
            {projects.length} total
          </p>
        </div>
        <div className="space-y-4">
          {groupedProjects.map((group) => {
            const canManage = currentUser?.id === group.workspaceId
            return (
              <div
                key={`project-manage-${group.workspaceId}`}
                className="overflow-hidden rounded-xl border border-white/10 bg-linear-to-b from-white/[0.07] to-black/20"
              >
                <div className="border-b border-white/10 bg-white/4 px-3 py-2.5 sm:px-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Workspace
                  </p>
                  <p className="truncate text-sm font-medium text-foreground">{group.label}</p>
                </div>
                <ul className="divide-y divide-white/10 p-2 sm:p-3">
                  {group.items.map((project) => {
                    const openTaskCount = countOpenTasksInProject(project.id)
                    return (
                      <li
                        key={`project-row-${project.id}`}
                        className="flex flex-col gap-2 py-2.5 first:pt-1 last:pb-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-medium text-foreground">{project.name}</p>
                            {project.status === 'archived' ? (
                              <Badge variant="outline" className="text-[10px]">
                                Closed
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px]">
                                Open
                              </Badge>
                            )}
                          </div>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {openTaskCount > 0
                              ? `${openTaskCount} open ${openTaskCount === 1 ? 'task' : 'tasks'} (to do or in progress)`
                              : 'No open tasks — safe to delete if you do not need completed history'}
                          </p>
                        </div>
                        {canManage ? (
                          <div className="flex shrink-0 items-center justify-end gap-1 sm:pl-2">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="size-8 text-muted-foreground hover:text-foreground"
                              onClick={() => openEditProject(project.id, project.name)}
                              aria-label={`Rename ${project.name}`}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="size-8 text-muted-foreground hover:text-destructive"
                              onClick={() => openDeleteProjectDialog(project)}
                              aria-label={`Delete ${project.name}`}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
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

