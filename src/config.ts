export type AuthMode = 'sso' | 'stopgap'

export interface AppConfig {
  // Origin backend saja, tanpa path dan tanpa slash di belakang. Klien menambahkan api/v1 sendiri.
  apiBaseUrl: string
  authMode: AuthMode
  // Hanya ada di mode sso.
  ssoLoginUrl: string | null
}

export class ConfigError extends Error {
  readonly problems: string[]

  constructor(problems: string[]) {
    super(`Konfigurasi build tidak valid: ${problems.join(' ')}`)
    this.name = 'ConfigError'
    this.problems = problems
  }
}

type Env = Record<string, string | boolean | undefined>

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

function text(env: Env, key: string): string {
  const value = env[key]
  return typeof value === 'string' ? value.trim() : ''
}

function isSecureOrLocal(url: URL): boolean {
  return url.protocol === 'https:' || (url.protocol === 'http:' && LOCAL_HOSTS.has(url.hostname))
}

function checkApiBaseUrl(raw: string): string[] {
  if (!raw) return ['VITE_API_BASE_URL kosong.']
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return ['VITE_API_BASE_URL bukan URL yang valid.']
  }
  if (!isSecureOrLocal(url)) return ['VITE_API_BASE_URL harus https (http hanya untuk localhost).']
  // Harus persis sebuah origin: URL.origin tidak memuat path, query, hash, atau slash penutup.
  if (raw !== url.origin) {
    return ['VITE_API_BASE_URL harus berupa origin saja, tanpa path dan tanpa slash di belakang.']
  }
  return []
}

function checkSsoLoginUrl(raw: string): string[] {
  if (!raw) return ['VITE_SSO_LOGIN_URL wajib diisi pada VITE_AUTH_MODE=sso.']
  try {
    if (!isSecureOrLocal(new URL(raw))) {
      return ['VITE_SSO_LOGIN_URL harus https (http hanya untuk localhost).']
    }
  } catch {
    return ['VITE_SSO_LOGIN_URL bukan URL yang valid.']
  }
  return []
}

// Memvalidasi env build. Dipakai browser saat start dan vite.config.ts saat build,
// supaya satu aturan yang sama menolak nilai salah di kedua tempat.
export function parseConfig(env: Env): AppConfig {
  const problems: string[] = []

  const apiBaseUrl = text(env, 'VITE_API_BASE_URL')
  problems.push(...checkApiBaseUrl(apiBaseUrl))

  const mode = text(env, 'VITE_AUTH_MODE')
  const authMode: AuthMode = mode === 'sso' ? 'sso' : 'stopgap'
  if (mode !== 'sso' && mode !== 'stopgap') {
    problems.push('VITE_AUTH_MODE harus sso atau stopgap.')
  }

  const ssoLoginUrl = text(env, 'VITE_SSO_LOGIN_URL')
  if (authMode === 'sso') problems.push(...checkSsoLoginUrl(ssoLoginUrl))

  if (problems.length > 0) throw new ConfigError(problems)

  return { apiBaseUrl, authMode, ssoLoginUrl: authMode === 'sso' ? ssoLoginUrl : null }
}

// Tidak di-memoize dengan sengaja: parsing murah, dan test bisa mengganti env per kasus.
export function getConfig(): AppConfig {
  return parseConfig(import.meta.env)
}
