import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

type Defaults = Record<string, string>

// Filter, pencarian, urutan, dan halaman hidup di query string supaya muat ulang (F5) dan tautan
// yang dibagikan memulihkan tampilan yang sama (refresh.component.md). Nilai yang sama dengan
// default tidak ditulis ke URL, dan perubahan memakai replace agar tombol Kembali tidak penuh.
export function useUrlParams<T extends Defaults>(defaults: T) {
  const [search, setSearch] = useSearchParams()

  const values = useMemo(() => {
    const result: Defaults = {}
    for (const key of Object.keys(defaults)) result[key] = search.get(key) ?? defaults[key] ?? ''
    return result as T
  }, [search, defaults])

  const update = useCallback(
    (patch: Partial<T>, options: { keepPage?: boolean } = {}) => {
      setSearch(
        (current) => {
          const next = new URLSearchParams(current)
          for (const [key, value] of Object.entries(patch) as Array<[string, string | undefined]>) {
            if (value === undefined || value === '' || value === defaults[key]) next.delete(key)
            else next.set(key, value)
          }
          // Mengubah filter atau pencarian selalu kembali ke halaman pertama.
          if (!options.keepPage && !('hal' in patch)) next.delete('hal')
          return next
        },
        { replace: true },
      )
    },
    [setSearch, defaults],
  )

  return [values, update] as const
}

export const PAGE_SIZES = [20, 50, 100] as const
export const DEFAULT_PAGE_SIZE = 20

// Konversi `hal` (mulai dari 1) dan `ukuran` di URL menjadi limit/offset untuk backend.
export function pagingOf(params: { hal?: string; ukuran?: string }) {
  const size = Number(params.ukuran)
  const limit = (PAGE_SIZES as readonly number[]).includes(size) ? size : DEFAULT_PAGE_SIZE
  const page = Math.max(1, Math.floor(Number(params.hal)) || 1)
  return { limit, offset: (page - 1) * limit }
}
