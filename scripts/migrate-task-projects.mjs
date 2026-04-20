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
    const projectCount = await ProjectModel.countDocuments({ workspaceId: workspace })
    if (projectCount === 0) {
      console.warn(
        `Skipping workspace ${workspace}: no projects; create one project in that workspace before migrating legacy tasks.`
      )
      continue
    }
    if (projectCount > 1) {
      const orphanCount = await TaskModel.countDocuments({
        workspaceId: workspace,
        $or: [{ projectId: { $exists: false } }, { projectId: null }],
      })
      if (orphanCount > 0) {
        console.warn(
          `Skipping workspace ${workspace}: ${projectCount} projects exist and ${orphanCount} tasks lack projectId; assign projectId manually.`
        )
      }
      continue
    }
    const project = await ProjectModel.findOne({ workspaceId: workspace })
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
