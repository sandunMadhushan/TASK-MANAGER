import { motion } from 'framer-motion'
import { FolderKanban, Pencil, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { fetchTasksApi } from '@/services/task-api'
import { useAuthStore } from '@/store/auth-store'
import { useTaskStore } from '@/store/task-store'
import type { Project } from '@/types/project'
import type { Task } from '@/types/task'

export function ProjectsPage() {
  const projects = useTaskStore((s) => s.projects)
  const addProject = useTaskStore((s) => s.addProject)
  const editProject = useTaskStore((s) => s.editProject)
  const deleteProject = useTaskStore((s) => s.deleteProject)
  const fetchProjects = useTaskStore((s) => s.fetchProjects)
  const currentUser = useAuthStore((s) => s.currentUser)
  const users = useTaskStore((s) => s.users)

  const [catalogTasks, setCatalogTasks] = useState<Task[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [createWorkspaceId, setCreateWorkspaceId] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [editName, setEditName] = useState('')
  const [editWorkspaceId, setEditWorkspaceId] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleteBlockedOpen, setDeleteBlockedOpen] = useState(false)
  const [deleteBlockedMessage, setDeleteBlockedMessage] = useState('')

  const defaultWorkspaceId = String(currentUser?.workspaceId ?? currentUser?.id ?? '')

  const workspaceOptions = useMemo(() => {
    const ids = currentUser?.workspaceIds ?? []
    const names = currentUser?.workspaceNames ?? []
    const roster = new Map<string, string>()
    for (const u of users) {
      if (u.id && u.name) roster.set(String(u.id), u.name)
    }
    return ids.map((id, index) => {
      const sid = String(id)
      const raw = names[index]
      const normalized = raw !== undefined && raw !== null ? String(raw).trim() : ''
      const hasRealName = normalized !== '' && normalized !== sid
      const label =
        hasRealName
          ? normalized
          : (roster.get(sid) ?? 'Workspace')
      return { id: sid, label }
    })
  }, [currentUser?.workspaceIds, currentUser?.workspaceNames, users])

  const refreshCatalog = useCallback(() => {
    void fetchTasksApi({ projectScope: 'all' })
      .then(setCatalogTasks)
      .catch(() => setCatalogTasks([]))
  }, [])

  useEffect(() => {
    void fetchProjects()
  }, [fetchProjects])

  useEffect(() => {
    refreshCatalog()
  }, [refreshCatalog])

  useEffect(() => {
    if (!createOpen) return
    if (workspaceOptions.length === 0) return
    if (!createWorkspaceId || !workspaceOptions.some((o) => o.id === createWorkspaceId)) {
      const preferred =
        workspaceOptions.find((o) => o.id === defaultWorkspaceId)?.id ?? workspaceOptions[0].id
      setCreateWorkspaceId(preferred)
    }
  }, [createOpen, createWorkspaceId, defaultWorkspaceId, workspaceOptions])

  function taskCountForProject(projectId: string) {
    return catalogTasks.filter((t) => t.projectId === projectId).length
  }

  function openTasksInProject(projectId: string) {
    useTaskStore.getState().setActiveProjectId(projectId)
  }

  const workspaceNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const o of workspaceOptions) map.set(o.id, o.label)
    return map
  }, [workspaceOptions])

  const rosterNameByUserId = useMemo(() => {
    const map = new Map<string, string>()
    for (const u of users) {
      if (u.id && u.name) map.set(String(u.id), u.name)
    }
    return map
  }, [users])

  const groupedProjects = useMemo(() => {
    const map = new Map<string, { label: string; items: Project[] }>()
    for (const project of projects) {
      const key = String(project.workspaceId)
      const label =
        workspaceNameById.get(key) ?? rosterNameByUserId.get(key) ?? 'Workspace'
      const bucket = map.get(key) ?? { label, items: [] }
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
  }, [projects, rosterNameByUserId, workspaceNameById])

  function countOpenTasksInProject(projectId: string) {
    return catalogTasks.filter(
      (t) =>
        t.projectId === projectId &&
        (t.status === 'todo' || t.status === 'in-progress'),
    ).length
  }

  function openDeleteProjectDialog(project: Project) {
    const openCount = countOpenTasksInProject(project.id)
    if (openCount > 0) {
      setDeleteBlockedMessage(
        openCount === 1
          ? 'This project still has 1 open task (to do or in progress). Complete or move it before deleting.'
          : `This project still has ${openCount} open tasks (to do or in progress). Complete or move them before deleting.`,
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
    if (result.ok) {
      void fetchProjects()
      refreshCatalog()
      return
    }
    if (result.blocked) {
      setDeleteBlockedMessage(result.message)
      setDeleteBlockedOpen(true)
    }
  }

  async function handleCreateProject() {
    const name = projectName.trim()
    if (!name) return
    const ws =
      workspaceOptions.find((o) => o.id === createWorkspaceId)?.id ??
      workspaceOptions.find((o) => o.id === defaultWorkspaceId)?.id ??
      workspaceOptions[0]?.id
    const ok = await addProject({ name, workspaceId: workspaceOptions.length > 1 ? ws : undefined })
    if (!ok) return
    setCreateOpen(false)
    setProjectName('')
    setCreateWorkspaceId(defaultWorkspaceId)
    void fetchProjects()
    refreshCatalog()
  }

  function openEditProject(project: Project) {
    setEditingProject(project)
    setEditName(project.name)
    setEditWorkspaceId(String(project.workspaceId))
    setEditOpen(true)
  }

  async function handleSaveProject() {
    if (!editingProject) return
    const name = editName.trim()
    if (!name) return
    const payload: { name: string; workspaceId?: string } = { name }
    if (editWorkspaceId && editWorkspaceId !== String(editingProject.workspaceId)) {
      payload.workspaceId = editWorkspaceId
    }
    const ok = await editProject(editingProject.id, payload)
    if (!ok) return
    setEditOpen(false)
    setEditingProject(null)
    void fetchProjects()
    refreshCatalog()
  }

  const editingTaskCount = editingProject ? taskCountForProject(editingProject.id) : 0
  const canChangeWorkspaceOnEdit = editingTaskCount === 0

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
            <DialogDescription>
              Projects hold tasks. Choose which workspace (team) this project belongs to — you can
              change the workspace later only while the project has no tasks yet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Name</p>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Project name"
                maxLength={80}
              />
            </div>
            {workspaceOptions.length > 1 ? (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Workspace</p>
                <Select
                  value={createWorkspaceId}
                  onValueChange={(value) => setCreateWorkspaceId(value ?? '')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select workspace" />
                  </SelectTrigger>
                  <SelectContent side="bottom" sideOffset={8} alignItemWithTrigger={false}>
                    {workspaceOptions.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
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
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open)
          if (!open) setEditingProject(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit project</DialogTitle>
            <DialogDescription>
              Rename the project or move it to another workspace you belong to (only when it has no
              tasks yet).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Name</p>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Project name"
                maxLength={80}
              />
            </div>
            {workspaceOptions.length > 1 ? (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Workspace</p>
                <Select
                  value={editWorkspaceId}
                  onValueChange={(value) => setEditWorkspaceId(value ?? '')}
                  disabled={!canChangeWorkspaceOnEdit}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="bottom" sideOffset={8} alignItemWithTrigger={false}>
                    {workspaceOptions.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!canChangeWorkspaceOnEdit ? (
                  <p className="text-[11px] text-muted-foreground">
                    Workspace is locked while this project has {editingTaskCount} task
                    {editingTaskCount === 1 ? '' : 's'}.
                  </p>
                ) : null}
              </div>
            ) : null}
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={() => void handleSaveProject()}>
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
                removed permanently. Completed tasks in this project are deleted with it.
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
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">Projects</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Create and organize projects per workspace. Only the workspace owner can rename, move,
            or delete projects; members can still use them for tasks.
          </p>
        </div>
        <Button className="shadow-lg shadow-primary/25" type="button" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          New project
        </Button>
      </motion.div>

      {groupedProjects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 bg-white/3 px-4 py-12 text-center">
          <FolderKanban className="mx-auto mb-3 size-10 opacity-40" />
          <p className="text-sm text-muted-foreground">No projects yet. Create your first one above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedProjects.map((group) => {
            const canManage = currentUser?.id === group.workspaceId
            return (
              <div
                key={`proj-group-${group.workspaceId}`}
                className="overflow-hidden rounded-xl border border-white/10 bg-linear-to-b from-white/6 to-black/25"
              >
                <div className="border-b border-white/10 bg-white/4 px-3 py-2.5 sm:px-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Workspace
                  </p>
                  <p className="truncate text-sm font-medium text-foreground">{group.label}</p>
                </div>
                <ul className="divide-y divide-white/10 p-2 sm:p-3">
                  {group.items.map((project) => {
                    const n = taskCountForProject(project.id)
                    const openN = countOpenTasksInProject(project.id)
                    return (
                      <li
                        key={project.id}
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
                            {n} task{n === 1 ? '' : 's'}
                            {openN > 0
                              ? ` · ${openN} open (to do or in progress)`
                              : n > 0
                                ? ' · none open'
                                : ''}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1 sm:pl-2">
                          <Link
                            to="/tasks"
                            onClick={() => openTasksInProject(project.id)}
                            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-8')}
                          >
                            Tasks
                          </Link>
                          {canManage ? (
                            <>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="size-8 text-muted-foreground hover:text-foreground"
                                onClick={() => openEditProject(project)}
                                aria-label={`Edit ${project.name}`}
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
                            </>
                          ) : null}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
