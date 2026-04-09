import { motion } from 'framer-motion'
import { Loader2, Upload, UserCircle2 } from 'lucide-react'
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import Cropper from 'react-easy-crop'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldContent, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { updateUserApi } from '@/services/task-api'
import { useAuthStore } from '@/store/auth-store'
import { useTaskStore } from '@/store/task-store'

export function ProfilePage() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const setCurrentUser = useAuthStore((s) => s.setCurrentUser)
  const fetchUsers = useTaskStore((s) => s.fetchUsers)
  const fetchTasks = useTaskStore((s) => s.fetchTasks)
  const [name, setName] = useState(currentUser?.name ?? '')
  const [email, setEmail] = useState(currentUser?.email ?? '')
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false)
  const [selectedAvatarFileName, setSelectedAvatarFileName] = useState('')
  const [cropEditorOpen, setCropEditorOpen] = useState(false)
  const [cropSourceImage, setCropSourceImage] = useState('')
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1.1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedArea | null>(null)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    setName(currentUser?.name ?? '')
    setEmail(currentUser?.email ?? '')
    setAvatarUrl(currentUser?.avatarUrl ?? '')
  }, [currentUser?.avatarUrl, currentUser?.email, currentUser?.name])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!currentUser?.id) return

    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedAvatarUrl = avatarUrl.trim()
    if (!trimmedName || !trimmedEmail) {
      setFormError('Name and email are required.')
      return
    }
    if (trimmedAvatarUrl.length > 2_500_000) {
      setFormError('Avatar image is too large. Please choose a smaller image.')
      return
    }

    setIsSaving(true)
    setFormError('')
    try {
      const updated = await updateUserApi(currentUser.id, {
        name: trimmedName,
        email: trimmedEmail,
        avatarUrl: trimmedAvatarUrl,
      })
      setCurrentUser(updated)
      await Promise.all([fetchUsers(), fetchTasks()])
      toast.success('Profile updated')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update profile.'
      setFormError(message)
      toast.error('Profile update failed', { description: message })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleAvatarUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setFormError('Please select a valid image file.')
      return
    }

    setIsProcessingAvatar(true)
    setFormError('')
    setSelectedAvatarFileName(file.name)
    try {
      const rawDataUrl = await readFileAsDataUrl(file)
      setCropSourceImage(rawDataUrl)
      setCrop({ x: 0, y: 0 })
      setZoom(1.1)
      setCroppedAreaPixels(null)
      setCropEditorOpen(true)
    } catch {
      setFormError('Unable to process this image. Try another one.')
    } finally {
      setIsProcessingAvatar(false)
      event.target.value = ''
    }
  }

  async function applyAvatarCrop() {
    if (!cropSourceImage || !croppedAreaPixels) {
      setFormError('Move and zoom the image before applying crop.')
      return
    }
    setIsProcessingAvatar(true)
    try {
      const cropped = await cropAvatar(cropSourceImage, croppedAreaPixels, 320)
      setAvatarUrl(cropped)
      setCropEditorOpen(false)
      toast.success('Avatar crop applied')
    } catch {
      setFormError('Unable to crop this image. Please try again.')
    } finally {
      setIsProcessingAvatar(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Dialog open={cropEditorOpen} onOpenChange={setCropEditorOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Adjust avatar</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative h-72 overflow-hidden rounded-xl border border-white/10 bg-black/60">
              <Cropper
                image={cropSourceImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_croppedArea, pixels) => setCroppedAreaPixels(pixels)}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="avatar-zoom" className="text-xs text-muted-foreground">
                Zoom
              </label>
              <input
                id="avatar-zoom"
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="w-full accent-violet-400"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCropEditorOpen(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={isProcessingAvatar} onClick={() => void applyAvatarCrop()}>
                {isProcessingAvatar ? 'Applying...' : 'Apply crop'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your personal account details for this workspace.
        </p>
      </motion.div>

      <Card className="border-white/10 bg-white/4 backdrop-blur-md">
        <CardHeader className="pb-2">
          <CardTitle className="inline-flex items-center gap-2 text-base">
            <UserCircle2 className="size-5 text-primary" />
            Account details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <form className="space-y-3" onSubmit={handleSubmit}>
            {formError ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {formError}
              </p>
            ) : null}

            <Field>
              <FieldLabel htmlFor="profile-name">Name</FieldLabel>
              <FieldContent>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your full name"
                />
              </FieldContent>
              <FieldError />
            </Field>

            <Field>
              <FieldLabel htmlFor="profile-email">Email</FieldLabel>
              <FieldContent>
                <Input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                />
              </FieldContent>
              <FieldError />
            </Field>

            <Field>
              <FieldLabel htmlFor="profile-avatar-file">Avatar image</FieldLabel>
              <FieldContent>
                <label
                  htmlFor="profile-avatar-file"
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-white/15 bg-white/6 px-3 py-2.5 transition hover:bg-white/10"
                >
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                    <Upload className="size-4 text-violet-300" />
                    Upload avatar
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {selectedAvatarFileName || 'PNG, JPG, WEBP'}
                  </span>
                </label>
                <Input
                  id="profile-avatar-file"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                  className="hidden"
                  onChange={(event) => void handleAvatarUpload(event)}
                />
              </FieldContent>
              <FieldError />
              <p className="text-[11px] text-muted-foreground">
                Choose an image, then crop and zoom before saving.
              </p>
            </Field>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="mb-2 text-xs text-muted-foreground">Preview</p>
              <Avatar className="size-12 ring-2 ring-primary/30">
                <AvatarImage alt={name || 'Profile avatar'} src={avatarUrl || undefined} />
                <AvatarFallback>{(name || 'U').slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="mt-3 inline-flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setAvatarUrl('')}
                  disabled={isProcessingAvatar || !avatarUrl}
                >
                  Remove avatar
                </Button>
                {isProcessingAvatar ? (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" />
                    Processing image...
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save profile'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

type CroppedArea = {
  width: number
  height: number
  x: number
  y: number
}

async function cropAvatar(
  dataUrl: string,
  cropArea: CroppedArea,
  outputSize: number
): Promise<string> {
  const image = await loadImage(dataUrl)
  const canvas = document.createElement('canvas')
  canvas.width = outputSize
  canvas.height = outputSize
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas unavailable')

  ctx.drawImage(
    image,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    outputSize,
    outputSize
  )
  return canvas.toDataURL('image/webp', 0.9)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

