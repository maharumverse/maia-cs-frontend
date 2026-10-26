import { ApiError } from '@/api/errors'

// Satu kalimat per kondisi yang menyebut langkah berikutnya (login.component.md).
// Pesan mentah backend tidak pernah ditampilkan, dan tidak ada petunjuk bagian mana yang salah.
export function loginErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Server sedang bermasalah. Coba lagi sebentar lagi.'
  if (error.isNetworkError) return 'Tidak bisa menghubungi server. Periksa koneksi, lalu coba lagi.'
  if (error.status === 429) {
    return 'Terlalu banyak percobaan masuk. Tunggu beberapa menit, lalu coba lagi.'
  }
  if (error.status === 401) return 'NIP atau kata sandi salah. Periksa lagi, lalu coba masuk.'
  return 'Server sedang bermasalah. Coba lagi sebentar lagi.'
}
