import { describe, expect, it } from 'vitest'
import { ConfigError, parseConfig } from '@/config'

const valid = { VITE_API_BASE_URL: 'https://api.example.com', VITE_AUTH_MODE: 'stopgap' }

describe('parseConfig', () => {
  it('menerima origin https dan mode stopgap', () => {
    expect(parseConfig(valid)).toEqual({
      apiBaseUrl: 'https://api.example.com',
      authMode: 'stopgap',
      ssoLoginUrl: null,
    })
  })

  it('menerima http hanya untuk localhost', () => {
    expect(parseConfig({ ...valid, VITE_API_BASE_URL: 'http://localhost:8080' }).apiBaseUrl).toBe('http://localhost:8080')
    expect(() => parseConfig({ ...valid, VITE_API_BASE_URL: 'http://api.example.com' })).toThrow(ConfigError)
  })

  it.each([
    ['kosong', ''],
    ['bukan URL', 'api.example.com'],
    ['membawa path', 'https://api.example.com/api'],
    ['membawa route', 'https://api.example.com/api/v1'],
    ['slash di belakang', 'https://api.example.com/'],
  ])('menolak VITE_API_BASE_URL yang %s', (_label, value) => {
    expect(() => parseConfig({ ...valid, VITE_API_BASE_URL: value })).toThrow(ConfigError)
  })

  it('menolak mode autentikasi yang tidak dikenal', () => {
    expect(() => parseConfig({ ...valid, VITE_AUTH_MODE: 'dev' })).toThrow(ConfigError)
    expect(() => parseConfig({ VITE_API_BASE_URL: valid.VITE_API_BASE_URL })).toThrow(ConfigError)
  })

  it('mewajibkan URL login SSO pada mode sso', () => {
    expect(() => parseConfig({ ...valid, VITE_AUTH_MODE: 'sso' })).toThrow(ConfigError)
    const config = parseConfig({ ...valid, VITE_AUTH_MODE: 'sso', VITE_SSO_LOGIN_URL: 'https://sso.example.com/login' })
    expect(config.authMode).toBe('sso')
    expect(config.ssoLoginUrl).toBe('https://sso.example.com/login')
  })

  it('mengabaikan URL SSO pada mode stopgap', () => {
    expect(parseConfig({ ...valid, VITE_SSO_LOGIN_URL: 'https://sso.example.com/login' }).ssoLoginUrl).toBeNull()
  })

  it('melaporkan semua masalah sekaligus', () => {
    try {
      parseConfig({})
      expect.unreachable()
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigError)
      expect((error as ConfigError).problems.length).toBeGreaterThanOrEqual(2)
    }
  })
})
