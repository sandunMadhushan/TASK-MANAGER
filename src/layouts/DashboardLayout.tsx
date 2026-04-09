import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'

import { AppSidebar } from '@/components/layout/AppSidebar'
import { TopNav } from '@/components/layout/TopNav'
import { cn } from '@/lib/utils'

type DashboardLayoutProps = {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[oklch(0.1_0.03_275)]"
      />
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

      <AnimatePresence>
        {mobileNavOpen ? (
          <motion.button
            animate={{ opacity: 1 }}
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            type="button"
            onClick={() => setMobileNavOpen(false)}
          />
        ) : null}
      </AnimatePresence>

      <div className="flex min-h-dvh">
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-[min(18rem,88vw)] transition-transform duration-300 md:static md:z-0 md:w-64 md:translate-x-0 md:transition-none',
            mobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          )}
        >
          <AppSidebar onNavigate={() => setMobileNavOpen(false)} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col md:pl-0">
          <TopNav onMenuClick={() => setMobileNavOpen((o) => !o)} />
          <main className="flex-1 px-4 pb-10 pt-2 md:px-8 md:pt-4">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
