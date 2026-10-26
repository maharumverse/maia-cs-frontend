import { useEffect, useRef, type ReactNode } from 'react'
import { ButtonSpinner } from '@/components/Spinner'

interface ConfirmDialogProps {
  open: boolean
  title: string
  children: ReactNode
  confirmLabel: string
  destructive?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

// Konfirmasi untuk aksi yang tidak bisa dibatalkan. Isi harus menyebut nama record-nya.
// Fokus masuk ke tombol Batal, Escape menutup, dan fokus kembali ke pemicu.
export function ConfirmDialog({ open, title, children, confirmLabel, destructive, busy, onConfirm, onCancel }: ConfirmDialogProps) {
  const cancel = useRef<HTMLButtonElement>(null)
  const opener = useRef<Element | null>(null)
  // Pemanggil sering memberi fungsi baru di setiap render. Disimpan di ref supaya efek fokus
  // tidak ikut berjalan ulang dan merebut fokus dari input di dalam dialog.
  const handlers = useRef({ onCancel, busy })
  useEffect(() => {
    handlers.current = { onCancel, busy }
  })

  useEffect(() => {
    if (!open) return
    opener.current = document.activeElement
    cancel.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !handlers.current.busy) handlers.current.onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (opener.current instanceof HTMLElement) opener.current.focus()
    }
  }, [open])

  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={busy ? undefined : onCancel}>
      <div className="modal card" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(event) => event.stopPropagation()}>
        <h2 id="confirm-title">{title}</h2>
        <div className="modal-body">{children}</div>
        <div className="modal-actions">
          <button ref={cancel} type="button" className="btn out" onClick={onCancel} disabled={busy}>
            Batal
          </button>
          <button type="button" className={'btn ' + (destructive ? 'bad' : 'pri')} onClick={onConfirm} disabled={busy}>
            {busy ? <ButtonSpinner /> : null}
            {busy ? 'Memproses...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
