import { invoke, isTauri } from '@tauri-apps/api/core'
import { check } from '@tauri-apps/plugin-updater'
import { toast } from 'sonner'

type CheckOptions = {
  silentIfUpToDate?: boolean
}

let isCheckingForUpdate = false
let isInstallingUpdate = false

const WINDOWS_TARGET_MSI = 'windows-x86_64-msi'
const WINDOWS_TARGET_EXE = 'windows-x86_64-exe'
const WINDOWS_TARGET_FALLBACK = 'windows-x86_64'

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message
  if (typeof error === 'string' && error.trim()) return error
  try {
    const asJson = JSON.stringify(error)
    if (asJson && asJson !== '{}') return asJson
  } catch {
    // fall through
  }
  return 'Unknown updater error'
}

async function resolveUpdaterTarget(): Promise<string | undefined> {
  if (!isTauri()) return undefined
  try {
    return await invoke<string>('detect_windows_installer_target')
  } catch {
    return undefined
  }
}

async function resolveUpdaterTargets(): Promise<string[]> {
  const detected = await resolveUpdaterTarget()
  const ordered = [detected, WINDOWS_TARGET_MSI, WINDOWS_TARGET_EXE, WINDOWS_TARGET_FALLBACK].filter(
    (target): target is string => Boolean(target)
  )
  return [...new Set(ordered)]
}

export async function checkForDesktopUpdate(options: CheckOptions = {}): Promise<void> {
  if (!isTauri()) return
  if (isCheckingForUpdate) return
  isCheckingForUpdate = true

  try {
    const targets = await resolveUpdaterTargets()
    let selectedTarget: string | undefined
    let update = null as Awaited<ReturnType<typeof check>> | null
    for (const target of targets) {
      const candidate = await check({ target })
      if (candidate) {
        selectedTarget = target
        update = candidate
        break
      }
    }

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
            const retryTarget =
              selectedTarget === WINDOWS_TARGET_MSI ? WINDOWS_TARGET_EXE : WINDOWS_TARGET_MSI
            try {
              const retryUpdate = await check({ target: retryTarget })
              if (retryUpdate) {
                toast.message('Retrying update...', {
                  description: `Primary installer failed. Trying ${retryTarget} package.`,
                })
                await retryUpdate.downloadAndInstall()
                toast.success('Update installed', {
                  description: 'Restart Nexus Tasks to start using the new version.',
                })
                return
              }
            } catch {
              // show original error below
            }
            toast.error('Update installation failed', { description: errorMessage(error) })
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
    toast.error('Update check failed', { description: errorMessage(error) })
  } finally {
    isCheckingForUpdate = false
  }
}

