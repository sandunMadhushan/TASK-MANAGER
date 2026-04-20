import { Router } from 'express'

import {
  createProjectHandler,
  deleteProjectHandler,
  getProjectsHandler,
  updateProjectHandler,
} from '../controllers/project-controller.js'

export const projectRouter = Router()

projectRouter.get('/', getProjectsHandler)
projectRouter.post('/', createProjectHandler)
projectRouter.patch('/:projectId', updateProjectHandler)
projectRouter.delete('/:projectId', deleteProjectHandler)
