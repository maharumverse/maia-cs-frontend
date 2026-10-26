import { useId, useState } from 'react'
import { IconPlus, IconX } from '@tabler/icons-react'
import type { ModelConfig } from '@/api/types'
import { MODEL_LIMITS } from './rules'

interface AllowedModelsProps {
  model: ModelConfig
  onChange: (next: ModelConfig) => void
}

// Editor daftar "Model yang Diizinkan". Model yang sedang dipilih sebagai utama atau cadangan
// tidak bisa dihapus; alasannya ditampilkan alih-alih tombol yang diam saja.
export function AllowedModels({ model, onChange }: AllowedModelsProps) {
  const id = useId()
  const [name, setName] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  function add() {
    const candidate = name.trim()
    if (!candidate) return setMessage('Nama model tidak boleh kosong.')
    if (candidate.length > MODEL_LIMITS.nameMax) return setMessage(`Nama model maksimal ${MODEL_LIMITS.nameMax} karakter.`)
    if (model.allowed_models.includes(candidate)) return setMessage(`${candidate} sudah ada di daftar.`)
    if (model.allowed_models.length >= MODEL_LIMITS.allowedMax) {
      return setMessage(`Daftar maksimal berisi ${MODEL_LIMITS.allowedMax} model.`)
    }
    onChange({ ...model, allowed_models: [...model.allowed_models, candidate] })
    setName('')
    setMessage(null)
  }

  function remove(item: string) {
    if (item === model.primary) {
      return setMessage(`${item} sedang dipilih sebagai model utama. Pilih model utama lain sebelum menghapusnya.`)
    }
    if (item === model.fallback) {
      return setMessage(`${item} sedang dipilih sebagai model cadangan. Pilih model cadangan lain sebelum menghapusnya.`)
    }
    onChange({ ...model, allowed_models: model.allowed_models.filter((entry) => entry !== item) })
    setMessage(null)
  }

  return (
    <div>
      <div className="allowed-add">
        <div className="field">
          <label htmlFor={`${id}-name`}>Nama Model Baru</label>
          <input
            id={`${id}-name`}
            type="text"
            maxLength={MODEL_LIMITS.nameMax}
            value={name}
            placeholder="mis. claude-sonnet-4-5"
            aria-describedby={`${id}-hint`}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                add()
              }
            }}
          />
          <p className="hint" id={`${id}-hint`}>
            Pakai nama versi yang spesifik, bukan alias.
          </p>
        </div>
        <button type="button" className="btn out" onClick={add}>
          <IconPlus size={16} aria-hidden="true" />
          Tambah Model
        </button>
      </div>
      {message ? (
        <div className="notice bad" role="alert" style={{ marginTop: 10 }}>
          <span>{message}</span>
        </div>
      ) : null}
      <ul className="chips allowed-list" aria-label="Model yang diizinkan">
        {model.allowed_models.map((item) => {
          const locked = item === model.primary || item === model.fallback
          return (
            <li key={item} className="allowed-item">
              <span>{item}</span>
              {item === model.primary ? <span className="tag t-acc">Utama</span> : null}
              {item === model.fallback ? <span className="tag t-info">Cadangan</span> : null}
              <button
                type="button"
                className="iconbtn"
                aria-label={`Hapus ${item}`}
                aria-disabled={locked || undefined}
                onClick={() => remove(item)}
              >
                <IconX size={16} aria-hidden="true" />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
