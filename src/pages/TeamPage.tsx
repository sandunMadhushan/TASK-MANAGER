import { motion } from 'framer-motion'
import { CheckCircle2, ListChecks, Mail, Pencil, Plus, Timer, Trash2, Users } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldContent, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { createUserApi, deleteUserApi, updateUserApi } from '@/services/task-api'
import { useTaskStore } from '@/store/task-store'

export function TeamPage() {
  const users = useTaskStore((s) => s.users)
  const tasks = useTaskStore((s) => s.tasks)
  const fetchUsers = useTaskStore((s) => s.fetchUsers)
  const fetchTasks = useTaskStore((s) => s.fetchTasks)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const searchText = (searchParams.get('q') ?? '').trim().toLowerCase()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [manageUsersOpen, setManageUsersOpen] = useState(false)

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

  function openInvite() {
    setEditingUserId(null)
    setName('')
    setEmail('')
    setFormError('')
    setDialogOpen(true)
  }

  function openEdit(userId: string) {
    const user = users.find((u) => u.id === userId)
    if (!user) return
    setEditingUserId(user.id)
    setName(user.name)
    setEmail(user.email)
    setFormError('')
    setDialogOpen(true)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedName || !trimmedEmail) {
      setFormError('Name and email are required.')
      return
    }

    setIsSaving(true)
    setFormError('')
    try {
      if (editingUserId) {
        await updateUserApi(editingUserId, { name: trimmedName, email: trimmedEmail })
        toast.success('User updated')
      } else {
        await createUserApi({ name: trimmedName, email: trimmedEmail })
        toast.success('User invited')
      }
      setDialogOpen(false)
      await Promise.all([fetchUsers(), fetchTasks()])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save user.'
      setFormError(message)
      toast.error('Failed to save user', { description: message })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(userId: string) {
    setDeletingUserId(userId)
    try {
      await deleteUserApi(userId)
      await Promise.all([fetchUsers(), fetchTasks()])
      toast.success('User deleted')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete user.'
      toast.error('Failed to delete user', { description: message })
    } finally {
      setDeletingUserId(null)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUserId ? 'Edit user' : 'Invite user'}</DialogTitle>
            <DialogDescription>
              {editingUserId
                ? 'Update the member details.'
                : 'Add a new workspace member for task assignment.'}
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
                {isSaving ? 'Saving...' : editingUserId ? 'Save changes' : 'Invite user'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={manageUsersOpen} onOpenChange={setManageUsersOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Manage users</DialogTitle>
            <DialogDescription>Edit or remove workspace members.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
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
                    <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() => {
                        setManageUsersOpen(false)
                        openEdit(user.id)
                      }}
                    >
                      <Pencil className="size-3.5" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      type="button"
                      disabled={deletingUserId === user.id}
                      onClick={() => void handleDelete(user.id)}
                    >
                      <Trash2 className="size-3.5" />
                      {deletingUserId === user.id ? 'Deleting...' : 'Delete'}
                    </Button>
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
            <Button type="button" onClick={openInvite}>
              <Plus className="size-4" />
              Invite user
            </Button>
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
                  <Users className="size-4 text-primary" />
                  {user.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0 text-sm text-muted-foreground">
                <p className="inline-flex items-center gap-2">
                  <Mail className="size-3.5" />
                  {user.email}
                </p>
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

