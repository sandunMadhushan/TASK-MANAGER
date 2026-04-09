import { Router } from 'express'

import {
  createTaskHandler,
  deleteTaskHandler,
  getTasksHandler,
  updateTaskStatusHandler,
} from '../controllers/task-controller.js'

export const taskRouter = Router()

taskRouter.get('/', getTasksHandler)
taskRouter.post('/', createTaskHandler)
taskRouter.patch('/:taskId/status', updateTaskStatusHandler)
taskRouter.delete('/:taskId', deleteTaskHandler)
