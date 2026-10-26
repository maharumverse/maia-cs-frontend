import { useCallback, useEffect, useRef, useState } from 'react'
import { IconFilterOff } from '@tabler/icons-react'
import { CHANNEL_LABELS, FALLBACK_REASON_LABELS } from '@/lib/labels'
import { FILTER_KEYS, activeFilterCount, type ListValues } from '@/pages/percakapan/filters'

interface ToolbarProps {
  values: ListValues
  onChange: (patch: Partial<ListValues>) => void
}

// Nomor diketik bebas lalu ditulis ke URL setelah jeda 300 ms; kirim ke backend ditentukan filters.ts.
function NomorField({ value, onCommit }: { value: string; onCommit: (value: string) => void }) {
  const [text, setText] = useState(value)
  const last = useRef(value)

  // URL berubah dari luar (Reset Filter, tombol Kembali): ikuti.
  useEffect(() => {
    if (value !== last.current) {
      last.current = value
      setText(value)
    }
  }, [value])

  useEffect(() => {
    const effective = text.trim()
    if (effective === last.current) return
    const timer = setTimeout(() => {
      last.current = effective
      onCommit(effective)
    }, 300)
    return () => clearTimeout(timer)
  }, [text, onCommit])

  return (
    <div className="field cv-nomor">
      <label htmlFor="cv-nomor">Nomor</label>
      <input
        id="cv-nomor"
        type="text"
        inputMode="tel"
        autoComplete="off"
        maxLength={40}
        value={text}
        onChange={(event) => setText(event.target.value)}
        aria-describedby="cv-nomor-hint"
      />
      <p className="hint" id="cv-nomor-hint">
        Cari nomor yang sama persis, mis. 62812... Minimal 6 digit.
      </p>
    </div>
  )
}

export function Toolbar({ values, onChange }: ToolbarProps) {
  const active = activeFilterCount(values) > 0
  // Reset membuang juga ketikan nomor yang belum sempat ditulis ke URL.
  const [resetCount, setResetCount] = useState(0)
  const commitNomor = useCallback((nomor: string) => onChange({ nomor }), [onChange])

  return (
    <div className="toolbar cv-toolbar" role="search" aria-label="Filter percakapan">
      <div className="field">
        <label htmlFor="cv-channel">Channel</label>
        <select id="cv-channel" value={values.channel} onChange={(event) => onChange({ channel: event.target.value })}>
          <option value="">Semua</option>
          {Object.entries(CHANNEL_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="cv-dari">Dari</label>
        <input id="cv-dari" type="date" value={values.dari} max={values.sampai || undefined} onChange={(event) => onChange({ dari: event.target.value })} />
      </div>
      <div className="field">
        <label htmlFor="cv-sampai">Sampai</label>
        <input id="cv-sampai" type="date" value={values.sampai} min={values.dari || undefined} onChange={(event) => onChange({ sampai: event.target.value })} />
      </div>
      <NomorField key={resetCount} value={values.nomor} onCommit={commitNomor} />
      <div className="field">
        <label htmlFor="cv-fallback">Fallback</label>
        <select id="cv-fallback" value={values.fallback} onChange={(event) => onChange({ fallback: event.target.value })}>
          <option value="">Semua</option>
          <option value="ada">Ada fallback</option>
          <option value="tanpa">Tanpa fallback</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="cv-alasan">Alasan</label>
        <select id="cv-alasan" value={values.alasan} onChange={(event) => onChange({ alasan: event.target.value })}>
          <option value="">Semua</option>
          {Object.entries(FALLBACK_REASON_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="cv-feedback">Feedback</label>
        <select id="cv-feedback" value={values.feedback} onChange={(event) => onChange({ feedback: event.target.value })}>
          <option value="">Semua</option>
          <option value="up">Jempol naik</option>
          <option value="down">Jempol turun</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="cv-urut">Urutan</label>
        <select id="cv-urut" value={values.urut} onChange={(event) => onChange({ urut: event.target.value })}>
          <option value="terbaru">Terbaru dulu</option>
          <option value="terlama">Terlama dulu</option>
        </select>
      </div>
      {active ? (
        <div className="field">
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              setResetCount((count) => count + 1)
              onChange(Object.fromEntries(FILTER_KEYS.map((key) => [key, ''])))
            }}
          >
            <IconFilterOff size={16} aria-hidden="true" />
            Reset Filter
          </button>
        </div>
      ) : null}
    </div>
  )
}
