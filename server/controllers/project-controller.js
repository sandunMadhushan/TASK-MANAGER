import {
  createProject,
  deleteProjectIfAllowed,
  getProjectById,
  getProjectsForUser,
  updateProject,
} from '../services/project-service.js'

const projectStatusValues = new Set(['active', 'archived'])

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
    const workspaceId = String(req.user?.workspaceId ?? '')
    if (!actorId || !workspaceId || actorId !== workspaceId) {
      return res.status(403).json({ message: 'Only workspace owner can create projects.' })
    }
    const name = String(req.body?.name ?? '').trim()
    const description = String(req.body?.description ?? '').trim()
    if (!name) {
      return res.status(400).json({ message: 'Project name is required.' })
    }

    const project = await createProject({
      name,
      description,
      workspaceId,
      createdBy: actorId,
    })
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
    const actorWorkspaceId = String(req.user?.workspaceId ?? '')
    if (!actorId || !actorWorkspaceId || actorId !== actorWorkspaceId) {
      return res.status(403).json({ message: 'Only workspace owner can delete projects.' })
    }
    const { projectId } = req.params
    if (!projectId) {
      return res.status(400).json({ message: 'Missing projectId.' })
    }

    const existing = await getProjectById(projectId)
    if (!existing || String(existing.workspaceId) !== actorWorkspaceId) {
      return res.status(404).json({ message: 'Project not found.' })
    }

    const result = await deleteProjectIfAllowed(projectId)
    if (!result.ok) {
      return res.status(result.statusCode).json({ message: result.message })
    }
    return res.status(200).json({ deleted: true })
  } catch (error) {
    return next(error)
  }
}

export async function updateProjectHandler(req, res, next) {
  try {
    const actorId = String(req.user?.id ?? '')
    const actorWorkspaceId = String(req.user?.workspaceId ?? '')
    if (!actorId || !actorWorkspaceId || actorId !== actorWorkspaceId) {
      return res.status(403).json({ message: 'Only workspace owner can update projects.' })
    }
    const { projectId } = req.params
    if (!projectId) {
      return res.status(400).json({ message: 'Missing projectId.' })
    }

    const existing = await getProjectById(projectId)
    if (!existing || String(existing.workspaceId) !== actorWorkspaceId) {
      return res.status(404).json({ message: 'Project not found.' })
    }

    const name =
      req.body?.name !== undefined ? String(req.body.name).trim() : undefined
    const description =
      req.body?.description !== undefined ? String(req.body.description).trim() : undefined
    const status = req.body?.status !== undefined ? String(req.body.status).trim() : undefined
    if (name !== undefined && !name) {
      return res.status(400).json({ message: 'Project name cannot be empty.' })
    }
    if (status !== undefined && !projectStatusValues.has(status)) {
      return res.status(400).json({ message: 'Project status is invalid.' })
    }

    const project = await updateProject(projectId, {
      name,
      description,
      status,
    })
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
