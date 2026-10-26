import { useId } from 'react'
import type { BotSettings } from '@/api/types'
import { MODE_LABELS, type DraftOverrides } from './draft'

interface DraftEditorProps {
  draft: DraftOverrides
  active: BotSettings
  onChange: (next: DraftOverrides) => void
}

// Editor override ringkas: hanya field yang paling sering dicoba sebelum menyimpan pengaturan.
export function DraftEditor({ draft, active, onChange }: DraftEditorProps) {
  const id = useId()
  const set = <K extends keyof DraftOverrides>(key: K, value: DraftOverrides[K]) => onChange({ ...draft, [key]: value })
  const models = active.model.allowed_models.includes(draft.primaryModel)
    ? active.model.allowed_models
    : [draft.primaryModel, ...active.model.allowed_models]

  return (
    <div className="pg-draft">
      <div className="field">
        <label htmlFor={`${id}-prompt`}>System Prompt</label>
        <textarea
          id={`${id}-prompt`}
          className="inp pg-prompt"
          rows={8}
          value={draft.systemPrompt}
          onChange={(event) => set('systemPrompt', event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor={`${id}-persona`}>Nama Persona</label>
        <input
          id={`${id}-persona`}
          type="text"
          maxLength={40}
          value={draft.personaName}
          onChange={(event) => set('personaName', event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor={`${id}-mode`}>Mode Konteks</label>
        <select
          id={`${id}-mode`}
          value={draft.contextMode}
          onChange={(event) => set('contextMode', event.target.value as DraftOverrides['contextMode'])}
        >
          {Object.entries(MODE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor={`${id}-model`}>Model Utama</label>
        <select id={`${id}-model`} value={draft.primaryModel} onChange={(event) => set('primaryModel', event.target.value)}>
          {models.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </div>
      <div className="pg-pair">
        <div className="field">
          <label htmlFor={`${id}-threshold`}>Ambang Kemiripan</label>
          <input
            id={`${id}-threshold`}
            type="number"
            min={0}
            max={1}
            step={0.05}
            value={draft.threshold}
            onChange={(event) => {
              if (event.target.value !== '') set('threshold', Number(event.target.value))
            }}
          />
          <p className="hint">0 sampai 1, mode pencarian.</p>
        </div>
        <div className="field">
          <label htmlFor={`${id}-topk`}>Jumlah Hasil Teratas</label>
          <input
            id={`${id}-topk`}
            type="number"
            min={1}
            max={50}
            step={1}
            value={draft.topK}
            onChange={(event) => {
              if (event.target.value !== '') set('topK', Number(event.target.value))
            }}
          />
          <p className="hint">1 sampai 50, mode pencarian.</p>
        </div>
      </div>
    </div>
  )
}
