import { useId } from 'react'
import { DAYS, DEFAULT_HOURS } from './model'
import { Switch } from './Switch'
import type { OperatingHoursConfig } from './types'

interface OperatingHoursEditorProps {
  value: OperatingHoursConfig | undefined
  onChange: (value: OperatingHoursConfig) => void
}

export function OperatingHoursEditor({ value, onChange }: OperatingHoursEditorProps) {
  const id = useId()
  const hours = value ?? DEFAULT_HOURS
  const days = hours.days ?? []
  const patch = (change: Partial<OperatingHoursConfig>) => onChange({ ...hours, ...change })

  function toggleDay(day: number, on: boolean) {
    const next = on ? [...days, day] : days.filter((other) => other !== day)
    patch({ days: [...new Set(next)].sort((a, b) => a - b) })
  }

  return (
    <div className="ch-group">
      <h3>Jam Operasional</h3>
      <Switch
        label="Aktifkan Jam Operasional"
        checked={hours.enabled}
        onChange={(enabled) => patch({ enabled })}
        hint="Di luar jam ini bot membalas dengan pesan di bawah, bukan jawaban dari knowledge."
      />
      <div className="ch-grid-3">
        <div className="field">
          <label htmlFor={`${id}-tz`}>Zona Waktu</label>
          <input id={`${id}-tz`} type="text" maxLength={60} value={hours.timezone} onChange={(event) => patch({ timezone: event.target.value })} />
          <p className="hint">Nama zona IANA, misalnya Asia/Jakarta.</p>
        </div>
        <div className="field">
          <label htmlFor={`${id}-start`}>Mulai</label>
          <input id={`${id}-start`} type="time" value={hours.start} onChange={(event) => patch({ start: event.target.value })} />
        </div>
        <div className="field">
          <label htmlFor={`${id}-end`}>Selesai</label>
          <input id={`${id}-end`} type="time" value={hours.end} onChange={(event) => patch({ end: event.target.value })} />
        </div>
      </div>
      <fieldset className="ch-days">
        <legend>Hari Operasional</legend>
        {DAYS.map((day) => (
          <label key={day.value} className="ch-check">
            <input type="checkbox" checked={days.includes(day.value)} onChange={(event) => toggleDay(day.value, event.target.checked)} />
            <span>{day.label}</span>
          </label>
        ))}
      </fieldset>
      <div className="field">
        <label htmlFor={`${id}-msg`}>Pesan di Luar Jam Operasional</label>
        <textarea id={`${id}-msg`} className="inp" maxLength={2000} value={hours.outside_hours_message} onChange={(event) => patch({ outside_hours_message: event.target.value })} />
      </div>
    </div>
  )
}
