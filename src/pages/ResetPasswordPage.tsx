import { Eye, EyeOff } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { resetPasswordApi } from '@/services/task-api'
import { useAuthStore } from '@/store/auth-store'

export function ResetPasswordPage() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  if (currentUser) return <Navigate to="/dashboard" replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!token) {
      toast.error('Reset link is invalid or expired.')
      return
    }
    if (password.length < 8) {
      toast.error('Use a stronger password', { description: 'Minimum 8 characters required.' })
      return
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setIsSaving(true)
    try {
      await resetPasswordApi({ token, newPassword: password })
      toast.success('Password reset successful', {
        description: 'You can now open Nexus Tasks desktop app or sign in on web.',
      })

      // Trigger browser-level "Open this app?" prompt when the desktop app protocol exists.
      window.location.href = 'nexustasks://open?source=reset-password'
      window.setTimeout(() => {
        window.location.href = '/login'
      }, 1500)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to reset password. Please try again.'
      toast.error('Password reset failed', { description: message })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <Card className="w-full max-w-md border-white/10 bg-card/70 shadow-2xl shadow-black/25 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-xl">Reset password</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={handleSubmit}>
            <Input
              type={showPasswords ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="New password"
              aria-label="New password"
            />
            <Input
              type={showPasswords ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm new password"
              aria-label="Confirm new password"
            />
            <div className="flex justify-end -mt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto cursor-pointer px-1 py-0 text-[11px] text-muted-foreground"
                onClick={() => setShowPasswords((v) => !v)}
              >
                {showPasswords ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                {showPasswords ? 'Hide passwords' : 'Show passwords'}
              </Button>
            </div>
            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? 'Resetting...' : 'Reset password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

