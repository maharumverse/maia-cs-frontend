import { IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight } from '@tabler/icons-react'
import { PAGE_SIZES } from '@/hooks/useUrlParams'

interface PagerProps {
  label: string
  total: number
  limit: number
  offset: number
  onPage: (page: number) => void
  onSize: (size: number) => void
}

// Satu pager di bawah tabel (pagination.component.md). Di batas, tombol dinonaktifkan, bukan dihapus.
// Pemanggil menyembunyikannya saat total nol.
export function Pager({ label, total, limit, offset, onPage, onSize }: PagerProps) {
  const pages = Math.max(1, Math.ceil(total / limit))
  const page = Math.min(pages, Math.floor(offset / limit) + 1)
  const from = total === 0 ? 0 : offset + 1
  const to = Math.min(total, offset + limit)

  return (
    <nav className="pager" aria-label={label}>
      <p className="pager-range" aria-live="polite">
        Menampilkan {from}-{to} dari {total}
      </p>
      <div className="pager-nav">
        <label className="pager-size">
          <span className="sr-only">Baris per halaman</span>
          <select value={limit} onChange={(event) => onSize(Number(event.target.value))}>
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size} per halaman
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="iconbtn" aria-label="Halaman pertama" disabled={page <= 1} onClick={() => onPage(1)}>
          <IconChevronsLeft size={16} aria-hidden="true" />
        </button>
        <button type="button" className="iconbtn" aria-label="Halaman sebelumnya" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <IconChevronLeft size={16} aria-hidden="true" />
        </button>
        <span className="pager-page">
          Halaman {page} dari {pages}
        </span>
        <button type="button" className="iconbtn" aria-label="Halaman berikutnya" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          <IconChevronRight size={16} aria-hidden="true" />
        </button>
        <button type="button" className="iconbtn" aria-label="Halaman terakhir" disabled={page >= pages} onClick={() => onPage(pages)}>
          <IconChevronsRight size={16} aria-hidden="true" />
        </button>
      </div>
    </nav>
  )
}
