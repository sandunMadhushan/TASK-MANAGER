import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { DashboardLayout } from '@/layouts/DashboardLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { TasksPage } from '@/pages/TasksPage'
import { TeamPage } from '@/pages/TeamPage'
import { Toaster } from '@/components/ui/sonner'
import { useSettingsStore } from '@/store/settings-store'
import { useTaskStore } from '@/store/task-store'

function App() {
  const fetchTasks = useTaskStore((s) => s.fetchTasks)
  const fetchUsers = useTaskStore((s) => s.fetchUsers)
  const reducedMotion = useSettingsStore((s) => s.reducedMotion)
  const location = useLocation()

  useEffect(() => {
    void fetchTasks()
    void fetchUsers()
  }, [fetchTasks, fetchUsers])

  useEffect(() => {
    const pageTitleByPath: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/tasks': 'Tasks',
      '/team': 'Team',
      '/notifications': 'Notifications',
      '/settings': 'Settings',
    }
    const section = pageTitleByPath[location.pathname] ?? 'Dashboard'
    document.title = `${section} | Nexus Tasks`
  }, [location.pathname])

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reducedMotion)
  }, [reducedMotion])

  return (
    <>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </DashboardLayout>
      <Toaster />
    </>
  )
}

export default App
