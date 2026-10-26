import axios from 'axios'

// Bentuk error standar backend (api.rules.md):
// { "error": { "code": "...", "message": "...", "detail": ... } }
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly detail: unknown

  constructor(status: number, code: string, message: string, detail: unknown = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.detail = detail
  }

  get isUnauthenticated(): boolean {
    return this.status === 401
  }

  get isNetworkError(): boolean {
    return this.status === 0
  }
}

export const NETWORK_ERROR = 'NETWORK_ERROR'
export const TIMEOUT = 'TIMEOUT'
export const CANCELED = 'CANCELED'
export const INVALID_RESPONSE = 'INVALID_RESPONSE'
export const UNKNOWN_ERROR = 'UNKNOWN_ERROR'

interface Envelope {
  code: string
  message: string
  detail: unknown
}

function readEnvelope(data: unknown): Envelope | null {
  if (typeof data !== 'object' || data === null || !('error' in data)) return null
  const inner = data.error
  if (typeof inner !== 'object' || inner === null) return null
  const { code, message, detail } = inner as Record<string, unknown>
  if (typeof code !== 'string' || typeof message !== 'string') return null
  return { code, message, detail: detail ?? null }
}

// Mengubah apa pun yang dilempar axios (atau kode lain) menjadi ApiError.
// Respons yang bukan envelope error, misalnya HTML hasil fallback SPA, tetap
// membawa status HTTP aslinya dengan kode INVALID_RESPONSE.
export function parseApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (axios.isCancel(error)) {
    return new ApiError(0, CANCELED, 'Permintaan dibatalkan.')
  }

  if (axios.isAxiosError(error)) {
    const response = error.response
    if (response) {
      const envelope = readEnvelope(response.data)
      if (envelope) {
        return new ApiError(response.status, envelope.code, envelope.message, envelope.detail)
      }
      return new ApiError(response.status, INVALID_RESPONSE, 'Respons server tidak dikenali.')
    }
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ApiError(0, TIMEOUT, 'Server terlalu lama menjawab.')
    }
    return new ApiError(0, NETWORK_ERROR, 'Tidak bisa menghubungi server.')
  }

  return new ApiError(0, UNKNOWN_ERROR, 'Terjadi kesalahan yang tidak terduga.')
}

// Kalimat untuk pengguna: tidak pernah menampilkan status HTTP atau kode mentah.
export function userMessage(error: ApiError): string {
  if (error.isNetworkError) return 'Tidak bisa menghubungi server. Periksa koneksi, lalu coba lagi.'
  if (error.status >= 500) return 'Server sedang bermasalah. Coba lagi sebentar lagi.'
  if (error.code === INVALID_RESPONSE) return 'Respons server tidak dikenali. Hubungi admin sistem.'
  return error.message
}
