import { Router } from 'express'

import {
  createTaskHandler,
  getTasksHandler,
  updateTaskStatusHandler,
} from '../controllers/task-controller.js'

export const taskRouter = Router()

taskRouter.get('/', getTasksHandler)
taskRouter.post('/', createTaskHandler)
taskRouter.patch('/:taskId/status', updateTaskStatusHandler)
