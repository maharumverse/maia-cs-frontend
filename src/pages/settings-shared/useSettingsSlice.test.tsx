import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/errors'
import type { BotSettings, SettingsOut } from '@/api/types'
import { useSettingsSlice, type Slice } from '@/pages/settings-shared/useSettingsSlice'

const get = vi.fn()
const put = vi.fn()
vi.mock('@/api/client', () => ({ getHttp: () => ({ get, put }) }))

const settings = (version: number, tokens = 1024) =>
  ({
    version,
    data: { model: { primary: 'a', max_tokens: tokens }, limits: { x: 1 } } as unknown as BotSettings,
    changed_by_nip: null,
    change_note: null,
    restored_from_version: null,
    created_at: null,
  }) as unknown as SettingsOut

const slice: Slice<{ primary: string; max_tokens: number }> = {
  pick: (s) => s.model,
  merge: (s, value) => ({ ...s, model: value as unknown as BotSettings['model'] }),
}

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>
  return renderHook(() => useSettingsSlice(slice), { wrapper })
}

describe('useSettingsSlice', () => {
  beforeEach(() => {
    get.mockReset()
    put.mockReset()
    get.mockResolvedValue({ data: settings(3) })
  })

  it('memuat potongan dari pengaturan aktif', async () => {
    const { result } = setup()
    await waitFor(() => expect(result.current.draft).toEqual({ primary: 'a', max_tokens: 1024 }))
    expect(result.current.version).toBe(3)
    expect(result.current.dirty).toBe(false)
  })

  it('menandai perubahan dan kembali bersih bila nilainya dikembalikan', async () => {
    const { result } = setup()
    await waitFor(() => expect(result.current.draft).toBeDefined())
    act(() => result.current.change({ primary: 'b', max_tokens: 1024 }))
    expect(result.current.dirty).toBe(true)
    act(() => result.current.change({ primary: 'a', max_tokens: 1024 }))
    expect(result.current.dirty).toBe(false)
  })

  it('menyimpan seluruh pengaturan dengan potongan yang diganti dan versi dasar yang benar', async () => {
    put.mockResolvedValue({ data: settings(4, 2048) })
    const { result } = setup()
    await waitFor(() => expect(result.current.draft).toBeDefined())
    act(() => result.current.change({ primary: 'b', max_tokens: 2048 }))
    let ok = false
    await act(async () => {
      ok = await result.current.submit('naikkan token')
    })
    expect(ok).toBe(true)
    expect(put).toHaveBeenCalledWith('settings', {
      base_version: 3,
      data: { model: { primary: 'b', max_tokens: 2048 }, limits: { x: 1 } },
      change_note: 'naikkan token',
    })
    await waitFor(() => expect(result.current.version).toBe(4))
    expect(result.current.dirty).toBe(false)
    expect(result.current.saved).toBe(true)
  })

  it('catatan kosong dikirim sebagai null', async () => {
    put.mockResolvedValue({ data: settings(4) })
    const { result } = setup()
    await waitFor(() => expect(result.current.draft).toBeDefined())
    act(() => result.current.change({ primary: 'b', max_tokens: 1 }))
    await act(async () => {
      await result.current.submit('   ')
    })
    expect(put.mock.calls[0]?.[1]).toMatchObject({ change_note: null })
  })

  it('konflik versi ditandai dan draf tidak hilang sampai dimuat ulang', async () => {
    put.mockRejectedValue(new ApiError(409, 'SETTINGS_CONFLICT', 'Pengaturan sudah diubah'))
    const { result } = setup()
    await waitFor(() => expect(result.current.draft).toBeDefined())
    act(() => result.current.change({ primary: 'b', max_tokens: 1 }))
    let ok = true
    await act(async () => {
      ok = await result.current.submit()
    })
    expect(ok).toBe(false)
    await waitFor(() => expect(result.current.conflict).toBe(true))
    expect(result.current.dirty).toBe(true)

    get.mockResolvedValue({ data: settings(5, 999) })
    await act(async () => {
      await result.current.reload()
    })
    await waitFor(() => expect(result.current.draft).toEqual({ primary: 'a', max_tokens: 999 }))
    expect(result.current.conflict).toBe(false)
    expect(result.current.dirty).toBe(false)
  })

  it('galat lain tidak ditandai sebagai konflik', async () => {
    put.mockRejectedValue(new ApiError(500, 'X', 'x'))
    const { result } = setup()
    await waitFor(() => expect(result.current.draft).toBeDefined())
    act(() => result.current.change({ primary: 'b', max_tokens: 1 }))
    await act(async () => {
      await result.current.submit()
    })
    await waitFor(() => expect(result.current.saveError).toBeInstanceOf(ApiError))
    expect(result.current.conflict).toBe(false)
  })

  it('memasang peringatan keluar halaman hanya saat ada perubahan', async () => {
    const add = vi.spyOn(window, 'addEventListener')
    const { result } = setup()
    await waitFor(() => expect(result.current.draft).toBeDefined())
    expect(add.mock.calls.some(([name]) => name === 'beforeunload')).toBe(false)
    act(() => result.current.change({ primary: 'b', max_tokens: 1 }))
    expect(add.mock.calls.some(([name]) => name === 'beforeunload')).toBe(true)
  })

  it('batalkan membuang draf', async () => {
    const { result } = setup()
    await waitFor(() => expect(result.current.draft).toBeDefined())
    act(() => result.current.change({ primary: 'b', max_tokens: 1 }))
    act(() => result.current.reset())
    expect(result.current.draft).toEqual({ primary: 'a', max_tokens: 1024 })
    expect(result.current.dirty).toBe(false)
  })
})
