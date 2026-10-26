import { FALLBACK_REASON_LABELS } from '@/lib/labels'

// Semua filter hidup di URL (useUrlParams). Nilai kosong berarti tanpa filter.
export const FILTER_KEYS = ['channel', 'dari', 'sampai', 'nomor', 'fallback', 'alasan', 'feedback'] as const

export const FILTER_DEFAULTS = {
  channel: '',
  dari: '',
  sampai: '',
  nomor: '',
  fallback: '',
  alasan: '',
  feedback: '',
  urut: 'terbaru',
  hal: '',
  ukuran: '',
}

export type ListValues = typeof FILTER_DEFAULTS

// Bentuk parameter yang dipahami backend untuk daftar dan ekspor (filter yang sama).
export interface ConversationFilters {
  channel?: 'web' | 'whatsapp'
  dari?: string
  sampai?: string
  nomor?: string
  fallback?: boolean
  alasan?: string
  feedback?: 'up' | 'down'
}

export const MIN_NOMOR_DIGITS = 6
export const EXPORT_CAP = 5000

const DAY = /^\d{4}-\d{2}-\d{2}$/

export function nomorDigits(text: string): string {
  return text.replace(/\D/g, '')
}

// Backend memakai datetime ber-offset; hari kalender dashboard adalah WIB (+07:00).
export const startOfDayWib = (day: string) => `${day}T00:00:00+07:00`
export const endOfDayWib = (day: string) => `${day}T23:59:59.999+07:00`

export function filterParams(values: ListValues): ConversationFilters {
  const params: ConversationFilters = {}
  if (values.channel === 'web' || values.channel === 'whatsapp') params.channel = values.channel
  if (DAY.test(values.dari)) params.dari = startOfDayWib(values.dari)
  if (DAY.test(values.sampai)) params.sampai = endOfDayWib(values.sampai)
  const digits = nomorDigits(values.nomor)
  if (digits.length >= MIN_NOMOR_DIGITS) params.nomor = digits
  if (values.fallback === 'ada') params.fallback = true
  else if (values.fallback === 'tanpa') params.fallback = false
  if (values.alasan in FALLBACK_REASON_LABELS) params.alasan = values.alasan
  if (values.feedback === 'up' || values.feedback === 'down') params.feedback = values.feedback
  return params
}

export function activeFilterCount(values: ListValues): number {
  return FILTER_KEYS.filter((key) => values[key] !== '').length
}

export const sortParam = (urut: string) => (urut === 'terlama' ? 'last_activity_at' : '-last_activity_at')
