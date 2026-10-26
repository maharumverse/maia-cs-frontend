import type { BotSettings, Schemas, WebConfig, WhatsAppConfig } from '@/api/types'

export type { BotSettings, WebConfig, WhatsAppConfig }
export type OperatingHoursConfig = Schemas['OperatingHours']

export type Provider = 'meta' | 'baileys'

// Bentuk respons endpoint status (app/api/v1/channels.py). Backend hanya mengirim boolean untuk
// secret; tipe ini sengaja tidak punya tempat untuk nilainya.
export interface BaileysReport {
  configured: boolean
  state: string | null
  last_error: string | null
  updated_at: string | null
}

export interface WhatsAppStatus {
  provider: Provider
  baileys: BaileysReport
  bot_enabled: boolean
  test_mode: boolean
  phone_number_id_set: boolean
  waba_id_set: boolean
  secrets: {
    meta_access_token: boolean
    meta_app_secret: boolean
    meta_verify_token: boolean
  }
}

export type MetaTestResult =
  | { ok: true; verified_name: string | null; display_phone_number: string | null }
  | { ok: false; status: number | null; code: number | null }
