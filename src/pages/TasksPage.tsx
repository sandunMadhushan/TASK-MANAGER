import { motion } from 'framer-motion'
import { ArrowUpDown, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { CreateTaskModal } from '@/components/tasks/CreateTaskModal'
import { TaskListView } from '@/components/tasks/TaskListView'
import { Button } from '@/components/ui/button'
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
  const currentUser = useAuthStore((s) => s.currentUser)
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

  function openCreateModal() {
    setCreateSession((s) => s + 1)
    setCreateOpen(true)
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
            Manage tasks with status, assignees, and due dates. Create or move projects on the{' '}
            <Link to="/projects" className="font-medium text-primary underline-offset-4 hover:underline">
              Projects
            </Link>{' '}
            page.
          </p>
        </div>
        <Button className="shadow-lg shadow-primary/25" type="button" onClick={openCreateModal}>
          <Plus className="size-4" />
          New task
        </Button>
      </motion.div>

      <section className="rounded-2xl border border-white/10 bg-white/4 p-3 backdrop-blur-md sm:p-4">
        <div className="grid gap-3 md:grid-cols-5">
          <div className="md:col-span-2">
            <label className="relative block h-9">
              <Input
                value={searchText}
                onChange={(event) => updateSearchQuery(event.target.value)}
                placeholder="Search by title, description, assignee..."
                className="h-full pl-10"
                aria-label="Search tasks"
              />
              <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
            </label>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3">
            <span className="text-xs text-muted-foreground">Status</span>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as 'all' | TaskStatus)}
            >
              <SelectTrigger
                className="h-9 w-full border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
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

          <div className="flex flex-col gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">Project</span>
              <Link
                to="/projects"
                className="text-[10px] font-medium text-primary underline-offset-2 hover:underline"
              >
                Manage
              </Link>
            </div>
            <Select
              value={activeProjectId ?? '__all__'}
              onValueChange={(value) => setActiveProjectId(value === '__all__' ? null : value)}
            >
              <SelectTrigger
                className="h-9 w-full border-0 bg-transparent px-1 py-0 shadow-none focus-visible:ring-0"
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
                className="h-9 w-full border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
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
                className="h-auto border-0 bg-transparent px-1 py-0 text-xs shadow-none focus-visible:ring-0"
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
