import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { getHttp } from '@/api/client'
import type { Page, Schemas } from '@/api/types'

export type KnowledgeDoc = Schemas['DocumentOut']
export type KnowledgeSection = Schemas['SectionOut']
export type KnowledgeSummary = Schemas['app__api__v1__knowledge__SummaryOut']
export type UploadResult = Schemas['UploadResult']
export type DocStatus = KnowledgeDoc['status']

export const POLL_MS = 3000

export interface ListParams {
  q?: string
  status?: DocStatus
  is_active?: boolean
  limit: number
  offset: number
}

const root = ['knowledge'] as const

export function useDocuments(params: ListParams) {
  return useQuery({
    queryKey: [...root, 'documents', params],
    queryFn: async () => (await getHttp().get<Page<KnowledgeDoc>>('knowledge/documents', { params })).data,
    placeholderData: (previous) => previous,
    // Selama ada dokumen yang masih diproses, daftar dimuat ulang; berhenti begitu semuanya selesai.
    refetchInterval: (query) => (query.state.data?.items.some((item) => item.status === 'processing') ? POLL_MS : false),
  })
}

export function useSummary() {
  return useQuery({
    queryKey: [...root, 'summary'],
    queryFn: async () => (await getHttp().get<KnowledgeSummary>('knowledge/summary')).data,
    refetchInterval: (query) => ((query.state.data?.processing_documents ?? 0) > 0 ? POLL_MS : false),
  })
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: [...root, 'document', id],
    queryFn: async () => (await getHttp().get<KnowledgeDoc>(`knowledge/documents/${id}`)).data,
  })
}

export function useContent(id: string, enabled: boolean) {
  return useQuery({
    queryKey: [...root, 'content', id],
    queryFn: async () => (await getHttp().get<Schemas['ContentOut']>(`knowledge/documents/${id}/content`)).data,
    enabled,
  })
}

export function useSections(id: string, limit: number, offset: number, enabled: boolean) {
  return useQuery({
    queryKey: [...root, 'sections', id, limit, offset],
    queryFn: async () => (await getHttp().get<Page<KnowledgeSection>>(`knowledge/documents/${id}/sections`, { params: { limit, offset } })).data,
    placeholderData: (previous) => previous,
    enabled,
  })
}

// Unggah banyak berkas dalam satu permintaan multipart; hasilnya per berkas.
export async function uploadFiles(files: File[]): Promise<UploadResult[]> {
  const form = new FormData()
  for (const file of files) form.append('files', file, file.name)
  const response = await getHttp().post<Schemas['UploadResponse']>('knowledge/documents', form)
  return response.data.results
}

// Aksi per baris (aktif/nonaktif, proses ulang, hapus): satu dokumen sibuk sendiri-sendiri,
// galat ditampung untuk ditampilkan, dan semua data knowledge dimuat ulang setelah berhasil.
export function useRowActions() {
  const client = useQueryClient()
  const [busy, setBusy] = useState<ReadonlySet<string>>(new Set())
  const [error, setError] = useState<unknown>(null)
  const [info, setInfo] = useState<string | null>(null)

  const refresh = useCallback(() => client.invalidateQueries({ queryKey: root }), [client])

  const run = useCallback(
    async (id: string, task: () => Promise<unknown>, done?: string): Promise<boolean> => {
      setError(null)
      setInfo(null)
      setBusy((current) => new Set(current).add(id))
      try {
        await task()
        if (done) setInfo(done)
        await refresh()
        return true
      } catch (caught) {
        setError(caught)
        return false
      } finally {
        setBusy((current) => {
          const next = new Set(current)
          next.delete(id)
          return next
        })
      }
    },
    [refresh],
  )

  const toggle = useCallback((doc: KnowledgeDoc, active: boolean) => run(doc.id, () => getHttp().patch(`knowledge/documents/${doc.id}`, { is_active: active })), [run])
  const reingest = useCallback(
    (doc: KnowledgeDoc) => run(doc.id, () => getHttp().post(`knowledge/documents/${doc.id}/reingest`), `Proses ulang dimulai untuk ${doc.original_filename}.`),
    [run],
  )
  const remove = useCallback((doc: KnowledgeDoc) => run(doc.id, () => getHttp().delete(`knowledge/documents/${doc.id}`), `${doc.original_filename} dihapus.`), [run])
  const dismiss = useCallback(() => {
    setError(null)
    setInfo(null)
  }, [])

  return { busy, error, info, toggle, reingest, remove, dismiss, refresh }
}
