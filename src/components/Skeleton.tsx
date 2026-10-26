// Penanda tempat untuk layout yang sudah diketahui (skeleton.component.md).
// Ukuran datang dari pemakai lewat kelas, bukan dari .skel.
export function PageSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">
        <div className="skel skel-title" />
        <div className="skel skel-line" />
        <div className="card skel-card">
          <div className="skel skel-block" />
        </div>
      </div>
    </div>
  )
}
