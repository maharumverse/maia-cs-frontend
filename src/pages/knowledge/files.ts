import type { UploadResult } from '@/pages/knowledge/api'

// Pemeriksaan di klien hanya kenyamanan agar berkas yang jelas salah tidak dikirim.
// Server tetap otoritas atas ekstensi, ukuran, dan isi.
export const MAX_FILES = 20
// Batas atas yang bisa diatur admin di backend (max_upload_bytes); batas sebenarnya dicek server.
export const CLIENT_MAX_BYTES = 20_000_000
const ALLOWED = ['.md', '.txt']

export function extensionOk(name: string): boolean {
  const lower = name.toLowerCase()
  return ALLOWED.some((ext) => lower.endsWith(ext))
}

export function rejectLocally(file: File): UploadResult | null {
  if (!extensionOk(file.name)) {
    return { filename: file.name, outcome: 'rejected', error: { code: 'UNSUPPORTED_EXTENSION', message: 'Hanya berkas .md dan .txt yang diterima' } }
  }
  if (file.size > CLIENT_MAX_BYTES) {
    return { filename: file.name, outcome: 'rejected', error: { code: 'FILE_TOO_LARGE', message: 'Ukuran berkas terlalu besar' } }
  }
  return null
}

export const OUTCOME_LABELS: Record<UploadResult['outcome'], string> = {
  created: 'Dibuat',
  updated: 'Diperbarui',
  unchanged: 'Tidak berubah',
  rejected: 'Ditolak',
}

export const STATUS_LABELS = { processing: 'Diproses', ready: 'Siap', failed: 'Gagal' } as const
export const STATUS_TONES = { processing: 't-info', ready: 't-ok', failed: 't-bad' } as const
