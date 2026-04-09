import { motion } from 'framer-motion'
import { ArrowRight, ShieldCheck, Sparkles, UserPlus } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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

    if (mode === 'signin') {
      const ok = await login(normalizedEmail)
      if (!ok) {
        toast.error('Login failed', { description: 'No user found for this email.' })
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
    const ok = await signup({ name: trimmedName, email: normalizedEmail })
    if (!ok) {
      toast.error('Sign up failed', { description: 'Email already exists or request failed.' })
      return
    }
    toast.success('Account created')
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute -left-20 top-16 size-72 rounded-full bg-violet-500/18 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 right-10 size-80 rounded-full bg-indigo-500/14 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="grid w-full max-w-5xl gap-5 lg:grid-cols-[1.1fr_0.9fr]"
      >
        <Card className="hidden border-white/10 bg-card/70 shadow-2xl shadow-black/25 backdrop-blur-xl lg:block">
          <CardContent className="flex h-full flex-col justify-between p-8">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs text-violet-100">
                <Sparkles className="size-3.5 text-violet-300" />
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
              <p className="text-xs text-muted-foreground">
                Demo emails: alex@company.com, sophie@company.com
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

