import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ErrorNotice } from '@/components/ErrorNotice'
import { SaveBar } from '@/pages/settings-shared/SaveBar'
import { useSettingsSlice } from '@/pages/settings-shared/useSettingsSlice'
import { STATUS_KEY, useWhatsAppStatus } from './api'
import { BaileysPanel } from './BaileysPanel'
import { MetaPanel } from './MetaPanel'
import { CHANNEL_SLICE, validateChannel } from './model'
import { ProviderStatus } from './ProviderStatus'
import { WebSection } from './WebSection'
import { WhatsAppSection } from './WhatsAppSection'
import './channel.css'

export default function ChannelPage() {
  const settings = useSettingsSlice(CHANNEL_SLICE)
  const status = useWhatsAppStatus()
  const client = useQueryClient()
  const [attempted, setAttempted] = useState(false)
  const { draft } = settings

  const problems = draft ? validateChannel(draft) : []

  async function save(note: string): Promise<boolean> {
    if (problems.length > 0) {
      setAttempted(true)
      return false
    }
    setAttempted(false)
    const saved = await settings.submit(note)
    // Provider aktif bisa berubah karena simpanan ini, jadi status dan panelnya dimuat ulang.
    if (saved) void client.invalidateQueries({ queryKey: STATUS_KEY })
    return saved
  }

  function reset() {
    setAttempted(false)
    settings.reset()
  }

  const statusData = status.data
  const providerPending = Boolean(settings.dirty && draft && statusData && draft.whatsapp.provider !== statusData.provider)

  return (
    <>
      <header className="pagehead">
        <h1>Channel</h1>
        <p>Atur web widget dan WhatsApp, lalu pantau status sambungannya.</p>
      </header>

      {settings.loading ? (
        <div role="status" aria-live="polite">
          <span className="sr-only">Memuat pengaturan channel...</span>
          <div aria-hidden="true" className="stack">
            <div className="card skel-card">
              <div className="skel skel-block" />
            </div>
            <div className="card skel-card">
              <div className="skel skel-block" />
            </div>
          </div>
        </div>
      ) : !draft ? (
        <ErrorNotice error={settings.loadError} onRetry={() => void settings.refetch()} />
      ) : (
        <div className="stack">
          <WebSection value={draft.web} onChange={(web) => settings.change({ ...draft, web })} />
          <WhatsAppSection value={draft.whatsapp} onChange={(whatsapp) => settings.change({ ...draft, whatsapp })} />
          {attempted && problems.length > 0 ? (
            <div className="notice bad" role="alert">
              <div>
                <p>Perbaiki isian berikut sebelum menyimpan.</p>
                <ul>
                  {problems.map((problem) => (
                    <li key={problem}>{problem}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
          <SaveBar
            dirty={settings.dirty}
            saving={settings.saving}
            saved={settings.saved}
            error={settings.saveError}
            conflict={settings.conflict}
            onSave={save}
            onReset={reset}
            onReload={() => void settings.reload()}
          />
        </div>
      )}

      <div className="stack ch-live">
        {providerPending ? (
          <div className="notice info">
            <span>Provider baru berlaku setelah disimpan. Status dan panel di bawah masih mengikuti provider yang sedang aktif.</span>
          </div>
        ) : null}
        <ProviderStatus query={status} />
        {statusData?.provider === 'meta' ? <MetaPanel status={statusData} /> : null}
        {statusData?.provider === 'baileys' ? <BaileysPanel status={statusData} /> : null}
      </div>
    </>
  )
}
