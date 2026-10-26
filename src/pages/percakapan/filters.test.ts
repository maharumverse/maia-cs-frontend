import { describe, expect, it } from 'vitest'
import { FILTER_DEFAULTS, activeFilterCount, filterParams, nomorDigits } from '@/pages/percakapan/filters'

const base = { ...FILTER_DEFAULTS }

describe('filterParams', () => {
  it('tanpa filter tidak mengirim apa pun', () => {
    expect(filterParams(base)).toEqual({})
  })

  it('mengubah tanggal menjadi awal dan akhir hari WIB dengan offset +07:00', () => {
    const params = filterParams({ ...base, dari: '2026-10-01', sampai: '2026-10-31' })
    expect(params.dari).toBe('2026-10-01T00:00:00+07:00')
    expect(params.sampai).toBe('2026-10-31T23:59:59.999+07:00')
  })

  it('mengabaikan tanggal yang bukan yyyy-mm-dd', () => {
    expect(filterParams({ ...base, dari: '01/10/2026', sampai: 'besok' })).toEqual({})
  })

  it('mengirim nomor hanya bila minimal 6 digit setelah dibersihkan', () => {
    expect(filterParams({ ...base, nomor: '62812' }).nomor).toBeUndefined()
    expect(filterParams({ ...base, nomor: '+62 812-3456' }).nomor).toBe('628123456')
  })

  it('mengubah fallback ya/tidak menjadi boolean', () => {
    expect(filterParams({ ...base, fallback: 'ada' }).fallback).toBe(true)
    expect(filterParams({ ...base, fallback: 'tanpa' }).fallback).toBe(false)
    expect(filterParams({ ...base, fallback: 'lainnya' }).fallback).toBeUndefined()
  })

  it('meneruskan channel, alasan, dan feedback yang valid saja', () => {
    expect(filterParams({ ...base, channel: 'web', alasan: 'low_score', feedback: 'down' })).toEqual({
      channel: 'web',
      alasan: 'low_score',
      feedback: 'down',
    })
    expect(filterParams({ ...base, channel: 'sms', alasan: 'xx', feedback: 'meh' })).toEqual({})
  })
})

describe('nomorDigits', () => {
  it('membuang spasi dan tanda', () => {
    expect(nomorDigits(' +62 (812) 345-678 ')).toBe('62812345678')
  })
})

describe('activeFilterCount', () => {
  it('menghitung filter yang terisi, bukan urutan atau halaman', () => {
    expect(activeFilterCount(base)).toBe(0)
    expect(activeFilterCount({ ...base, urut: 'terlama', hal: '3', channel: 'web', nomor: '12' })).toBe(2)
  })
})
