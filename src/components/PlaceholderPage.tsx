import { IconTools } from '@tabler/icons-react'
import { EmptyState } from '@/components/EmptyState'
import { findSection } from '@/app/sections'

// Halaman sementara untuk milestone scaffold. Setiap halaman nyata menggantikannya
// dengan memakai loading, skeleton, dan keadaan kosong yang sama.
export function PlaceholderPage({ sectionKey }: { sectionKey: string }) {
  const section = findSection(sectionKey)
  return (
    <>
      <header className="pagehead">
        <h1>{section.label}</h1>
        <p>{section.description}</p>
      </header>
      <section className="card" aria-label={section.label}>
        <EmptyState icon={IconTools} message="Halaman ini belum dibangun." />
      </section>
    </>
  )
}
