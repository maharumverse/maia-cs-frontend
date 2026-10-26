// Path tujuan setelah login. Hanya path same-origin yang lolos, supaya parameter
// next tidak bisa dipakai untuk mengalihkan pengguna ke situs lain (security.rules.md).

export const LOGIN_PATH = '/masuk'

function hasControlOrBackslash(value: string): boolean {
  for (const char of value) {
    const code = char.charCodeAt(0)
    if (code <= 0x1f || code === 0x7f || char === '\\') return true
  }
  return false
}

// Mengembalikan path aman (path + query + hash) atau '/' bila nilainya tidak lolos.
// Karakter kontrol ditolak lebih dulu karena parser URL membuang tab dan newline,
// sehingga "/\t/evil.com" akan terbaca sebagai "//evil.com".
export function safeReturnPath(raw: string | null | undefined, origin: string): string {
  if (!raw || hasControlOrBackslash(raw)) return '/'
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/'

  let url: URL
  try {
    url = new URL(raw, origin)
  } catch {
    return '/'
  }
  if (url.origin !== origin) return '/'
  if (url.pathname === LOGIN_PATH) return '/'

  return `${url.pathname}${url.search}${url.hash}`
}

export function loginPathFor(returnPath: string): string {
  if (returnPath === '/') return LOGIN_PATH
  return `${LOGIN_PATH}?next=${encodeURIComponent(returnPath)}`
}

// URL halaman login SSO bersama. Parameter next berisi alamat lengkap halaman asal
// di origin aplikasi ini, supaya SSO bisa mengembalikan pengguna ke sana.
export function ssoLoginUrlFor(ssoLoginUrl: string, returnPath: string, origin: string): string {
  const url = new URL(ssoLoginUrl)
  url.searchParams.set('next', `${origin}${safeReturnPath(returnPath, origin)}`)
  return url.toString()
}
