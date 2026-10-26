import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getHttp } from '@/api/client'
import type { BotSettings, Schemas, SettingsOut } from '@/api/types'

export const SETTINGS_KEY = ['settings'] as const
export const VERSIONS_KEY = ['settings', 'versions'] as const

export function useSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: async () => (await getHttp().get<SettingsOut>('settings')).data,
  })
}

interface SaveInput {
  data: BotSettings
  baseVersion: number
  note?: string
}

// Menyimpan seluruh pengaturan sebagai versi baru. Bila orang lain sudah menyimpan lebih dulu,
// backend menjawab 409 SETTINGS_CONFLICT dan halaman harus memuat ulang sebelum mencoba lagi.
export function useSaveSettings() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ data, baseVersion, note }: SaveInput) =>
      (
        await getHttp().put<SettingsOut>('settings', {
          base_version: baseVersion,
          data,
          change_note: note?.trim() || null,
        })
      ).data,
    onSuccess: (saved) => {
      client.setQueryData(SETTINGS_KEY, saved)
      void client.invalidateQueries({ queryKey: VERSIONS_KEY })
    },
  })
}

export function useVersions(limit: number, offset: number) {
  return useQuery({
    queryKey: [...VERSIONS_KEY, limit, offset],
    queryFn: async () =>
      (await getHttp().get<Schemas['VersionPage']>('settings/versions', { params: { limit, offset } })).data,
    placeholderData: (previous) => previous,
  })
}

export function useRestoreVersion() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ version, note }: { version: number; note?: string }) =>
      (
        await getHttp().post<SettingsOut>(`settings/versions/${version}/restore`, {
          change_note: note?.trim() || null,
        })
      ).data,
    onSuccess: (saved) => {
      client.setQueryData(SETTINGS_KEY, saved)
      void client.invalidateQueries({ queryKey: VERSIONS_KEY })
    },
  })
}

export function useModelTest() {
  return useMutation({
    mutationFn: async (model: string) =>
      (await getHttp().post<Schemas['ModelTestResult']>('settings/model-test', { model })).data,
  })
}
