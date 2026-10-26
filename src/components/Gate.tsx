import type { ReactNode } from 'react'
import { IconAlertTriangle, IconLoader2 } from '@tabler/icons-react'

// Tahan seluruh halaman selama sesi dicek (loading.component.md, Case 1).
export function Gate({ label }: { label: string }) {
  return (
    <div className="gate" role="status" aria-live="polite">
      <IconLoader2 className="gate-spin" size={28} aria-hidden="true" />
      <p>{label}</p>
    </div>
  )
}

// Layar penuh untuk kegagalan yang tidak bisa dilanjutkan, dengan satu aksi.
export function ErrorGate({ message, action }: { message: string; action: ReactNode }) {
  return (
    <div className="gate" role="alert">
      <IconAlertTriangle className="gate-icon" size={28} aria-hidden="true" />
      <p>{message}</p>
      {action}
    </div>
  )
}
