import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { Toaster } from '@/components/ui/sonner'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
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
      '/': 'Home',
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
          path="/"
          element={currentUser ? <Navigate to="/dashboard" replace /> : <HomePage />}
        />
        <Route
          path="/login"
          element={currentUser ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route
          path="/reset-password"
          element={currentUser ? <Navigate to="/dashboard" replace /> : <ResetPasswordPage />}
        />
        <Route
          path="/dashboard"
          element={
            !currentUser ? (
              <Navigate to="/" replace />
            ) : (
              <DashboardLayout>
                <DashboardPage />
              </DashboardLayout>
            )
          }
        />
        <Route
          path="/tasks"
          element={
            !currentUser ? (
              <Navigate to="/" replace />
            ) : (
              <DashboardLayout>
                <TasksPage />
              </DashboardLayout>
            )
          }
        />
        <Route
          path="/team"
          element={
            !currentUser ? (
              <Navigate to="/" replace />
            ) : (
              <DashboardLayout>
                <TeamPage />
              </DashboardLayout>
            )
          }
        />
        <Route
          path="/notifications"
          element={
            !currentUser ? (
              <Navigate to="/" replace />
            ) : (
              <DashboardLayout>
                <NotificationsPage />
              </DashboardLayout>
            )
          }
        />
        <Route
          path="/profile"
          element={
            !currentUser ? (
              <Navigate to="/" replace />
            ) : (
              <DashboardLayout>
                <ProfilePage />
              </DashboardLayout>
            )
          }
        />
        <Route
          path="/settings"
          element={
            !currentUser ? (
              <Navigate to="/" replace />
            ) : (
              <DashboardLayout>
                <SettingsPage />
              </DashboardLayout>
            )
          }
        />
        <Route path="*" element={<Navigate to={currentUser ? '/dashboard' : '/'} replace />} />
      </Routes>
      <Toaster />
    </>
  )
}

export default App
