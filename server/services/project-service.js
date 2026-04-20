import { ProjectModel } from '../models/project-model.js'
import { TaskModel } from '../models/task-model.js'

function normalizeWorkspaceIds(value) {
  if (Array.isArray(value)) return value.map((id) => String(id)).filter(Boolean)
  if (!value) return []
  return [String(value)]
}

export async function getProjectsForUser(workspaceIds) {
  const scoped = normalizeWorkspaceIds(workspaceIds)
  const query = scoped.length > 0 ? { workspaceId: { $in: scoped } } : {}
  const rows = await ProjectModel.find(query).sort({ name: 1 })
  return rows.map((row) => row.toJSON())
}

export async function getProjectById(projectId) {
  if (!projectId) return null
  const row = await ProjectModel.findById(projectId)
  return row ? row.toJSON() : null
}

export async function createProject(payload) {
  const row = await ProjectModel.create({
    name: payload.name,
    description: payload.description ?? '',
    workspaceId: payload.workspaceId,
    createdBy: payload.createdBy,
    status: 'active',
  })
  return row.toJSON()
}

export async function updateProject(projectId, payload) {
  const update = {}
  if (payload.name !== undefined) update.name = payload.name
  if (payload.description !== undefined) update.description = payload.description
  if (payload.status !== undefined) update.status = payload.status
  if (payload.workspaceId !== undefined) update.workspaceId = payload.workspaceId

  const row = await ProjectModel.findByIdAndUpdate(projectId, update, {
    new: true,
    runValidators: true,
  })
  return row ? row.toJSON() : null
}

/**
 * Deletes a project when it has no open tasks (to do or in progress).
 * Removes remaining tasks (e.g. done) and the project document.
 */
export async function deleteProjectIfAllowed(projectId) {
  const project = await ProjectModel.findById(projectId)
  if (!project) {
    return { ok: false, statusCode: 404, message: 'Project not found.' }
  }
  const blocking = await TaskModel.countDocuments({
    projectId: project._id,
    status: { $in: ['todo', 'in-progress'] },
  })
  if (blocking > 0) {
    return {
      ok: false,
      statusCode: 409,
      message: `This project still has ${blocking} open ${blocking === 1 ? 'task' : 'tasks'} (to do or in progress). Complete or move them before deleting.`,
    }
  }
  await TaskModel.deleteMany({ projectId: project._id })
  await ProjectModel.findByIdAndDelete(project._id)
  return { ok: true }
}
