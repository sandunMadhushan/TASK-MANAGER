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
      toast.success('Password reset successful', { description: 'You can now sign in.' })
      window.location.href = '/login'
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
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="New password"
              aria-label="New password"
            />
            <Input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm new password"
              aria-label="Confirm new password"
            />
            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? 'Resetting...' : 'Reset password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

