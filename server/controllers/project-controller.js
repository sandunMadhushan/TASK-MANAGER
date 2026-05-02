import { TaskModel } from '../models/task-model.js'
import {
  createProject,
  deleteProjectIfAllowed,
  getProjectById,
  getProjectsForUser,
  updateProject,
} from '../services/project-service.js'
import { notifyProjectCreated, notifyProjectDeleted } from '../services/notification-service.js'
import { getUsers } from '../services/user-service.js'

const projectStatusValues = new Set(['active', 'archived'])

const PLAN_MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/

function readPlanMonthFromBody(raw) {
  if (raw === undefined) return { mode: 'omit' }
  if (raw === null || raw === '') return { mode: 'clear' }
  const s = String(raw).trim()
  if (!PLAN_MONTH_RE.test(s)) return { mode: 'invalid' }
  return { mode: 'set', value: s }
}

function readRequiredPlanMonths(body) {
  const start = readPlanMonthFromBody(body?.planStartMonth)
  const end = readPlanMonthFromBody(body?.planEndMonth)
  if (start.mode === 'omit' || end.mode === 'omit') {
    return { ok: false, message: 'Project start month and estimated close month are required.' }
  }
  if (start.mode === 'clear' || end.mode === 'clear') {
    return { ok: false, message: 'Project start month and estimated close month are required.' }
  }
  if (start.mode === 'invalid' || end.mode === 'invalid') {
    return { ok: false, message: 'Use a valid calendar month (YYYY-MM) for schedule fields.' }
  }
  if (start.value > end.value) {
    return {
      ok: false,
      message: 'Start month must be the same as or before the estimated close month.',
    }
  }
  return { ok: true, planStartMonth: start.value, planEndMonth: end.value }
}

function workspaceIdsForUser(req) {
  const raw = req.user?.workspaceIds ?? [req.user?.workspaceId]
  const list = (Array.isArray(raw) ? raw : [raw]).map((id) => String(id)).filter(Boolean)
  return [...new Set(list)]
}

function workspaceNameFromUsers(users, workspaceId) {
  const target = String(workspaceId ?? '')
  const owner = Array.isArray(users)
    ? users.find((u) => String(u?.id ?? '') === target)
    : null
  const ownerWorkspaceName = String(owner?.workspaceName ?? '').trim()
  if (ownerWorkspaceName) return ownerWorkspaceName

  const membershipName = Array.isArray(users)
    ? users
        .flatMap((u) => {
          const ids = Array.isArray(u?.workspaceIds) ? u.workspaceIds.map(String) : []
          const names = Array.isArray(u?.workspaceNames) ? u.workspaceNames : []
          const idx = ids.indexOf(target)
          return idx >= 0 ? [String(names[idx] ?? '').trim()] : []
        })
        .find((name) => name)
    : ''
  if (membershipName) return membershipName

  const ownerName = String(owner?.name ?? '').trim()
  return ownerName || 'Workspace'
}

/** Workspace root owner OR project creator may manage a project. */
function canManageProject(req, project) {
  const actorId = String(req.user?.id ?? '')
  const workspaceRootId = String(project?.workspaceId ?? '')
  const createdById = String(project?.createdBy ?? '')
  if (!actorId) return false
  return actorId === workspaceRootId || actorId === createdById
}

export async function getProjectsHandler(req, res, next) {
  try {
    const workspaceIds = req.user?.workspaceIds ?? [req.user?.workspaceId]
    const projects = await getProjectsForUser(workspaceIds)
    return res.status(200).json({ projects })
  } catch (error) {
    return next(error)
  }
}

export async function createProjectHandler(req, res, next) {
  try {
    const actorId = String(req.user?.id ?? '')
    if (!actorId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
    const allowed = workspaceIdsForUser(req)
    const defaultWs = String(req.user?.workspaceId ?? req.user?.id ?? '')
    const requested =
      req.body?.workspaceId !== undefined && String(req.body.workspaceId).trim() !== ''
        ? String(req.body.workspaceId).trim()
        : defaultWs
    if (!allowed.includes(requested)) {
      return res.status(400).json({ message: 'Pick a workspace you belong to.' })
    }
    const name = String(req.body?.name ?? '').trim()
    const description = String(req.body?.description ?? '').trim()
    if (!name) {
      return res.status(400).json({ message: 'Project name is required.' })
    }

    const plan = readRequiredPlanMonths(req.body)
    if (!plan.ok) {
      return res.status(400).json({ message: plan.message })
    }

    const project = await createProject({
      name,
      description,
      workspaceId: requested,
      createdBy: actorId,
      planStartMonth: plan.planStartMonth,
      planEndMonth: plan.planEndMonth,
    })

    // Best-effort notification fanout for everyone in the selected workspace.
    try {
      const workspaceUsers = await getUsers(requested)
      const actorName = String(req.user?.name ?? '').trim() || 'A workspace member'
      await notifyProjectCreated(workspaceUsers, {
        projectId: project.id,
        projectName: project.name,
        workspaceId: requested,
        workspaceName: workspaceNameFromUsers(workspaceUsers, requested),
        createdById: actorId,
        createdByName: actorName,
      })
    } catch (notifyError) {
      console.error('[project-created-notify] failed to send workspace notification', notifyError)
    }

    return res.status(201).json(project)
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'A project with this name already exists.' })
    }
    return next(error)
  }
}

export async function deleteProjectHandler(req, res, next) {
  try {
    const actorId = String(req.user?.id ?? '')
    if (!actorId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
    const { projectId } = req.params
    if (!projectId) {
      return res.status(400).json({ message: 'Missing projectId.' })
    }

    const existing = await getProjectById(projectId)
    if (!existing || !workspaceIdsForUser(req).includes(String(existing.workspaceId))) {
      return res.status(404).json({ message: 'Project not found.' })
    }
    if (!canManageProject(req, existing)) {
      return res.status(403).json({ message: 'Only the workspace owner or project creator can delete this project.' })
    }

    const workspaceUsers = await getUsers(String(existing.workspaceId))
    const actorName = String(req.user?.name ?? '').trim() || 'A workspace member'

    const result = await deleteProjectIfAllowed(projectId)
    if (!result.ok) {
      return res.status(result.statusCode).json({ message: result.message })
    }

    await runProjectNotificationSafely(() =>
      notifyProjectDeleted(workspaceUsers, {
        projectId: String(existing.id ?? projectId),
        projectName: String(existing.name ?? 'Untitled project'),
        workspaceId: String(existing.workspaceId),
        workspaceName: workspaceNameFromUsers(workspaceUsers, existing.workspaceId),
        deletedById: actorId,
        deletedByName: actorName,
      })
    )
    return res.status(200).json({ deleted: true })
  } catch (error) {
    return next(error)
  }
}

async function runProjectNotificationSafely(notify) {
  try {
    await notify()
  } catch (error) {
    console.warn('Project notification dispatch failed:', error?.message ?? error)
  }
}

export async function updateProjectHandler(req, res, next) {
  try {
    const actorId = String(req.user?.id ?? '')
    if (!actorId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
    const { projectId } = req.params
    if (!projectId) {
      return res.status(400).json({ message: 'Missing projectId.' })
    }

    const existing = await getProjectById(projectId)
    if (!existing || !workspaceIdsForUser(req).includes(String(existing.workspaceId))) {
      return res.status(404).json({ message: 'Project not found.' })
    }
    if (!canManageProject(req, existing)) {
      return res.status(403).json({ message: 'Only the workspace owner or project creator can update this project.' })
    }

    const name =
      req.body?.name !== undefined ? String(req.body.name).trim() : undefined
    const description =
      req.body?.description !== undefined ? String(req.body.description).trim() : undefined
    const status = req.body?.status !== undefined ? String(req.body.status).trim() : undefined
    const newWorkspaceRaw =
      req.body?.workspaceId !== undefined ? String(req.body.workspaceId).trim() : undefined
    if (name !== undefined && !name) {
      return res.status(400).json({ message: 'Project name cannot be empty.' })
    }
    if (status !== undefined && !projectStatusValues.has(status)) {
      return res.status(400).json({ message: 'Project status is invalid.' })
    }

    const payload = { name, description, status }
    if (newWorkspaceRaw !== undefined) {
      const allowed = workspaceIdsForUser(req)
      if (!allowed.includes(newWorkspaceRaw)) {
        return res.status(400).json({ message: 'Pick a workspace you belong to.' })
      }
      if (newWorkspaceRaw !== String(existing.workspaceId)) {
        const taskCount = await TaskModel.countDocuments({ projectId })
        if (taskCount > 0) {
          return res.status(409).json({
            message:
              'Cannot move a project to another workspace while it still has tasks. Remove or move tasks first.',
          })
        }
      }
      payload.workspaceId = newWorkspaceRaw
    }

    if (req.body?.planStartMonth !== undefined || req.body?.planEndMonth !== undefined) {
      const s = readPlanMonthFromBody(req.body?.planStartMonth)
      const e = readPlanMonthFromBody(req.body?.planEndMonth)
      if (s.mode === 'invalid' || e.mode === 'invalid') {
        return res.status(400).json({ message: 'Use a valid calendar month (YYYY-MM) for schedule fields.' })
      }
      const nextStart =
        s.mode === 'omit'
          ? String(existing.planStartMonth ?? '').trim()
          : s.mode === 'clear'
            ? ''
            : s.value
      const nextEnd =
        e.mode === 'omit'
          ? String(existing.planEndMonth ?? '').trim()
          : e.mode === 'clear'
            ? ''
            : e.value
      const hasStart = nextStart !== ''
      const hasEnd = nextEnd !== ''
      if (hasStart !== hasEnd) {
        return res.status(400).json({
          message: 'Set both start month and estimated close month, or clear both.',
        })
      }
      if (hasStart && hasEnd) {
        if (nextStart > nextEnd) {
          return res.status(400).json({
            message: 'Start month must be the same as or before the estimated close month.',
          })
        }
        payload.planStartMonth = nextStart
        payload.planEndMonth = nextEnd
      } else {
        payload.planStartMonth = null
        payload.planEndMonth = null
      }
    }

    const project = await updateProject(projectId, payload)
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' })
    }
    return res.status(200).json(project)
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'A project with this name already exists.' })
    }
    return next(error)
  }
}
