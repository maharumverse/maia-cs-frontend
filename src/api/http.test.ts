import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/errors'
import { createHttp } from '@/api/http'

interface Reply {
  status: number
  data: unknown
}

function clientReplying(reply: Reply, onUnauthorized = vi.fn()) {
  const http = createHttp('https://api.example.com', { onUnauthorized })
  const seen: InternalAxiosRequestConfig[] = []
  http.defaults.adapter = (config) => {
    seen.push(config)
    const response = { ...reply, statusText: '', headers: {}, config } as AxiosResponse
    if (reply.status >= 400) {
      return Promise.reject(new AxiosError('gagal', 'ERR_BAD_REQUEST', config, {}, response))
    }
    return Promise.resolve(response)
  }
  return { http, onUnauthorized, seen }
}

const unauthenticated = {
  status: 401,
  data: { error: { code: 'UNAUTHENTICATED', message: 'Anda belum masuk', detail: null } },
}

describe('createHttp', () => {
  it('menggabungkan origin dan api/v1 di satu tempat dan mengirim cookie', async () => {
    const { http, seen } = clientReplying({ status: 200, data: {} })
    await http.get('auth/me')
    const [config] = seen
    expect(config?.baseURL).toBe('https://api.example.com/api/v1')
    expect(config?.url).toBe('auth/me')
    expect(config?.withCredentials).toBe(true)
  })

  it('menolak dengan ApiError bertipe dari envelope backend', async () => {
    const { http } = clientReplying({
      status: 409,
      data: { error: { code: 'SETTINGS_CONFLICT', message: 'Versi sudah berubah', detail: null } },
    })
    await expect(http.get('settings')).rejects.toMatchObject({ status: 409, code: 'SETTINGS_CONFLICT' })
    await expect(http.get('settings')).rejects.toBeInstanceOf(ApiError)
  })

  it('memanggil penanganan sesi habis pada 401 permintaan biasa', async () => {
    const { http, onUnauthorized } = clientReplying(unauthenticated)
    await expect(http.get('settings')).rejects.toBeInstanceOf(ApiError)
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it('tidak memanggilnya untuk permintaan yang 401-nya hasil normal', async () => {
    const { http, onUnauthorized } = clientReplying(unauthenticated)
    await expect(http.get('auth/me', { skipUnauthorizedHandler: true })).rejects.toBeInstanceOf(ApiError)
    expect(onUnauthorized).not.toHaveBeenCalled()
  })

  it('tidak memanggilnya untuk galat selain 401', async () => {
    const { http, onUnauthorized } = clientReplying({
      status: 403,
      data: { error: { code: 'FORBIDDEN', message: 'Anda tidak memiliki akses', detail: null } },
    })
    await expect(http.get('settings')).rejects.toBeInstanceOf(ApiError)
    expect(onUnauthorized).not.toHaveBeenCalled()
  })
})
