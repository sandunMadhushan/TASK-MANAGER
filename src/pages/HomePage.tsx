import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'

export function HomePage() {
  const navigate = useNavigate()
  const [featuresHighlighted, setFeaturesHighlighted] = useState(false)

  function handleViewFeaturesClick() {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setFeaturesHighlighted(true)
    window.setTimeout(() => setFeaturesHighlighted(false), 1000)
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[linear-gradient(160deg,oklch(0.15_0.045_280),oklch(0.12_0.035_265)_52%,oklch(0.13_0.04_300))] text-foreground">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_100%_70%_at_12%_0%,oklch(0.62_0.2_286/0.28),transparent_62%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_75%_55%_at_95%_12%,oklch(0.54_0.14_225/0.24),transparent_58%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_45%_100%,oklch(0.58_0.18_320/0.16),transparent_66%)]"
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
          <p className="inline-flex items-center gap-2 rounded-full border border-violet-300/35 bg-violet-400/15 px-3 py-1 text-xs text-violet-100">
            <Sparkles className="size-3.5 text-violet-300" />
            Built for focused teams
          </p>
          <h1 className="mt-5 font-heading text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
            Plan smarter.
            <br />
            <span className="text-[oklch(0.85_0.04_280)]">Deliver faster.</span>
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-[oklch(0.82_0.02_275)] md:text-base">
            Nexus keeps your team in sync from first task to final handoff.
            Assign work, track deadlines, and stay updated with real-time team notifications in one elegant workspace.
          </p>
          <div className="mt-7 inline-flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={() => navigate('/login')}>
              Get started
              <ArrowRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleViewFeaturesClick}
            >
              View features
            </Button>
          </div>
        </motion.section>

        <motion.section
          id="features"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4 }}
          className={`rounded-3xl border border-violet-300/20 bg-[linear-gradient(160deg,rgba(36,24,58,0.55),rgba(20,18,42,0.45))] p-5 shadow-2xl shadow-black/25 backdrop-blur-xl transition-[box-shadow,transform] duration-500 md:p-6 ${
            featuresHighlighted
              ? 'scale-[1.01] shadow-[0_0_0_1px_rgba(167,139,250,0.45),0_0_40px_rgba(167,139,250,0.35)]'
              : ''
          }`}
        >
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-violet-200/80">Why teams choose Nexus</p>
          <div className="space-y-3">
            <FeatureItem
              icon={<Users className="size-4 text-sky-300" />}
              title="Shared team command center"
              description="Invite teammates and keep collaboration scoped to the right workspace without extra admin overhead."
            />
            <FeatureItem
              icon={<CheckCircle2 className="size-4 text-emerald-300" />}
              title="Clear execution pipeline"
              description="Move work from to-do to done with assignee context, due dates, and focused status tracking."
            />
            <FeatureItem
              icon={<ShieldCheck className="size-4 text-violet-300" />}
              title="Secure and production-ready"
              description="JWT-protected APIs, workspace boundaries, and managed notifications built for real teams."
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
    <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
        {icon}
        {title}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
    </article>
  )
}

