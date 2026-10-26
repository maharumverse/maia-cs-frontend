import { ListEditor } from './ListEditor'
import { MAX_ORIGINS, normalizeOrigin, originError, type ChannelDraft } from './model'

interface WebSectionProps {
  value: ChannelDraft['web']
  onChange: (value: ChannelDraft['web']) => void
}

export function WebSection({ value, onChange }: WebSectionProps) {
  return (
    <section className="card" aria-labelledby="ch-web-title">
      <h2 id="ch-web-title">Web Widget</h2>
      <p className="muted">Widget chat di website Anda hanya bisa dipakai dari domain yang terdaftar di sini.</p>
      <ListEditor
        label="Domain yang Diizinkan"
        addLabel="Tambah Domain"
        items={value.allowed_origins ?? []}
        onChange={(items) => onChange({ ...value, allowed_origins: items })}
        normalize={normalizeOrigin}
        validate={originError}
        max={MAX_ORIGINS}
        placeholder="https://www.contoh.co.id"
        inputMode="url"
        emptyText="Belum ada domain. Widget belum bisa dipakai dari website mana pun."
        hint="Tulis origin lengkap: http atau https, lalu host dan port bila perlu. Tanpa path dan tanpa wildcard."
      />
      <div className="notice info">
        <span>Cuplikan kode pemasangan widget belum tersedia; widget dibangun di milestone 8.</span>
      </div>
    </section>
  )
}
