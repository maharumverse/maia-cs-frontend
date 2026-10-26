import { useQuery } from '@tanstack/react-query'
import { getHttp } from '@/api/client'
import type { Schemas } from '@/api/types'
import type { ConversationFilters } from '@/pages/percakapan/filters'

export type ConversationItem = Schemas['ConversationItem']
export type ConversationPage = Schemas['ConversationPage']
export type ConversationDetail = Schemas['ConversationDetail']
export type MessageOut = Schemas['MessageOut']

export interface ListParams extends ConversationFilters {
  sort: string
  limit: number
  offset: number
}

export function useConversations(params: ListParams) {
  return useQuery({
    queryKey: ['conversations', params],
    queryFn: async () => (await getHttp().get<ConversationPage>('conversations', { params })).data,
    // Ganti halaman atau filter menjaga baris lama sampai data baru datang.
    placeholderData: (previous) => previous,
  })
}

export function useConversation(id: string | undefined) {
  return useQuery({
    queryKey: ['conversation', id],
    queryFn: async () => (await getHttp().get<ConversationDetail>(`conversations/${id ?? ''}`)).data,
    enabled: id !== undefined,
  })
}

// Nomor lengkap sengaja tidak lewat useQuery/useMutation: hasilnya tidak boleh tinggal di cache.
// Pemanggil menyimpannya di state komponen saja.
export async function revealNumber(id: string): Promise<string | null> {
  const response = await getHttp().post<{ number: string | null }>(`conversations/${id}/reveal-number`)
  return response.data.number
}

export type ExportFormat = 'csv' | 'json'

export async function fetchExport(filters: ConversationFilters, format: ExportFormat): Promise<Blob> {
  const response = await getHttp().get<Blob>('conversations/export', {
    params: { ...filters, format },
    responseType: 'blob',
  })
  return response.data
}
