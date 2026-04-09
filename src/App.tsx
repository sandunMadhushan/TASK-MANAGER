import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { Toaster } from '@/components/ui/sonner'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { LoginPage } from '@/pages/LoginPage'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { SettingsPage } from '@/pages/SettingsPage'
import { TasksPage } from '@/pages/TasksPage'
import { TeamPage } from '@/pages/TeamPage'
import { useAuthStore } from '@/store/auth-store'
import { useSettingsStore } from '@/store/settings-store'
import { useTaskStore } from '@/store/task-store'

function App() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const bootstrap = useAuthStore((s) => s.bootstrap)
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping)
  const fetchTasks = useTaskStore((s) => s.fetchTasks)
  const fetchUsers = useTaskStore((s) => s.fetchUsers)
  const reducedMotion = useSettingsStore((s) => s.reducedMotion)
  const location = useLocation()

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  useEffect(() => {
    if (!currentUser) return
    void fetchTasks()
    void fetchUsers()
  }, [currentUser, fetchTasks, fetchUsers])

  useEffect(() => {
    const pageTitleByPath: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/tasks': 'Tasks',
      '/team': 'Team',
      '/notifications': 'Notifications',
      '/profile': 'Profile',
      '/settings': 'Settings',
    }
    const section = pageTitleByPath[location.pathname] ?? 'Dashboard'
    document.title = `${section} | Nexus Tasks`
  }, [location.pathname])

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reducedMotion)
  }, [reducedMotion])

  if (isBootstrapping) {
    return <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">Loading session...</div>
  }

  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={currentUser ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route
          path="/*"
          element={
            !currentUser ? (
              <Navigate to="/login" replace />
            ) : (
              <DashboardLayout>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/tasks" element={<TasksPage />} />
                  <Route path="/team" element={<TeamPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </DashboardLayout>
            )
          }
        />
      </Routes>
      <Toaster />
    </>
  )
}

export default App
