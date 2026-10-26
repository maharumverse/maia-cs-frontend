import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { pagingOf, useUrlParams } from '@/hooks/useUrlParams'

const DEFAULTS = { q: '', channel: '', hal: '1', ukuran: '20' }

function setup(initial = '/percakapan') {
  const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter initialEntries={[initial]}>{children}</MemoryRouter>
  return renderHook(() => ({ params: useUrlParams(DEFAULTS), location: useLocation() }), { wrapper })
}

describe('useUrlParams', () => {
  it('membaca nilai dari URL dan memakai default untuk yang tidak ada', () => {
    const { result } = setup('/percakapan?channel=web&hal=3')
    expect(result.current.params[0]).toEqual({ q: '', channel: 'web', hal: '3', ukuran: '20' })
  })

  it('menulis perubahan ke URL tanpa menulis nilai default', () => {
    const { result } = setup()
    act(() => result.current.params[1]({ channel: 'web', ukuran: '20' }))
    expect(result.current.location.search).toBe('?channel=web')
  })

  it('menghapus parameter yang dikosongkan', () => {
    const { result } = setup('/percakapan?channel=web')
    act(() => result.current.params[1]({ channel: '' }))
    expect(result.current.location.search).toBe('')
  })

  it('mengubah filter kembali ke halaman pertama', () => {
    const { result } = setup('/percakapan?hal=4')
    act(() => result.current.params[1]({ channel: 'whatsapp' }))
    expect(result.current.location.search).toBe('?channel=whatsapp')
  })

  it('mengganti halaman mempertahankan filter', () => {
    const { result } = setup('/percakapan?channel=web')
    act(() => result.current.params[1]({ hal: '2' }))
    expect(result.current.location.search).toBe('?channel=web&hal=2')
  })

  it('keepPage mempertahankan halaman saat urutan berubah', () => {
    const { result } = setup('/percakapan?hal=2')
    act(() => result.current.params[1]({ q: 'x' }, { keepPage: true }))
    expect(result.current.location.search).toBe('?hal=2&q=x')
  })
})

describe('pagingOf', () => {
  it('mengubah halaman dan ukuran menjadi limit dan offset', () => {
    expect(pagingOf({ hal: '3', ukuran: '50' })).toEqual({ limit: 50, offset: 100 })
  })

  it('memakai default untuk nilai yang tidak sah', () => {
    expect(pagingOf({ hal: '-4', ukuran: '7' })).toEqual({ limit: 20, offset: 0 })
    expect(pagingOf({ hal: 'abc' })).toEqual({ limit: 20, offset: 0 })
    expect(pagingOf({})).toEqual({ limit: 20, offset: 0 })
  })
})
