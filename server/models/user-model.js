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
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
)

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString()
    delete ret._id
    return ret
  },
})

export const UserModel = mongoose.model('User', userSchema)
