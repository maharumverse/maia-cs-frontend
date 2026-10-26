// Teks tampilan untuk nilai enum dari backend. Satu tempat supaya filter, badge, dan grafik konsisten.
export const FALLBACK_REASON_LABELS: Record<string, string> = {
  not_in_document: 'Tidak ada di dokumen',
  forbidden_topic: 'Topik terlarang',
  invalid_citation: 'Sitasi tidak valid',
  low_score: 'Kemiripan terlalu rendah',
  rate_limit: 'Batas pemakaian tercapai',
  daily_cost_limit: 'Batas biaya harian',
  model_error: 'Model tidak tersedia',
}

export const CHANNEL_LABELS: Record<string, string> = {
  web: 'Web',
  whatsapp: 'WhatsApp',
}

export function fallbackReasonLabel(reason: string): string {
  return FALLBACK_REASON_LABELS[reason] ?? reason
}
