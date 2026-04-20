import { isTauri } from '@tauri-apps/api/core'
import { check } from '@tauri-apps/plugin-updater'
import { toast } from 'sonner'

type CheckOptions = {
  silentIfUpToDate?: boolean
}

let isCheckingForUpdate = false
let isInstallingUpdate = false

export async function checkForDesktopUpdate(options: CheckOptions = {}): Promise<void> {
  if (!isTauri()) return
  if (isCheckingForUpdate) return
  isCheckingForUpdate = true

  try {
    const update = await check()
    if (!update) {
      if (!options.silentIfUpToDate) {
        toast.success('You are up to date')
      }
      return
    }

    const updateLabel = `${update.currentVersion} -> ${update.version}`
    toast('New desktop update available', {
      description: `Version ${updateLabel} is ready to install.`,
      duration: 12000,
      action: {
        label: 'Install now',
        onClick: async () => {
          if (isInstallingUpdate) return
          isInstallingUpdate = true
          try {
            toast.message('Downloading update...', {
              description: 'Please keep Nexus Tasks open until installation finishes.',
            })
            await update.downloadAndInstall()
            toast.success('Update installed', {
              description: 'Restart Nexus Tasks to start using the new version.',
            })
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown updater error'
            toast.error('Update installation failed', { description: message })
          } finally {
            isInstallingUpdate = false
          }
        },
      },
      cancel: {
        label: 'Later',
        onClick: () => {
          toast.message('Update postponed', {
            description: 'You can install it anytime from Settings -> Check for updates.',
          })
        },
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown updater error'
    toast.error('Update check failed', { description: message })
  } finally {
    isCheckingForUpdate = false
  }
}

