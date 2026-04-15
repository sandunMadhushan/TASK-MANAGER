import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'

export function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[oklch(0.1_0.03_275)] text-foreground">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_120%_80%_at_50%_-10%,oklch(0.45_0.18_285/0.35),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_70%_50%_at_100%_0%,oklch(0.4_0.15_310/0.22),transparent_50%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_60%_45%_at_0%_100%,oklch(0.38_0.12_250/0.18),transparent_55%)]"
      />

      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 md:px-8">
        <button
          type="button"
          className="inline-flex items-center gap-2"
          onClick={() => navigate('/')}
        >
          <img src="/logo.png" alt="Nexus Tasks logo" className="size-8 rounded-lg object-cover ring-1 ring-white/20" />
          <span className="font-heading text-lg font-semibold">Nexus</span>
        </button>
        <div className="inline-flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
            Sign in
          </Button>
          <Button size="sm" onClick={() => navigate('/login')}>
            Get started
          </Button>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl gap-10 px-5 pb-16 pt-10 md:px-8 md:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs text-violet-100">
            <Sparkles className="size-3.5 text-violet-300" />
            Team productivity, reimagined
          </p>
          <h1 className="mt-5 font-heading text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
            Focus on building.
            <br />
            <span className="text-muted-foreground">We'll handle the rest.</span>
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Nexus Tasks is your workspace for assignments, collaboration, and smart notifications.
            Keep teams aligned with a premium interface designed for momentum.
          </p>
          <div className="mt-7 inline-flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={() => navigate('/login')}>
              Get started
              <ArrowRight className="size-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
              View features
            </Button>
          </div>
        </motion.section>

        <motion.section
          id="features"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4 }}
          className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl md:p-6"
        >
          <div className="space-y-3">
            <FeatureItem
              icon={<Users className="size-4 text-sky-300" />}
              title="Workspace teams"
              description="Invite members, manage roles, and keep assignment visibility scoped to your team."
            />
            <FeatureItem
              icon={<CheckCircle2 className="size-4 text-emerald-300" />}
              title="Task flow that stays clear"
              description="Track to-do, in-progress, and done states with fast updates and assignee context."
            />
            <FeatureItem
              icon={<ShieldCheck className="size-4 text-violet-300" />}
              title="Secure by default"
              description="JWT auth, protected APIs, and profile-first account management built in."
            />
          </div>
        </motion.section>
      </main>
    </div>
  )
}

type FeatureItemProps = {
  icon: React.ReactNode
  title: string
  description: string
}

function FeatureItem({ icon, title, description }: FeatureItemProps) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
        {icon}
        {title}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
    </article>
  )
}

