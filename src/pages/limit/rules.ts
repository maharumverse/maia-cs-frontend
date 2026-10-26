import type { LimitsConfig } from '@/api/types'
import { rangeError } from '@/pages/model/rules'

type ChannelLimits = LimitsConfig['web']
export type ChannelKey = 'web' | 'whatsapp'

// Batas dari app/core/bot_settings/schema.py (ChannelLimits, LimitsConfig). Backend tetap otoritas.
export const CHANNEL_LIMITS = {
  max_message_chars: { min: 1, max: 10_000 },
  max_turns: { min: 1, max: 500 },
  per_minute: { min: 1, max: 1000 },
  per_day: { min: 1, max: 100_000 },
  limit_message: { maxLength: 2000 },
} as const

export type ChannelErrors = Partial<Record<'max_message_chars' | 'max_turns' | 'per_minute' | 'per_day', string>>

export function validateChannel(limits: ChannelLimits): ChannelErrors {
  const out: ChannelErrors = {}
  for (const key of ['max_message_chars', 'max_turns', 'per_minute', 'per_day'] as const) {
    const { min, max } = CHANNEL_LIMITS[key]
    out[key] = rangeError(limits[key], min, max, true)
  }
  return out
}

// Desimal USD tidak negatif, maksimal 14 digit dengan 6 desimal (8 digit bulat). Kosong berarti tanpa batas.
const DECIMAL = /^\d{1,8}(\.\d{1,6})?$/

export function costError(value: string | null | undefined): string | undefined {
  if (value === null || value === undefined || value.trim() === '') return undefined
  const text = value.trim()
  if (text.startsWith('-')) return 'Tidak boleh negatif.'
  if (!DECIMAL.test(text)) return 'Isi dengan angka desimal memakai titik, mis. 5 atau 2.5 (maksimal 6 desimal).'
  return undefined
}

export interface LimitErrors {
  web: ChannelErrors
  whatsapp: ChannelErrors
  cost?: string
}

export function validateLimits(limits: LimitsConfig): LimitErrors {
  return { web: validateChannel(limits.web), whatsapp: validateChannel(limits.whatsapp), cost: costError(limits.daily_cost_limit) }
}

export function limitsHaveErrors(errors: LimitErrors): boolean {
  return Boolean(errors.cost) || Object.values(errors.web).some(Boolean) || Object.values(errors.whatsapp).some(Boolean)
}
