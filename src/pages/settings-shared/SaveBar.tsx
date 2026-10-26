import { useState } from 'react'
import { IconDeviceFloppy } from '@tabler/icons-react'
import { ApiError, userMessage } from '@/api/errors'
import { ButtonSpinner } from '@/components/Spinner'

interface SaveBarProps {
  dirty: boolean
  saving: boolean
  saved: boolean
  error: unknown
  conflict: boolean
  onSave: (note: string) => Promise<boolean>
  onReset: () => void
  onReload: () => void
}

// Bilah simpan bersama untuk halaman pengaturan: catatan perubahan opsional, simpan, batalkan,
// dan pesan konflik atau galat. Tepat satu tombol utama (button.component.md).
export function SaveBar({ dirty, saving, saved, error, conflict, onSave, onReset, onReload }: SaveBarProps) {
  const [note, setNote] = useState('')

  async function save() {
    if (await onSave(note)) setNote('')
  }

  return (
    <section className="card savebar" aria-label="Simpan perubahan">
      {conflict ? (
        <div className="notice warn" role="alert">
          <span>Pengaturan sudah diubah orang lain. Muat ulang untuk melihat versi terbaru; perubahan Anda di halaman ini akan dibuang.</span>
          <button type="button" className="btn sm out" onClick={onReload}>
            Muat Ulang
          </button>
        </div>
      ) : error ? (
        <div className="notice bad" role="alert">
          <span>{error instanceof ApiError ? userMessage(error) : 'Pengaturan tidak bisa disimpan.'}</span>
        </div>
      ) : null}
      {saved && !error ? (
        <div className="notice ok" role="status">
          <span>Pengaturan tersimpan sebagai versi baru dan langsung berlaku.</span>
        </div>
      ) : null}
      <div className="savebar-row">
        <label className="field savebar-note">
          <span>Catatan Perubahan (opsional)</span>
          <input type="text" maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} disabled={saving} />
        </label>
        <div className="row-actions">
          <button type="button" className="btn out" onClick={onReset} disabled={!dirty || saving}>
            Batalkan Perubahan
          </button>
          <button type="button" className="btn pri" onClick={() => void save()} disabled={!dirty || saving || conflict}>
            {saving ? <ButtonSpinner /> : <IconDeviceFloppy size={16} aria-hidden="true" />}
            {saving ? 'Memproses...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>
    </section>
  )
}
