import { IconAlertTriangle } from '@tabler/icons-react'
import { ApiError, userMessage } from '@/api/errors'

interface ErrorNoticeProps {
  error: unknown
  onRetry?: () => void
}

// Galat gagal-memuat yang tidak boleh terlihat seperti data kosong (table.component.md).
export function ErrorNotice({ error, onRetry }: ErrorNoticeProps) {
  const message = error instanceof ApiError ? userMessage(error) : 'Terjadi kesalahan yang tidak terduga.'
  return (
    <div className="notice bad" role="alert">
      <IconAlertTriangle size={18} aria-hidden="true" />
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="btn sm out" onClick={onRetry}>
          Coba Lagi
        </button>
      )}
    </div>
  )
}
