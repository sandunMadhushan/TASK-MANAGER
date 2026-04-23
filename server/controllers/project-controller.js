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

function workspaceIdsForUser(req) {
  const raw = req.user?.workspaceIds ?? [req.user?.workspaceId]
  const list = (Array.isArray(raw) ? raw : [raw]).map((id) => String(id)).filter(Boolean)
  return [...new Set(list)]
}

function workspaceNameForUser(req, workspaceId) {
  const ids = Array.isArray(req.user?.workspaceIds) ? req.user.workspaceIds.map(String) : []
  const names = Array.isArray(req.user?.workspaceNames) ? req.user.workspaceNames : []
  const idx = ids.indexOf(String(workspaceId ?? ''))
  const name = idx >= 0 ? String(names[idx] ?? '').trim() : ''
  return name || 'Workspace'
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

    const project = await createProject({
      name,
      description,
      workspaceId: requested,
      createdBy: actorId,
    })

    // Best-effort notification fanout for everyone in the selected workspace.
    try {
      const workspaceUsers = await getUsers(requested)
      const actorName = String(req.user?.name ?? '').trim() || 'A workspace member'
      await notifyProjectCreated(workspaceUsers, {
        projectId: project.id,
        projectName: project.name,
        workspaceId: requested,
        workspaceName: workspaceNameForUser(req, requested),
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
        workspaceName: workspaceNameForUser(req, existing.workspaceId),
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
