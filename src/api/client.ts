import type { AxiosInstance } from 'axios'
import { QueryClient } from '@tanstack/react-query'
import { createHttp } from '@/api/http'
import { ApiError } from '@/api/errors'
import { getConfig } from '@/config'

export const SESSION_KEY = ['session'] as const

// Satu QueryClient untuk seluruh aplikasi. Error 4xx tidak diulang karena hasilnya sama.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status >= 400 && error.status < 500) && failureCount < 1,
    },
  },
})

// Penanganan 401 terpusat: semua permintaan yang ditolak karena sesi habis menjatuhkan
// sesi di cache, dan guard rute yang mengalihkan ke login atau SSO.
export function dropSession(): void {
  queryClient.setQueryData(SESSION_KEY, null)
}

let instance: AxiosInstance | undefined

export function getHttp(): AxiosInstance {
  instance ??= createHttp(getConfig().apiBaseUrl, { onUnauthorized: dropSession })
  return instance
}
