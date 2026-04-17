/** Trimmed Vite env string, or undefined if missing/blank. */
export function envString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const t = value.trim()
  return t || undefined
}

function isLocalhostUrl(url: string): boolean {
  try {
    const u = new URL(url)
    const h = u.hostname.toLowerCase()
    return h === 'localhost' || h === '127.0.0.1' || h === '[::1]'
  } catch {
    return /\blocalhost\b|127\.0\.0\.1/i.test(url)
  }
}

/**
 * API base URL. Production builds must set `VITE_API_URL` to a public URL (e.g. in `.env.production`).
 * Local dev falls back to the API on port 4000.
 */
export function resolveApiBaseUrl(): string {
  const fromEnv = envString(import.meta.env.VITE_API_URL)
  if (fromEnv) {
    if (import.meta.env.PROD && isLocalhostUrl(fromEnv)) {
      throw new Error(
        'VITE_API_URL cannot use localhost in production builds. Set a public API URL in .env.production (it overrides .env for vite build).'
      )
    }
    return fromEnv
  }
  if (import.meta.env.DEV) return 'http://localhost:4000/api'
  throw new Error(
    'VITE_API_URL is required for production builds. Add it to .env.production (e.g. VITE_API_URL=https://api.yourdomain.com/api).'
  )
}

function assertProdNotLocalhost(url: string, envKey: string) {
  if (import.meta.env.PROD && isLocalhostUrl(url)) {
    throw new Error(
      `${envKey} cannot use localhost in production builds. Set a public URL in .env.production.`
    )
  }
}

/** Novu bridge URL; production builds must not use localhost (set in `.env.production`). */
export function resolveNovuBackendUrl(): string {
  const fromEnv = envString(import.meta.env.VITE_NOVU_BACKEND_URL)
  if (fromEnv) {
    assertProdNotLocalhost(fromEnv, 'VITE_NOVU_BACKEND_URL')
    return fromEnv
  }
  return import.meta.env.DEV ? 'http://localhost:5000' : ''
}

/** Novu WebSocket URL; production builds must not use localhost (set in `.env.production`). */
export function resolveNovuSocketUrl(): string {
  const fromEnv = envString(import.meta.env.VITE_NOVU_SOCKET_URL)
  if (fromEnv) {
    assertProdNotLocalhost(fromEnv, 'VITE_NOVU_SOCKET_URL')
    return fromEnv
  }
  return import.meta.env.DEV ? 'ws://localhost:3002' : ''
}
