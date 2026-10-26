import { IconDots, IconRefresh, IconTrash } from '@tabler/icons-react'
import { useCallback, useEffect, useRef, useState } from 'react'

interface RowMenuProps {
  filename: string
  disabled?: boolean
  onReingest: () => void
  onDelete: () => void
}

// Menu aksi lanjutan satu baris. Posisinya fixed supaya tidak terpotong .tablewrap yang menggulir.
export function RowMenu({ filename, disabled, onReingest, onDelete }: RowMenuProps) {
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const open = position !== null

  const close = useCallback((restoreFocus: boolean) => {
    setPosition(null)
    if (restoreFocus) trigger.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return
    menu.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus()
    const onPointer = (event: MouseEvent) => {
      if (event.target instanceof Node && !menu.current?.contains(event.target) && !trigger.current?.contains(event.target)) close(false)
    }
    const onDismiss = () => close(false)
    document.addEventListener('mousedown', onPointer)
    window.addEventListener('resize', onDismiss)
    window.addEventListener('scroll', onDismiss, true)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      window.removeEventListener('resize', onDismiss)
      window.removeEventListener('scroll', onDismiss, true)
    }
  }, [open, close])

  const toggle = () => {
    if (open) return close(false)
    const rect = trigger.current?.getBoundingClientRect()
    setPosition({ top: (rect?.bottom ?? 0) + 4, right: Math.max(8, window.innerWidth - (rect?.right ?? 0)) })
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      close(true)
      return
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()
    const items = Array.from(menu.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])
    const at = items.indexOf(document.activeElement as HTMLButtonElement)
    const next = event.key === 'ArrowDown' ? (at + 1) % items.length : (at - 1 + items.length) % items.length
    items[next]?.focus()
  }

  const pick = (action: () => void) => {
    close(false)
    action()
  }

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="iconbtn"
        aria-label={`Aksi lainnya untuk ${filename}`}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={toggle}
      >
        <IconDots size={16} aria-hidden="true" />
      </button>
      {open ? (
        <div ref={menu} role="menu" aria-label={`Aksi untuk ${filename}`} className="row-menu card" style={{ top: position.top, right: position.right }} onKeyDown={onKeyDown}>
          <button type="button" role="menuitem" onClick={() => pick(onReingest)}>
            <IconRefresh size={16} aria-hidden="true" />
            Proses Ulang
          </button>
          <hr />
          <button type="button" role="menuitem" className="danger" onClick={() => pick(onDelete)}>
            <IconTrash size={16} aria-hidden="true" />
            Hapus
          </button>
        </div>
      ) : null}
    </>
  )
}
