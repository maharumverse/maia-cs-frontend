import { describe, expect, it } from 'vitest'
import { loginPathFor, safeReturnPath, ssoLoginUrlFor } from '@/lib/returnUrl'

const ORIGIN = 'https://cs.example.com'

describe('safeReturnPath', () => {
  it.each([
    ['/', '/'],
    ['/percakapan', '/percakapan'],
    ['/percakapan?hal=2&urut=nama', '/percakapan?hal=2&urut=nama'],
    ['/knowledge#bagian', '/knowledge#bagian'],
    ['/pengaturan-bot?tab=versi', '/pengaturan-bot?tab=versi'],
  ])('meloloskan path same-origin %s', (raw, expected) => {
    expect(safeReturnPath(raw, ORIGIN)).toBe(expected)
  })

  it.each([
    ['URL absolut ke situs lain', 'https://evil.example/phish'],
    ['URL absolut ke origin sendiri', 'https://cs.example.com/percakapan'],
    ['protocol-relative', '//evil.example'],
    ['protocol-relative dengan tab', '/\t/evil.example'],
    ['protocol-relative dengan newline', '/\n/evil.example'],
    ['backslash', '/\\evil.example'],
    ['skema javascript', 'javascript:alert(1)'],
    ['skema data', 'data:text/html,<script>alert(1)</script>'],
    ['tanpa slash awal', 'percakapan'],
    ['karakter kontrol', '/percakapan\u0000'],
    ['string kosong', ''],
    ['null', null],
    ['undefined', undefined],
  ])('menolak %s', (_label, raw) => {
    expect(safeReturnPath(raw, ORIGIN)).toBe('/')
  })

  it('tidak mengembalikan pengguna ke halaman login', () => {
    expect(safeReturnPath('/masuk', ORIGIN)).toBe('/')
    expect(safeReturnPath('/masuk?next=%2Fpercakapan', ORIGIN)).toBe('/')
  })
})

describe('loginPathFor', () => {
  it('membawa path asal, lengkap dengan query, dalam parameter next', () => {
    expect(loginPathFor('/percakapan?hal=2')).toBe('/masuk?next=%2Fpercakapan%3Fhal%3D2')
  })

  it('tidak menambah next untuk halaman utama', () => {
    expect(loginPathFor('/')).toBe('/masuk')
  })
})

describe('ssoLoginUrlFor', () => {
  it('mengirim alamat lengkap halaman asal di origin aplikasi sebagai next', () => {
    const url = new URL(ssoLoginUrlFor('https://sso.example.com/login', '/percakapan?hal=2', ORIGIN))
    expect(url.origin).toBe('https://sso.example.com')
    expect(url.pathname).toBe('/login')
    expect(url.searchParams.get('next')).toBe('https://cs.example.com/percakapan?hal=2')
  })

  it('jatuh ke halaman utama bila path asal tidak aman', () => {
    const url = new URL(ssoLoginUrlFor('https://sso.example.com/login', '//evil.example', ORIGIN))
    expect(url.searchParams.get('next')).toBe('https://cs.example.com/')
  })

  it('mempertahankan parameter yang sudah ada di URL SSO', () => {
    const url = new URL(ssoLoginUrlFor('https://sso.example.com/login?app=cs', '/', ORIGIN))
    expect(url.searchParams.get('app')).toBe('cs')
    expect(url.searchParams.get('next')).toBe('https://cs.example.com/')
  })
})
