import { useEffect, useRef, useState } from 'react'
import { IconSearch } from '@tabler/icons-react'

interface SearchBoxProps {
  label: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  // Pencarian teks bebas memerlukan minimal dua karakter; kurang dari itu berarti tanpa filter.
  minLength?: number
}

// Kotak pencarian dengan debounce 300 ms (search.component.md). Nilai awal dari URL; hasilnya
// dikirim ke pemanggil yang menyimpannya di URL.
export function SearchBox({ label, placeholder, value, onChange, minLength = 2 }: SearchBoxProps) {
  const [text, setText] = useState(value)
  const last = useRef(value)

  // URL berubah dari luar (tombol Kembali, reset filter): ikuti.
  useEffect(() => {
    if (value !== last.current) {
      last.current = value
      setText(value)
    }
  }, [value])

  useEffect(() => {
    const effective = text.trim().length >= minLength ? text.trim() : ''
    if (effective === last.current) return
    const timer = setTimeout(() => {
      last.current = effective
      onChange(effective)
    }, 300)
    return () => clearTimeout(timer)
  }, [text, minLength, onChange])

  return (
    <label className="search">
      <span className="sr-only">{label}</span>
      <IconSearch size={16} aria-hidden="true" />
      <input type="search" value={text} placeholder={placeholder ?? label} maxLength={100} onChange={(event) => setText(event.target.value)} />
    </label>
  )
}
