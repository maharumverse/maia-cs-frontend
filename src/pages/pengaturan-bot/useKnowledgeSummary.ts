import { useQuery } from '@tanstack/react-query'
import { getHttp } from '@/api/client'
import type { Schemas } from '@/api/types'

export type KnowledgeSummary = Schemas['app__api__v1__knowledge__SummaryOut']

// Query terpisah dari pengaturan: galatnya hanya menghilangkan keterangan, tidak menghalangi form.
export function useKnowledgeSummary() {
  return useQuery({
    queryKey: ['pengaturan-bot', 'knowledge-summary'],
    queryFn: async () => (await getHttp().get<KnowledgeSummary>('knowledge/summary')).data,
  })
}
