import type { components } from '@/api/schema'

// Tipe diturunkan dari OpenAPI backend (npm run gen:api). Jangan menulis ulang bentuk respons
// di halaman; ambil dari sini supaya perubahan backend langsung terlihat sebagai galat tipe.
export type Schemas = components['schemas']

export type SettingsOut = Schemas['SettingsOut']
export type BotSettings = SettingsOut['data']
export type BotConfig = BotSettings['bot']
export type ModelConfig = BotSettings['model']
export type LimitsConfig = BotSettings['limits']
export type WhatsAppConfig = BotSettings['whatsapp']
export type WebConfig = BotSettings['web']

// Bentuk umum halaman berpaginasi dari backend (api.rules.md).
export interface Page<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}
