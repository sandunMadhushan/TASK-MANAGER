import { motion } from 'framer-motion'
import { CheckCircle2, ListChecks, LogOut, Mail, Plus, Timer, Trash2, Users } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import {
  getWorkspaceRootId,
  isWorkspaceOwnerConfirmedFromTeam,
  isWorkspaceOwnerUser,
} from '@/lib/workspace-role'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldContent, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  cancelWorkspacePendingInviteApi,
  createUserApi,
  deleteUserApi,
  fetchWorkspacePendingInvitesApi,
  type TeamInviteItem,
} from '@/services/task-api'
import { useAuthStore } from '@/store/auth-store'
import { useTaskStore } from '@/store/task-store'

export function TeamPage() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const users = useTaskStore((s) => s.users)
  const tasks = useTaskStore((s) => s.tasks)
  const fetchUsers = useTaskStore((s) => s.fetchUsers)
  const fetchTasks = useTaskStore((s) => s.fetchTasks)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const searchText = (searchParams.get('q') ?? '').trim().toLowerCase()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [manageUsersOpen, setManageUsersOpen] = useState(false)
  const [pendingInvites, setPendingInvites] = useState<TeamInviteItem[]>([])
  const [cancellingInviteId, setCancellingInviteId] = useState<string | null>(null)

  const statsByUser = useMemo(() => {
    const map = new Map<
      string,
      { total: number; todo: number; inProgress: number; done: number }
    >()

    for (const task of tasks) {
      for (const assigneeId of task.assignedToIds ?? []) {
        const current = map.get(assigneeId) ?? { total: 0, todo: 0, inProgress: 0, done: 0 }
        current.total += 1
        if (task.status === 'todo') current.todo += 1
        if (task.status === 'in-progress') current.inProgress += 1
        if (task.status === 'done') current.done += 1
        map.set(assigneeId, current)
      }
    }

    return map
  }, [tasks])

  const visibleUsers = useMemo(() => {
    if (!searchText) return users
    return users.filter((user) => {
      const haystack = `${user.name} ${user.email}`.toLowerCase()
      return haystack.includes(searchText)
    })
  }, [searchText, users])

  const isWorkspaceOwner = useMemo(
    () => isWorkspaceOwnerUser(currentUser, users),
    [currentUser, users]
  )
  const workspaceRootId = useMemo(
    () => getWorkspaceRootId(currentUser, users),
    [currentUser, users]
  )
  const ownerConfirmedFromTeam = useMemo(
    () => isWorkspaceOwnerConfirmedFromTeam(currentUser, users),
    [currentUser, users]
  )

  function openInvite() {
    if (!isWorkspaceOwner) return
    setName('')
    setEmail('')
    setFormError('')
    setDialogOpen(true)
  }

  useEffect(() => {
    if (!manageUsersOpen) return
    if (!ownerConfirmedFromTeam) {
      setPendingInvites([])
      return
    }
    async function loadPendingInvites() {
      try {
        const invites = await fetchWorkspacePendingInvitesApi()
        setPendingInvites(invites)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load pending invites.'
        toast.error('Failed to load pending invites', { description: message })
      }
    }
    void loadPendingInvites()
  }, [manageUsersOpen, ownerConfirmedFromTeam])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!isWorkspaceOwner) {
      setFormError('Only the workspace owner can send invites.')
      return
    }
    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedName || !trimmedEmail) {
      setFormError('Name and email are required.')
      return
    }

    setIsSaving(true)
    setFormError('')
    try {
      const result = (await createUserApi({
        name: trimmedName,
        email: trimmedEmail,
      })) as { message?: string }
      toast.success('Invite processed', {
        description:
          result.message ??
          'If this email already has an account, they can accept or decline from Notifications.',
      })
      setDialogOpen(false)
      await Promise.all([fetchUsers(), fetchTasks()])
      const teamUsers = useTaskStore.getState().users
      if (isWorkspaceOwnerConfirmedFromTeam(currentUser, teamUsers)) {
        const invites = await fetchWorkspacePendingInvitesApi()
        setPendingInvites(invites)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save user.'
      setFormError(message)
      toast.error('Failed to save user', { description: message })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleCancelInvite(inviteId: string) {
    setCancellingInviteId(inviteId)
    try {
      await cancelWorkspacePendingInviteApi(inviteId)
      const invites = await fetchWorkspacePendingInvitesApi()
      setPendingInvites(invites)
      toast.success('Invite cancelled')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to cancel invite.'
      toast.error('Failed to cancel invite', { description: message })
    } finally {
      setCancellingInviteId(null)
    }
  }

  async function handleDelete(userId: string) {
    setDeletingUserId(userId)
    const isLeaving = currentUser?.id === userId && !isWorkspaceOwner
    try {
      const { message } = await deleteUserApi(userId)
      await Promise.all([fetchUsers(), fetchTasks()])
      if (isLeaving) {
        await useAuthStore.getState().bootstrap()
      }
      toast.success(isLeaving ? 'Left team' : 'Removed from team', {
        description: message,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update membership.'
      toast.error(isLeaving ? 'Could not leave team' : 'Could not remove member', {
        description: message,
      })
    } finally {
      setDeletingUserId(null)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite user</DialogTitle>
            <DialogDescription>
              Add a workspace member by email. Existing accounts get a team invite notification.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-3" onSubmit={handleSubmit}>
            {formError ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {formError}
              </p>
            ) : null}
            <Field>
              <FieldLabel htmlFor="team-user-name">Name</FieldLabel>
              <FieldContent>
                <Input
                  id="team-user-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Alex Morgan"
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="team-user-email">Email</FieldLabel>
              <FieldContent>
                <Input
                  id="team-user-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="alex@company.com"
                />
              </FieldContent>
              <FieldError />
            </Field>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Sending...' : 'Invite user'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={manageUsersOpen} onOpenChange={setManageUsersOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Manage users</DialogTitle>
            <DialogDescription>
              {isWorkspaceOwner
                ? 'Cancel pending invites or remove members. Profile is where each person edits their own details.'
                : 'View teammates. You can leave the team from your row; only the owner can remove others.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {isWorkspaceOwner && pendingInvites.length > 0 ? (
              <div className="space-y-2 rounded-xl border border-amber-300/30 bg-amber-500/10 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">Invited / pending</p>
                {pendingInvites.map((invite) => (
                  <div
                    key={`pending-${invite.id}`}
                    className="flex flex-col gap-2 rounded-lg border border-amber-300/25 bg-black/20 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{invite.targetEmail}</p>
                      <p className="text-xs text-muted-foreground">Invited by {invite.inviterName}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full border border-amber-300/40 bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-200">
                        Pending
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        disabled={cancellingInviteId === invite.id}
                        onClick={() => void handleCancelInvite(invite.id)}
                      >
                        {cancellingInviteId === invite.id ? 'Cancelling…' : 'Cancel invite'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {visibleUsers.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/15 bg-white/4 p-4 text-center text-sm text-muted-foreground">
                No team members match your search.
              </p>
            ) : (
              visibleUsers.map((user) => (
                <div
                  key={`manage-${user.id}`}
                  className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="inline-flex items-center gap-2 truncate text-sm font-medium text-foreground">
                      <Avatar size="sm">
                        <AvatarImage alt={user.name} src={user.avatarUrl} />
                        <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      {user.name}
                      {currentUser?.id === user.id ? (
                        <span className="ml-1.5 rounded-full border border-violet-300/35 bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-violet-200">
                          You
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    {Array.isArray(user.workspaceNames) && user.workspaceNames.length > 0 ? (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Groups: {user.workspaceNames.join(', ')}
                      </p>
                    ) : null}
                  </div>
                  <div className="inline-flex flex-wrap items-center gap-2">
                    {isWorkspaceOwner && String(user.id) !== workspaceRootId ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        type="button"
                        disabled={deletingUserId === user.id}
                        onClick={() => void handleDelete(user.id)}
                      >
                        <Trash2 className="size-3.5" />
                        {deletingUserId === user.id ? 'Removing...' : 'Remove from team'}
                      </Button>
                    ) : null}
                    {!isWorkspaceOwner && currentUser?.id === user.id ? (
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        disabled={deletingUserId === user.id}
                        onClick={() => void handleDelete(user.id)}
                      >
                        <LogOut className="size-3.5" />
                        {deletingUserId === user.id ? 'Leaving...' : 'Leave team'}
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">Team</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Workspace members available for task assignments.
            </p>
          </div>
          <div className="inline-flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => setManageUsersOpen(true)}>
              <Users className="size-4" />
              Manage users
            </Button>
            {isWorkspaceOwner ? (
              <Button type="button" onClick={openInvite}>
                <Plus className="size-4" />
                Invite user
              </Button>
            ) : null}
          </div>
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visibleUsers.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.3 }}
          >
            <Card className="border-white/10 bg-card/70 backdrop-blur-xl">
              <CardHeader className="pb-2">
                <CardTitle className="inline-flex items-center gap-2 text-base">
                  <Avatar size="sm">
                    <AvatarImage alt={user.name} src={user.avatarUrl} />
                    <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {user.name}
                  {currentUser?.id === user.id ? (
                    <span className="rounded-full border border-violet-300/35 bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-200">
                      You
                    </span>
                  ) : null}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0 text-sm text-muted-foreground">
                <p className="inline-flex items-center gap-2">
                  <Mail className="size-3.5" />
                  {user.email}
                </p>
                {Array.isArray(user.workspaceNames) && user.workspaceNames.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {user.workspaceNames.map((group) => (
                      <span
                        key={`${user.id}-${group}`}
                        className="rounded-full border border-sky-300/35 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-200"
                      >
                        {group}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-2">
                    <p className="text-muted-foreground">Total</p>
                    <p className="mt-1 inline-flex items-center gap-1 font-semibold text-foreground">
                      <ListChecks className="size-3.5 text-primary" />
                      {statsByUser.get(user.id)?.total ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-2">
                    <p className="text-muted-foreground">To do</p>
                    <p className="mt-1 inline-flex items-center gap-1 font-semibold text-foreground">
                      <Timer className="size-3.5 text-amber-300" />
                      {statsByUser.get(user.id)?.todo ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-2">
                    <p className="text-muted-foreground">In progress</p>
                    <p className="mt-1 font-semibold text-foreground">
                      {statsByUser.get(user.id)?.inProgress ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-2">
                    <p className="text-muted-foreground">Done</p>
                    <p className="mt-1 inline-flex items-center gap-1 font-semibold text-foreground">
                      <CheckCircle2 className="size-3.5 text-emerald-300" />
                      {statsByUser.get(user.id)?.done ?? 0}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full"
                  type="button"
                  onClick={() => navigate(`/tasks?assignee=${encodeURIComponent(user.id)}`)}
                >
                  View assigned tasks
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

    </div>
  )
}

