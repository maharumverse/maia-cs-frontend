// Pemutus lingkaran pengalihan SSO. Kalau backend tetap menjawab 401 sesudah pengguna kembali
// dari SSO (misalnya cookie tidak sampai karena domain), pengalihan tanpa batas akan terjadi.
// Penanda ini hanya berisi waktu pengalihan terakhir, bukan token, dan hanya hidup selama tab.

const KEY = 'maia-cs:sso-redirect-at'
export const LOOP_WINDOW_MS = 15_000

export function markSsoRedirect(now = Date.now()): void {
  try {
    // eslint-disable-next-line no-restricted-globals -- penanda waktu, bukan token
    sessionStorage.setItem(KEY, String(now))
  } catch {
    // Penyimpanan bisa diblokir; tanpa penanda, pemutus lingkaran tidak aktif.
  }
}

export function clearSsoRedirectMark(): void {
  try {
    // eslint-disable-next-line no-restricted-globals -- penanda waktu, bukan token
    sessionStorage.removeItem(KEY)
  } catch {
    // Tidak ada yang perlu dibersihkan bila penyimpanan diblokir.
  }
}

export function isSsoRedirectLoop(now = Date.now()): boolean {
  try {
    // eslint-disable-next-line no-restricted-globals -- penanda waktu, bukan token
    const last = Number(sessionStorage.getItem(KEY))
    return Number.isFinite(last) && last > 0 && now - last < LOOP_WINDOW_MS
  } catch {
    return false
  }
}
