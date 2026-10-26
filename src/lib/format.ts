const NUMBER = new Intl.NumberFormat('id-ID')
const PERCENT = new Intl.NumberFormat('id-ID', { style: 'percent', maximumFractionDigits: 1 })
const DATE_TIME = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' })
const DATE = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'Asia/Jakarta' })

export function formatNumber(value: number): string {
  return NUMBER.format(value)
}

// Rasio 0..1 menjadi persen. null (belum ada data) menjadi tanda hubung, bukan 0%.
export function formatPercent(ratio: number | null | undefined): string {
  return ratio === null || ratio === undefined ? '-' : PERCENT.format(ratio)
}

// Biaya dalam dolar AS dengan empat desimal; jawaban bot berharga sepersekian sen.
export function formatUsd(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '-'
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
}

export function formatDateTime(iso: string): string {
  return DATE_TIME.format(new Date(iso))
}

export function formatDate(iso: string): string {
  return DATE.format(new Date(iso.length === 10 ? `${iso}T00:00:00+07:00` : iso))
}

// Tanggal hari ini menurut kalender WIB sebagai yyyy-mm-dd, sama dengan hari kalender di backend.
export function todayJakarta(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(now)
}

export function addDays(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}
