import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError } from '@/api/errors'
import { useSaveSettings, useSettings } from '@/api/settings'
import type { BotSettings } from '@/api/types'

// Satu halaman pengaturan mengedit satu potongan dari BotSettings (misalnya `model` atau
// `limits`), tetapi backend menyimpan seluruh pengaturan sebagai satu versi. Hook ini memegang
// draf potongan itu, menggabungkannya ke pengaturan terbaru saat disimpan, dan menangani
// konflik versi (409 SETTINGS_CONFLICT) serta peringatan keluar halaman saat ada yang belum disimpan.
export interface Slice<T> {
  pick: (settings: BotSettings) => T
  merge: (settings: BotSettings, value: T) => BotSettings
}

export function useSettingsSlice<T>(slice: Slice<T>) {
  const query = useSettings()
  const save = useSaveSettings()
  const server = query.data
  const [edit, setEdit] = useState<{ version: number; value: T } | null>(null)

  const baseline = useMemo(() => (server ? slice.pick(server.data) : undefined), [server, slice])
  // Draf yang dibuat dari versi lama diabaikan begitu versi di server berubah.
  const draft: T | undefined = edit && server && edit.version === server.version ? edit.value : baseline
  const dirty = Boolean(edit && server && edit.version === server.version && JSON.stringify(edit.value) !== JSON.stringify(baseline))

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const change = useCallback(
    (value: T) => {
      if (server) setEdit({ version: server.version, value })
    },
    [server],
  )

  const reset = useCallback(() => {
    setEdit(null)
    save.reset()
  }, [save])

  const submit = useCallback(
    async (note?: string) => {
      if (!server || draft === undefined) return false
      try {
        await save.mutateAsync({ data: slice.merge(server.data, draft), baseVersion: server.version, note })
        setEdit(null)
        return true
      } catch {
        return false
      }
    },
    [server, draft, slice, save],
  )

  const conflict = save.error instanceof ApiError && save.error.code === 'SETTINGS_CONFLICT'

  // Muat ulang pengaturan terbaru dan buang draf, dipakai setelah konflik.
  const reload = useCallback(async () => {
    setEdit(null)
    save.reset()
    await query.refetch()
  }, [query, save])

  return {
    version: server?.version,
    draft,
    loading: query.isLoading,
    loadError: query.error,
    refetch: query.refetch,
    dirty,
    change,
    reset,
    submit,
    saving: save.isPending,
    saveError: save.error,
    conflict,
    reload,
    saved: save.isSuccess && !dirty,
  }
}
