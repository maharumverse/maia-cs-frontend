import { IconRotate } from '@tabler/icons-react'
import { ErrorNotice } from '@/components/ErrorNotice'
import type { BotSettings } from '@/api/types'
import { DraftEditor } from './DraftEditor'
import type { DraftOverrides } from './draft'

export type Channel = 'web' | 'whatsapp'
export type Source = 'saved' | 'draft'

interface ControlsProps {
  channel: Channel
  onChannel: (channel: Channel) => void
  source: Source
  onSource: (source: Source) => void
  active: BotSettings | undefined
  activeError: unknown
  onRetryActive: () => void
  draft: DraftOverrides | null
  onDraft: (draft: DraftOverrides) => void
  onResetDraft: () => void
}

const CHANNELS: { value: Channel; label: string }[] = [
  { value: 'web', label: 'Web' },
  { value: 'whatsapp', label: 'WhatsApp' },
]

const SOURCES: { value: Source; label: string }[] = [
  { value: 'saved', label: 'Pengaturan Tersimpan' },
  { value: 'draft', label: 'Draf (belum disimpan)' },
]

export function Controls(props: ControlsProps) {
  const { source, active, draft } = props
  return (
    <section className="card pg-pad" aria-label="Kontrol Uji">
      <fieldset className="pg-group">
        <legend>Channel Simulasi</legend>
        {CHANNELS.map((item) => (
          <label key={item.value} className="pg-radio">
            <input
              type="radio"
              name="pg-channel"
              checked={props.channel === item.value}
              onChange={() => props.onChannel(item.value)}
            />
            {item.label}
          </label>
        ))}
        {props.channel === 'whatsapp' && <p className="hint">Memakai gaya prompt WhatsApp.</p>}
      </fieldset>

      <fieldset className="pg-group">
        <legend>Pengaturan yang Diuji</legend>
        {SOURCES.map((item) => (
          <label key={item.value} className="pg-radio">
            <input
              type="radio"
              name="pg-source"
              checked={source === item.value}
              onChange={() => props.onSource(item.value)}
            />
            {item.label}
          </label>
        ))}
      </fieldset>

      {source === 'draft' && (
        <>
          {props.activeError ? (
            <ErrorNotice error={props.activeError} onRetry={props.onRetryActive} />
          ) : !draft || !active ? (
            <p className="muted" role="status">
              Memuat pengaturan aktif...
            </p>
          ) : (
            <>
              <DraftEditor draft={draft} active={active} onChange={props.onDraft} />
              <div className="row-actions">
                <button type="button" className="btn out" onClick={props.onResetDraft}>
                  <IconRotate size={16} aria-hidden="true" />
                  Reset Draf
                </button>
              </div>
              <p className="hint">Draf hanya ada di halaman ini dan hilang saat dimuat ulang.</p>
            </>
          )}
        </>
      )}
    </section>
  )
}
