import { useQuery } from '@tanstack/react-query'
import { getHttp } from '@/api/client'
import { ApiError, userMessage } from '@/api/errors'
import type { WhatsAppStatus } from './types'

export const STATUS_KEY = ['channels', 'whatsapp', 'status'] as const
export const STATUS_POLL_MS = 5000
export const BAILEYS_PATH = 'channels/whatsapp/baileys'

// Selama Baileys belum tersambung, admin sedang menunggu sambungan (memindai QR atau menyambung
// ulang), jadi status dimuat ulang tiap 5 detik. Berhenti sendiri saat tersambung atau saat
// halaman dilepas, karena refetchInterval hanya jalan selagi ada pengamatnya.
export function useWhatsAppStatus() {
  return useQuery({
    queryKey: STATUS_KEY,
    queryFn: async () => (await getHttp().get<WhatsAppStatus>('channels/whatsapp/status')).data,
    refetchInterval: (query) => {
      const data = query.state.data
      return data?.provider === 'baileys' && data.baileys.state !== 'connected' ? STATUS_POLL_MS : false
    },
  })
}

// Service Baileys mengirim kalimat yang aman ditampilkan; galat lain memakai kalimat umum.
export function baileysMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.code === 'BAILEYS_ERROR' || error.code === 'NOT_CONFIGURED' ? error.message : userMessage(error)
  }
  return 'Terjadi kesalahan yang tidak terduga.'
}
