import { Link } from 'react-router-dom'
import { IconError404 } from '@tabler/icons-react'
import { EmptyState } from '@/components/EmptyState'

export default function NotFoundPage() {
  return (
    <>
      <header className="pagehead">
        <h1>Halaman Tidak Ditemukan</h1>
      </header>
      <section className="card">
        <EmptyState
          icon={IconError404}
          message="Alamat yang Anda buka tidak ada di MAIA CS."
          action={
            <Link className="btn" to="/">
              Kembali ke Ringkasan
            </Link>
          }
        />
      </section>
    </>
  )
}
