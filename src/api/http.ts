import axios, { type AxiosInstance } from 'axios'
import { parseApiError } from '@/api/errors'

declare module 'axios' {
  interface AxiosRequestConfig {
    // Permintaan yang 401-nya adalah hasil normal (cek sesi, login, logout)
    // tidak boleh memicu penanganan sesi habis.
    skipUnauthorizedHandler?: boolean
  }
}

export const API_PREFIX = 'api/v1'

interface HttpOptions {
  onUnauthorized: () => void
  timeoutMs?: number
}

// Satu-satunya tempat origin dan awalan api/v1 digabung. Pemanggil memakai route
// relatif seperti 'auth/me' (api.rules.md, path.rules.md).
export function createHttp(apiBaseUrl: string, options: HttpOptions): AxiosInstance {
  const http = axios.create({
    baseURL: `${apiBaseUrl}/${API_PREFIX}`,
    withCredentials: true,
    timeout: options.timeoutMs ?? 30_000,
    headers: { Accept: 'application/json' },
  })

  http.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      const apiError = parseApiError(error)
      const skip = axios.isAxiosError(error) && error.config?.skipUnauthorizedHandler === true
      if (apiError.isUnauthenticated && !skip) options.onUnauthorized()
      return Promise.reject(apiError)
    },
  )

  return http
}
