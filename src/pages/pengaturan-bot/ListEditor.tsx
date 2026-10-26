import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { IconPlus, IconTrash } from '@tabler/icons-react'

interface ListEditorProps {
  // "Sifat" / "Topik Terlarang" (Title Case) dan bentuk huruf kecilnya untuk kalimat.
  label: string
  noun: string
  items: string[]
  max: number
  maxChars: number
  onChange: (items: string[]) => void
  hint?: ReactNode
}

// Editor daftar teks: butir ditambah lewat input + tombol (atau Enter) dan dihapus satu per satu.
// Butir kosong atau lebih panjang dari batas ditolak di sini; backend tetap memvalidasi ulang.
export function ListEditor({ label, noun, items, max, maxChars, onChange, hint }: ListEditorProps) {
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const full = items.length >= max

  function add() {
    const value = text.trim()
    if (!value) return setError('Isi teks lebih dulu.')
    if (value.length > maxChars) return setError(`Maksimal ${maxChars} karakter.`)
    if (full) return setError(`Maksimal ${max} butir.`)
    onChange([...items, value])
    setText('')
    setError(null)
    input.current?.focus()
  }

  function remove(index: number) {
    onChange(items.filter((_, position) => position !== index))
    input.current?.focus()
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    add()
  }

  return (
    <fieldset className="list-editor">
      <legend>{label}</legend>
      {hint ? <p className="hint" id={`${id}-hint`}>{hint}</p> : null}
      {items.length > 0 ? (
        <ul className="list-items" aria-label={`Daftar ${noun}`}>
          {items.map((item, index) => (
            <li key={`${index}-${item}`}>
              <span>{item}</span>
              <button type="button" className="iconbtn" aria-label={`Hapus ${noun}: ${item}`} onClick={() => remove(index)}>
                <IconTrash size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">Belum ada {noun}.</p>
      )}
      <div className="list-add">
        <div className="field">
          <label htmlFor={`${id}-new`}>{`Tambah ${label}`}</label>
          <input
            ref={input}
            id={`${id}-new`}
            type="text"
            value={text}
            maxLength={maxChars}
            disabled={full}
            onChange={(event) => {
              setText(event.target.value)
              setError(null)
            }}
            onKeyDown={onKeyDown}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-err` : undefined}
          />
        </div>
        <button type="button" className="btn sm out" aria-label={`Tambah ${label} Baru`} disabled={full} onClick={add}>
          <IconPlus size={16} aria-hidden="true" />
          Tambah
        </button>
      </div>
      {error ? (
        <p className="field-error" id={`${id}-err`} role="alert">
          {error}
        </p>
      ) : null}
      <p className="hint" aria-live="polite">
        {items.length} dari {max} {noun}
      </p>
      {full ? <p className="hint">Batas jumlah {noun} sudah tercapai. Hapus satu untuk menambah yang baru.</p> : null}
    </fieldset>
  )
}
