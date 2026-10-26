import type { ReactNode } from 'react'
import type { Icon } from '@tabler/icons-react'

interface EmptyStateProps {
  icon: Icon
  message: string
  action?: ReactNode
}

// Keadaan kosong bersama: ikon redup, pesan redup, dan aksi opsional (uix.component.md).
export function EmptyState({ icon: IconComponent, message, action }: EmptyStateProps) {
  return (
    <div className="empty">
      <IconComponent size={28} aria-hidden="true" />
      <p>{message}</p>
      {action}
    </div>
  )
}
