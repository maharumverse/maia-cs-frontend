import { useEffect, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

let registered = false

// Service worker diperbarui otomatis (registerType autoUpdate). Begitu versi baru aktif,
// pengguna diberi tahu dan memutuskan kapan memuat ulang, supaya isian form tidak hilang
// tanpa peringatan (pwa.rules.md).
export function UpdateNotice() {
  const [needsReload, setNeedsReload] = useState(false)

  useEffect(() => {
    if (registered) return
    registered = true
    registerSW({ immediate: true, onNeedReload: () => setNeedsReload(true) })
  }, [])

  if (!needsReload) return null

  return (
    <div className="update-notice" role="status">
      <span>Versi baru tersedia. Muat ulang untuk memakainya.</span>
      <button type="button" className="btn out sm" onClick={() => window.location.reload()}>
        Muat Ulang
      </button>
    </div>
  )
}
