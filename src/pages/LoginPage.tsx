import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck, UserPlus } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { forgotPasswordApi } from '@/services/task-api'
import { useAuthStore } from '@/store/auth-store'

export function LoginPage() {
  const login = useAuthStore((s) => s.login)
  const signup = useAuthStore((s) => s.signup)
  const isLoggingIn = useAuthStore((s) => s.isLoggingIn)
  const isSigningUp = useAuthStore((s) => s.isSigningUp)
  const currentUser = useAuthStore((s) => s.currentUser)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [isSendingReset, setIsSendingReset] = useState(false)
  const isSubmitting = mode === 'signin' ? isLoggingIn : isSigningUp

  if (currentUser) {
    return <Navigate to="/dashboard" replace />
  }

  const helperText = useMemo(() => {
    if (mode === 'signin') return 'Sign in with your workspace email to continue.'
    return 'Create a new workspace profile and get started instantly.'
  }, [mode])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      toast.error('Email is required')
      return
    }
    if (!password) {
      toast.error('Password is required')
      return
    }

    if (mode === 'signin') {
      const ok = await login({ email: normalizedEmail, password })
      if (!ok) {
        toast.error('Login failed', { description: 'Invalid email or password.' })
        return
      }
      toast.success('Welcome back')
      return
    }

    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error('Name is required')
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
    const result = await signup({ name: trimmedName, email: normalizedEmail, password })
    if (!result.ok) {
      toast.error('Sign up failed', { description: result.message })
      return
    }
    toast.success('Account created')
  }

  async function handleForgotPasswordSubmit(event: FormEvent) {
    event.preventDefault()
    const normalized = forgotEmail.trim().toLowerCase()
    if (!normalized) {
      toast.error('Email is required')
      return
    }
    setIsSendingReset(true)
    try {
      await forgotPasswordApi(normalized)
      setForgotOpen(false)
      setForgotEmail('')
      toast.success('If the account exists, reset instructions were sent.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to request password reset.'
      toast.error('Could not send reset link', { description: message })
    } finally {
      setIsSendingReset(false)
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10">
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Forgot password</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={handleForgotPasswordSubmit}>
            <Input
              type="email"
              value={forgotEmail}
              onChange={(event) => setForgotEmail(event.target.value)}
              placeholder="you@company.com"
              aria-label="Reset email"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setForgotOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSendingReset}>
                {isSendingReset ? 'Sending...' : 'Send reset link'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="pointer-events-none absolute -left-20 top-16 size-72 rounded-full bg-violet-500/18 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 right-10 size-80 rounded-full bg-indigo-500/14 blur-3xl" />

      <Link
        to="/"
        className={buttonVariants({
          variant: 'ghost',
          className: 'mb-3 self-start text-muted-foreground',
        })}
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="grid w-full max-w-5xl gap-5 lg:grid-cols-[1.1fr_0.9fr]"
      >
        <Card className="hidden border-white/10 bg-card/70 shadow-2xl shadow-black/25 backdrop-blur-xl lg:block">
          <CardContent className="flex h-full flex-col justify-between p-8">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-2 py-1 text-xs text-violet-100">
                <img
                  src="/logo.png"
                  alt="Nexus Tasks logo"
                  className="size-4 rounded-sm object-cover"
                />
                Premium productivity flow
              </p>
              <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-foreground">
                Manage tasks with clarity and momentum
              </h1>
              <p className="mt-3 max-w-md text-sm text-muted-foreground">
                Assign work, track progress, and keep your team aligned with a fast, focused workspace.
              </p>
            </div>
            <div className="space-y-3 text-sm">
              <p className="inline-flex items-center gap-2 text-muted-foreground">
                <ShieldCheck className="size-4 text-emerald-300" />
                Secure session-backed access
              </p>
              <p className="inline-flex items-center gap-2 text-muted-foreground">
                <UserPlus className="size-4 text-sky-300" />
                Sign in or create a new account in seconds
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full border-white/10 bg-card/70 shadow-2xl shadow-black/25 backdrop-blur-xl">
          <CardHeader className="space-y-3">
            <CardTitle className="text-xl">
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </CardTitle>
            <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
              <Button
                type="button"
                size="sm"
                variant={mode === 'signin' ? 'default' : 'ghost'}
                className="rounded-lg"
                onClick={() => setMode('signin')}
              >
                Sign in
              </Button>
              <Button
                type="button"
                size="sm"
                variant={mode === 'signup' ? 'default' : 'ghost'}
                className="rounded-lg"
                onClick={() => setMode('signup')}
              >
                Sign up
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{helperText}</p>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleSubmit}>
              {mode === 'signup' ? (
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  aria-label="Name"
                />
              ) : null}
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="alex@company.com"
                aria-label="Email"
              />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                aria-label="Password"
              />
              <div className="flex justify-end -mt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto cursor-pointer px-1 py-0 text-[11px] text-muted-foreground"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  {showPassword ? 'Hide password' : 'Show password'}
                </Button>
              </div>
              {mode === 'signup' ? (
                <>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Confirm password"
                    aria-label="Confirm password"
                  />
                </>
              ) : null}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  mode === 'signin' ? 'Signing in...' : 'Creating account...'
                ) : (
                  <>
                    {mode === 'signin' ? 'Sign in' : 'Create account'}
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
              {mode === 'signin' ? (
                <div className="text-right">
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto px-0 py-0 text-xs"
                    onClick={() => {
                      setForgotEmail(email)
                      setForgotOpen(true)
                    }}
                  >
                    Forgot password?
                  </Button>
                </div>
              ) : null}
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

