import { config } from 'dotenv'
import mongoose from 'mongoose'

import { connectDatabase } from '../server/config/db.js'
import { env } from '../server/config/env.js'
import { ProjectModel } from '../server/models/project-model.js'
import { TaskModel } from '../server/models/task-model.js'

config()

async function run() {
  await connectDatabase(env.mongoUri)

  const workspaceIds = await TaskModel.distinct('workspaceId', {
    workspaceId: { $exists: true, $ne: null },
  })

  for (const workspaceId of workspaceIds) {
    const workspace = String(workspaceId)
    let project = await ProjectModel.findOne({ workspaceId: workspace, name: 'General' })
    if (!project) {
      project = await ProjectModel.create({
        name: 'General',
        workspaceId: workspace,
        createdBy: workspace,
        status: 'active',
      })
    }
    await TaskModel.updateMany(
      { workspaceId: workspace, $or: [{ projectId: { $exists: false } }, { projectId: null }] },
      { $set: { projectId: project._id } }
    )
  }

  await mongoose.disconnect()
  console.log('Task project migration completed.')
}

run().catch(async (error) => {
  console.error('Task project migration failed:', error)
  try {
    await mongoose.disconnect()
  } catch {
    // ignore
  }
  process.exit(1)
})
