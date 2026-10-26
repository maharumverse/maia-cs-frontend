import { useId } from 'react'
import type { BotSettings, LimitsConfig } from '@/api/types'
import { ErrorNotice } from '@/components/ErrorNotice'
import { PageSkeleton } from '@/components/Skeleton'
import { SaveBar } from '@/pages/settings-shared/SaveBar'
import { useSettingsSlice, type Slice } from '@/pages/settings-shared/useSettingsSlice'
import '@/pages/model/model.css'
import { ChannelCard } from './ChannelCard'
import { limitsHaveErrors, validateLimits } from './rules'

// Didefinisikan di luar komponen supaya identitasnya stabil (useSettingsSlice memoize pada slice).
const slice: Slice<LimitsConfig> = {
  pick: (settings: BotSettings) => settings.limits,
  merge: (settings: BotSettings, limits: LimitsConfig) => ({ ...settings, limits }),
}

export default function LimitPage() {
  const form = useSettingsSlice(slice)
  const { draft } = form

  return (
    <>
      <header className="pagehead">
        <h1>Limit</h1>
        <p>Batas pesan, rate limit, dan batas biaya harian per channel.</p>
      </header>
      {form.loadError ? (
        <ErrorNotice error={form.loadError} onRetry={() => void form.refetch()} />
      ) : form.loading || !draft ? (
        <PageSkeleton label="Memuat pengaturan limit..." />
      ) : (
        <LimitForm limits={draft} form={form} />
      )}
    </>
  )
}

function LimitForm({ limits, form }: { limits: LimitsConfig; form: ReturnType<typeof useSettingsSlice<LimitsConfig>> }) {
  const id = useId()
  const errors = validateLimits(limits)
  const cost = limits.daily_cost_limit ?? ''

  return (
    <div className="stack">
      <ChannelCard title="Channel Web" value={limits.web} errors={errors.web} onChange={(web) => form.change({ ...limits, web })} />
      <ChannelCard
        title="Channel WhatsApp"
        value={limits.whatsapp}
        errors={errors.whatsapp}
        onChange={(whatsapp) => form.change({ ...limits, whatsapp })}
      />

      <section className="card model-card" aria-labelledby={`${id}-biaya`}>
        <h2 id={`${id}-biaya`}>Batas Biaya Harian</h2>
        <div className="field">
          <label htmlFor={`${id}-nilai`}>Batas Biaya Harian (USD)</label>
          <input
            id={`${id}-nilai`}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="Kosong berarti tanpa batas"
            value={cost}
            aria-invalid={errors.cost ? true : undefined}
            aria-describedby={`${id}-hint${errors.cost ? ` ${id}-galat` : ''}`}
            onChange={(event) => {
              const text = event.target.value.trim()
              form.change({ ...limits, daily_cost_limit: text === '' ? null : text })
            }}
          />
          <p className="hint" id={`${id}-hint`}>
            Bila batas tercapai, bot berhenti menjawab dengan pesan fallback. Admin diberi peringatan di Ringkasan sebelum itu.
            Kosongkan untuk tanpa batas.
          </p>
          {errors.cost ? (
            <p className="hint field-error" id={`${id}-galat`}>
              {errors.cost}
            </p>
          ) : null}
        </div>
      </section>

      <SaveBar
        dirty={form.dirty}
        saving={form.saving}
        saved={form.saved}
        error={form.saveError}
        conflict={form.conflict}
        onSave={(note) => (limitsHaveErrors(errors) ? Promise.resolve(false) : form.submit(note))}
        onReset={form.reset}
        onReload={() => void form.reload()}
      />
    </div>
  )
}
