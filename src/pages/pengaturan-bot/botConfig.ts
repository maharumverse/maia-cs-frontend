import type { BotConfig, Schemas } from '@/api/types'
import type { Slice } from '@/pages/settings-shared/useSettingsSlice'
import { formatNumber } from '@/lib/format'

export type Persona = Schemas['Persona']

// Slice harus stabil (diinstansiasi sekali di luar komponen) supaya memo di useSettingsSlice tidak berulang.
export const BOT_SLICE: Slice<BotConfig> = {
  pick: (settings) => settings.bot,
  merge: (settings, bot) => ({ ...settings, bot }),
}

// Batas dari app/core/bot_settings/schema.py. Backend tetap otoritas validasi; angka ini hanya
// dipakai sebagai atribut input dan pemeriksaan kenyamanan di klien.
export const LIMITS = {
  name: 40,
  role: 100,
  addressTerm: 20,
  traitsMax: 10,
  itemMaxChars: 200,
  speakingStyle: 2000,
  systemPrompt: 20000,
  message: 2000,
  forbiddenTopicsMax: 50,
} as const

export interface NumberRule {
  min: number
  max: number
  step: number
  integer: boolean
}

export const NUMBER_RULES = {
  full_context_max_tokens: { min: 1000, max: 190000, step: 1000, integer: true },
  retrieval_top_k: { min: 1, max: 50, step: 1, integer: true },
  retrieval_threshold: { min: 0, max: 1, step: 0.05, integer: false },
  history_turns: { min: 0, max: 20, step: 1, integer: true },
  history_max_chars: { min: 0, max: 50000, step: 500, integer: true },
  max_upload_bytes: { min: 1000, max: 20000000, step: 100000, integer: true },
  chunk_max_chars: { min: 200, max: 8000, step: 100, integer: true },
  chunk_overlap_chars: { min: 0, max: 2000, step: 10, integer: true },
} as const satisfies Record<string, NumberRule>

export type NumberKey = keyof typeof NUMBER_RULES
export type FieldErrors = Partial<Record<string, string>>

export const ADVANCED_KEYS = ['max_upload_bytes', 'chunk_max_chars', 'chunk_overlap_chars']

function numberError(value: number, rule: NumberRule): string | undefined {
  if (!Number.isFinite(value)) return `Isi angka antara ${formatNumber(rule.min)} dan ${formatNumber(rule.max)}.`
  if (rule.integer && !Number.isInteger(value)) return 'Isi bilangan bulat.'
  if (value < rule.min || value > rule.max) return `Isi angka antara ${formatNumber(rule.min)} dan ${formatNumber(rule.max)}.`
  return undefined
}

// Pemeriksaan kenyamanan di klien; 422 dari backend tetap ditampilkan apa adanya.
export function validateBot(bot: BotConfig): FieldErrors {
  const errors: FieldErrors = {}
  const persona = bot.persona
  if (persona) {
    if (!persona.name.trim()) errors['persona.name'] = 'Nama wajib diisi.'
    if (!persona.role.trim()) errors['persona.role'] = 'Peran wajib diisi.'
    if (!persona.address_term.trim()) errors['persona.address_term'] = 'Sebutan pelanggan wajib diisi.'
  }
  for (const key of Object.keys(NUMBER_RULES) as NumberKey[]) {
    const message = numberError(bot[key], NUMBER_RULES[key])
    if (message) errors[key] = message
  }
  if (!errors.chunk_overlap_chars && !errors.chunk_max_chars && bot.chunk_overlap_chars >= bot.chunk_max_chars) {
    errors.chunk_overlap_chars = 'Tumpang tindih harus lebih kecil dari ukuran potongan.'
  }
  return errors
}
