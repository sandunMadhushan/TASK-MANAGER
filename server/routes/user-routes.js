import { Router } from 'express'

import {
  cancelPendingWorkspaceInviteHandler,
  createUserHandler,
  deleteUserHandler,
  getNovuSubscriberAuthHandler,
  getPendingWorkspaceInvitesHandler,
  getUsersHandler,
  updateUserHandler,
} from '../controllers/user-controller.js'

export const userRouter = Router()

userRouter.get('/', getUsersHandler)
userRouter.get('/pending-invites', getPendingWorkspaceInvitesHandler)
userRouter.delete('/pending-invites/:inviteId', cancelPendingWorkspaceInviteHandler)
userRouter.post('/', createUserHandler)
userRouter.get('/:userId/novu-auth', getNovuSubscriberAuthHandler)
userRouter.patch('/:userId', updateUserHandler)
userRouter.delete('/:userId', deleteUserHandler)
