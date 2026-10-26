import { describe, expect, it } from 'vitest'
import { addDays, formatNumber, formatPercent, formatUsd, todayJakarta } from '@/lib/format'

describe('format', () => {
  it('angka memakai pemisah ribuan Indonesia', () => {
    expect(formatNumber(1234567)).toBe('1.234.567')
  })

  it('persen dari rasio, dan tanda hubung bila belum ada data', () => {
    expect(formatPercent(0.5)).toMatch(/^50\s?%$/)
    expect(formatPercent(null)).toBe('-')
    expect(formatPercent(undefined)).toBe('-')
    expect(formatPercent(0)).toMatch(/^0\s?%$/)
  })

  it('biaya dalam dolar dengan sampai empat desimal', () => {
    expect(formatUsd('0.004')).toBe('$0.004')
    expect(formatUsd(12.5)).toBe('$12.50')
    expect(formatUsd(null)).toBe('-')
  })

  it('hari ini menurut kalender WIB, bukan UTC', () => {
    expect(todayJakarta(new Date('2026-10-23T18:30:00Z'))).toBe('2026-10-24')
    expect(todayJakarta(new Date('2026-10-23T16:30:00Z'))).toBe('2026-10-23')
  })

  it('menambah dan mengurangi hari melewati batas bulan', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })
})
