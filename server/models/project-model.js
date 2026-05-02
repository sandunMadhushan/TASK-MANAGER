import mongoose from 'mongoose'

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
      required: true,
      index: true,
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    /** `YYYY-MM` — first month of the planned project window (from month picker). */
    planStartMonth: {
      type: String,
      trim: true,
      maxlength: 7,
    },
    /** `YYYY-MM` — last month of the planned project window (estimated close). */
    planEndMonth: {
      type: String,
      trim: true,
      maxlength: 7,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
    versionKey: false,
  }
)

projectSchema.index({ workspaceId: 1, name: 1 }, { unique: true })

projectSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString()
    ret.workspaceId = String(ret.workspaceId)
    ret.createdBy = String(ret.createdBy)
    delete ret._id
    return ret
  },
})

export const ProjectModel = mongoose.model('Project', projectSchema)
