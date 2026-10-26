import { AxiosError, CanceledError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { describe, expect, it } from 'vitest'
import {
  ApiError,
  CANCELED,
  INVALID_RESPONSE,
  NETWORK_ERROR,
  TIMEOUT,
  UNKNOWN_ERROR,
  parseApiError,
  userMessage,
} from '@/api/errors'

const config = { headers: {} } as InternalAxiosRequestConfig

function httpError(status: number, data: unknown): AxiosError {
  const response = { status, statusText: '', headers: {}, config, data } as AxiosResponse
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, {}, response)
}

describe('parseApiError', () => {
  it('membaca envelope error standar dengan code, message, dan detail', () => {
    const error = parseApiError(
      httpError(422, {
        error: { code: 'VALIDATION_ERROR', message: 'Data yang dikirim tidak valid', detail: [{ loc: ['body'] }] },
      }),
    )
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(422)
    expect(error.code).toBe('VALIDATION_ERROR')
    expect(error.message).toBe('Data yang dikirim tidak valid')
    expect(error.detail).toEqual([{ loc: ['body'] }])
  })

  it('mengisi detail dengan null bila envelope tidak membawanya', () => {
    const error = parseApiError(httpError(404, { error: { code: 'NOT_FOUND', message: 'Data tidak ditemukan' } }))
    expect(error.detail).toBeNull()
  })

  it('menandai 401 sebagai belum masuk', () => {
    const error = parseApiError(httpError(401, { error: { code: 'UNAUTHENTICATED', message: 'Anda belum masuk', detail: null } }))
    expect(error.isUnauthenticated).toBe(true)
    expect(error.isNetworkError).toBe(false)
  })

  it('menolak respons yang bukan envelope, misalnya HTML hasil fallback SPA', () => {
    const error = parseApiError(httpError(200, '<!doctype html><html></html>'))
    expect(error.code).toBe(INVALID_RESPONSE)
    expect(error.status).toBe(200)
  })

  it.each([
    ['objek tanpa error', { message: 'x' }],
    ['error tanpa code', { error: { message: 'x' } }],
    ['error dengan tipe salah', { error: { code: 1, message: 2 } }],
    ['error berupa string', { error: 'gagal' }],
    ['null', null],
  ])('menganggap %s sebagai respons tidak dikenali', (_label, body) => {
    expect(parseApiError(httpError(500, body)).code).toBe(INVALID_RESPONSE)
  })

  it('memetakan kegagalan jaringan ke status 0', () => {
    const error = parseApiError(new AxiosError('Network Error', 'ERR_NETWORK', config))
    expect(error.status).toBe(0)
    expect(error.code).toBe(NETWORK_ERROR)
    expect(error.isNetworkError).toBe(true)
  })

  it('memetakan timeout', () => {
    expect(parseApiError(new AxiosError('timeout', 'ECONNABORTED', config)).code).toBe(TIMEOUT)
  })

  it('memetakan pembatalan', () => {
    expect(parseApiError(new CanceledError()).code).toBe(CANCELED)
  })

  it('membungkus galat non-axios', () => {
    expect(parseApiError(new Error('boom')).code).toBe(UNKNOWN_ERROR)
    expect(parseApiError('teks').code).toBe(UNKNOWN_ERROR)
  })

  it('mengembalikan ApiError yang sama tanpa membungkus ulang', () => {
    const original = new ApiError(403, 'FORBIDDEN', 'Anda tidak memiliki akses')
    expect(parseApiError(original)).toBe(original)
  })
})

describe('userMessage', () => {
  it('tidak menampilkan status atau kode mentah untuk kegagalan jaringan dan server', () => {
    expect(userMessage(new ApiError(0, NETWORK_ERROR, 'x'))).toBe(
      'Tidak bisa menghubungi server. Periksa koneksi, lalu coba lagi.',
    )
    expect(userMessage(new ApiError(503, 'INTERNAL_ERROR', 'x'))).toBe(
      'Server sedang bermasalah. Coba lagi sebentar lagi.',
    )
  })

  it('memakai pesan Bahasa Indonesia dari backend untuk galat 4xx', () => {
    expect(userMessage(new ApiError(403, 'FORBIDDEN', 'Anda tidak memiliki akses'))).toBe('Anda tidak memiliki akses')
  })
})
