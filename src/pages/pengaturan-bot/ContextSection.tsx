import { useId, useState } from 'react'
import type { BotConfig } from '@/api/types'
import { formatNumber } from '@/lib/format'
import { ADVANCED_KEYS, NUMBER_RULES, type FieldErrors, type NumberKey } from './botConfig'
import { NumberField } from './fields'
import { useKnowledgeSummary, type KnowledgeSummary } from './useKnowledgeSummary'

type Mode = BotConfig['context_mode']

const MODE_OPTIONS: Array<{ value: Mode; label: string; explanation: string }> = [
  {
    value: 'auto',
    label: 'Auto',
    explanation: 'Otomatis: bila total token dokumen aktif muat dalam batas token di bawah, semua dokumen dikirim; bila tidak, bot beralih ke pencarian.',
  },
  {
    value: 'full_context',
    label: 'Seluruh dokumen',
    explanation: 'Seluruh dokumen aktif dikirim ke model pada setiap pertanyaan. Paling lengkap, tetapi lebih mahal dan dibatasi oleh batas token.',
  },
  {
    value: 'retrieval',
    label: 'Pencarian',
    explanation: 'Hanya potongan dokumen yang paling mirip dengan pertanyaan yang dikirim. Hemat token dan cocok untuk dokumen yang banyak.',
  },
]

const MODE_NAMES: Record<KnowledgeSummary['effective_mode'], string> = {
  full_context: 'Seluruh dokumen',
  retrieval: 'Pencarian',
}

interface Props {
  bot: BotConfig
  errors: FieldErrors
  onChange: (patch: Partial<BotConfig>) => void
}

function EffectiveMode() {
  const summary = useKnowledgeSummary()
  if (summary.isLoading) return <p className="hint" role="status">Memuat mode yang berlaku...</p>
  if (summary.isError || !summary.data) {
    return (
      <p className="hint" role="status">
        Mode yang berlaku saat ini belum bisa dimuat.{' '}
        <button type="button" className="btn sm ghost" onClick={() => void summary.refetch()}>
          Coba Lagi
        </button>
      </p>
    )
  }
  const { effective_mode, active_tokens, full_context_max_tokens } = summary.data
  return (
    <p className="notice info" role="status">
      <span>
        Mode yang berlaku sekarang: <strong>{MODE_NAMES[effective_mode]}</strong> ({formatNumber(active_tokens)} token dokumen aktif, batas seluruh dokumen {formatNumber(full_context_max_tokens)}).
      </span>
    </p>
  )
}

export function ContextSection({ bot, errors, onChange }: Props) {
  const headingId = useId()
  const modeId = useId()
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const advancedError = ADVANCED_KEYS.some((key) => errors[key])

  const number = (key: NumberKey, label: string, hint?: string) => (
    <NumberField label={label} value={bot[key]} rule={NUMBER_RULES[key]} error={errors[key]} hint={hint} onChange={(value) => onChange({ [key]: value })} />
  )

  const mode = MODE_OPTIONS.find((option) => option.value === bot.context_mode)

  return (
    <section className="card" aria-labelledby={headingId}>
      <h2 id={headingId}>Mode Konteks & Pencarian</h2>
      <p className="muted section-intro">Cara dokumen knowledge dan riwayat percakapan dikirim ke model.</p>
      <div className="stack">
        <EffectiveMode />
        <div className="field">
          <label htmlFor={modeId}>Mode Konteks</label>
          <select id={modeId} value={bot.context_mode} aria-describedby={`${modeId}-hint`} onChange={(event) => onChange({ context_mode: event.target.value as Mode })}>
            {MODE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="hint" id={`${modeId}-hint`}>
            {mode?.explanation}
          </p>
        </div>
        <div className="grid-2">
          {number('full_context_max_tokens', 'Batas Token Seluruh Dokumen', 'Di atas batas ini mode Auto beralih ke pencarian.')}
          {number('retrieval_top_k', 'Jumlah Potongan Teratas', 'Banyaknya potongan dokumen yang diambil per pertanyaan.')}
          {number('retrieval_threshold', 'Ambang Kemiripan', 'Dari 0 sampai 1. Potongan di bawah ambang ini dibuang; makin tinggi makin ketat.')}
          {number('history_turns', 'Jumlah Giliran Riwayat', 'Banyaknya giliran percakapan sebelumnya yang ikut dikirim.')}
          {number('history_max_chars', 'Batas Karakter Riwayat', 'Riwayat dipotong bila melebihi jumlah karakter ini.')}
        </div>
        <details className="advanced" open={advancedOpen || advancedError} onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}>
          <summary>Lanjutan</summary>
          <p className="hint">Berlaku untuk unggahan dan pemrosesan dokumen berikutnya, bukan dokumen yang sudah ada.</p>
          <div className="grid-2">
            {number('max_upload_bytes', 'Ukuran Unggahan Maksimal (byte)')}
            {number('chunk_max_chars', 'Ukuran Potongan Maksimal (karakter)')}
            {number('chunk_overlap_chars', 'Tumpang Tindih Potongan (karakter)', 'Jumlah karakter yang diulang di tepi dua potongan berurutan.')}
          </div>
        </details>
      </div>
    </section>
  )
}
