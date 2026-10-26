import type { ModelConfig } from '@/api/types'
import { formatNumber } from '@/lib/format'

// Batas dari app/core/bot_settings/schema.py (ModelConfig). Backend tetap otoritas validasi;
// ini hanya kenyamanan agar galat terlihat sebelum menyimpan.
export const MODEL_LIMITS = {
  nameMax: 100,
  allowedMax: 30,
  maxTokens: { min: 100, max: 8192 },
  timeoutSeconds: { min: 5, max: 120 },
  maxRetries: { min: 0, max: 5 },
  temperature: { min: 0, max: 1 },
} as const

// Model generasi 5 hanya menerima temperature bawaan sehingga nilai di sini diabaikan.
const GENERATION_FIVE = /^claude-(sonnet|haiku|opus|fable|mythos)-5/

export function ignoresTemperature(model: string): boolean {
  return GENERATION_FIVE.test(model)
}

export function rangeError(value: number, min: number, max: number, integer: boolean): string | undefined {
  if (Number.isNaN(value)) return 'Wajib diisi dengan angka.'
  if (integer && !Number.isInteger(value)) return 'Harus berupa bilangan bulat.'
  if (value < min || value > max) return `Harus antara ${formatNumber(min)} dan ${formatNumber(max)}.`
  return undefined
}

export interface ModelErrors {
  primary?: string
  fallback?: string
  max_tokens?: string
  timeout_seconds?: string
  max_retries?: string
  temperature?: string
}

export function validateModel(model: ModelConfig): ModelErrors {
  const errors: ModelErrors = {}
  if (!model.primary || !model.allowed_models.includes(model.primary)) {
    errors.primary = 'Model utama harus ada di daftar model yang diizinkan.'
  }
  if (model.fallback && !model.allowed_models.includes(model.fallback)) {
    errors.fallback = 'Model cadangan harus ada di daftar model yang diizinkan.'
  }
  const { maxTokens, timeoutSeconds, maxRetries, temperature } = MODEL_LIMITS
  errors.max_tokens = rangeError(model.max_tokens, maxTokens.min, maxTokens.max, true)
  errors.timeout_seconds = rangeError(model.timeout_seconds, timeoutSeconds.min, timeoutSeconds.max, true)
  errors.max_retries = rangeError(model.max_retries, maxRetries.min, maxRetries.max, true)
  errors.temperature = rangeError(model.temperature, temperature.min, temperature.max, false)
  return errors
}

export function hasErrors(errors: object): boolean {
  return Object.values(errors).some(Boolean)
}
