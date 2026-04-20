import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 120,
    },
    avatarUrl: {
      type: String,
      trim: true,
      default: '',
      maxlength: 3000000,
    },
    workspaceName: {
      type: String,
      trim: true,
      default: '',
      maxlength: 80,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    passwordResetTokenHash: {
      type: String,
      select: false,
      default: null,
    },
    passwordResetExpiresAt: {
      type: Date,
      select: false,
      default: null,
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    workspaceIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
      },
    ],
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
)

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString()
    if (ret.workspaceId) ret.workspaceId = ret.workspaceId.toString()
    if (Array.isArray(ret.workspaceIds)) {
      ret.workspaceIds = ret.workspaceIds.map((id) => String(id))
    } else {
      ret.workspaceIds = []
    }
    delete ret._id
    delete ret.passwordHash
    delete ret.passwordResetTokenHash
    delete ret.passwordResetExpiresAt
    return ret
  },
})

export const UserModel = mongoose.model('User', userSchema)
