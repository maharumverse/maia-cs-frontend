import type { BotSettings, OperatingHoursConfig, WebConfig, WhatsAppConfig } from './types'
import type { Slice } from '@/pages/settings-shared/useSettingsSlice'

// Halaman ini menyunting dua potongan pengaturan sekaligus: web dan whatsapp.
export interface ChannelDraft {
  web: WebConfig
  whatsapp: WhatsAppConfig
}

// Dibuat sekali di luar komponen supaya identitasnya stabil (useSettingsSlice memoize dari sini).
export const CHANNEL_SLICE: Slice<ChannelDraft> = {
  pick: (settings: BotSettings) => ({ web: settings.web, whatsapp: settings.whatsapp }),
  merge: (settings: BotSettings, value: ChannelDraft) => ({ ...settings, web: value.web, whatsapp: value.whatsapp }),
}

export const DEFAULT_HOURS: OperatingHoursConfig = {
  enabled: false,
  timezone: 'Asia/Jakarta',
  start: '08:00',
  end: '17:00',
  days: [1, 2, 3, 4, 5],
  outside_hours_message: '',
}

// 1 = Senin ... 7 = Minggu (sama dengan backend).
export const DAYS: { value: number; label: string }[] = [
  { value: 1, label: 'Senin' },
  { value: 2, label: 'Selasa' },
  { value: 3, label: 'Rabu' },
  { value: 4, label: 'Kamis' },
  { value: 5, label: 'Jumat' },
  { value: 6, label: 'Sabtu' },
  { value: 7, label: 'Minggu' },
]

// Pola dan batas mengikuti app/core/bot_settings/schema.py. Validasi di klien hanya kenyamanan;
// backend tetap yang memutuskan.
const ORIGIN = /^https?:\/\/[^/*\s]+$/
const PHONE = /^\d{8,15}$/
const PAIRING_PHONE = /^\d{6,20}$/
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/
const GRAPH_VERSION = /^v\d+\.\d+$/

export const MAX_ORIGINS = 50
export const MAX_NUMBERS = 500

export function normalizeOrigin(raw: string): string {
  return raw.trim().replace(/\/$/, '')
}

export function originError(value: string): string | null {
  return ORIGIN.test(value) ? null : 'Origin harus berbentuk http(s)://host tanpa path dan tanpa wildcard.'
}

// Nomor boleh ditulis dengan plus, spasi, atau tanda hubung; yang disimpan hanya digit.
export function normalizePhone(raw: string): string {
  return raw.trim().replace(/[\s+-]/g, '')
}

export function phoneError(value: string): string | null {
  return PHONE.test(value) ? null : 'Nomor harus 8 sampai 15 digit dengan kode negara.'
}

export function pairingPhoneError(value: string): string | null {
  return PAIRING_PHONE.test(value) ? null : 'Nomor harus 6 sampai 20 digit dengan kode negara.'
}

function intInRange(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max
}

// Daftar pesan galat untuk isian yang tidak bisa dicegah saat mengetik. Kosong berarti boleh disimpan.
export function validateChannel(draft: ChannelDraft): string[] {
  const errors: string[] = []
  const { whatsapp } = draft
  const hours = whatsapp.operating_hours ?? DEFAULT_HOURS
  if (!hours.timezone.trim() || hours.timezone.length > 60) errors.push('Zona waktu wajib diisi (maksimal 60 karakter).')
  if (!TIME.test(hours.start)) errors.push('Jam mulai harus berformat HH:MM.')
  if (!TIME.test(hours.end)) errors.push('Jam selesai harus berformat HH:MM.')
  if (hours.enabled && (hours.days ?? []).length === 0) errors.push('Pilih minimal satu hari operasional.')
  if (!intInRange(whatsapp.session_timeout_hours, 1, 720)) errors.push('Batas sesi harus bilangan bulat 1 sampai 720.')
  if (!intInRange(whatsapp.merge_delay_seconds, 0, 30)) errors.push('Jeda gabung pesan harus bilangan bulat 0 sampai 30.')
  if (!GRAPH_VERSION.test(whatsapp.graph_api_version)) errors.push('Versi Graph API harus berbentuk v21.0.')
  return errors
}
