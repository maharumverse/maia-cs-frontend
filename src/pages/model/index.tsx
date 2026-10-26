import { ErrorNotice } from '@/components/ErrorNotice'
import { PageSkeleton } from '@/components/Skeleton'
import type { BotSettings, ModelConfig } from '@/api/types'
import { SaveBar } from '@/pages/settings-shared/SaveBar'
import { useSettingsSlice, type Slice } from '@/pages/settings-shared/useSettingsSlice'
import { AllowedModels } from './AllowedModels'
import { ModelTester } from './ModelTester'
import { NumberField } from './NumberField'
import { MODEL_LIMITS, hasErrors, ignoresTemperature, validateModel } from './rules'
import './model.css'

// Didefinisikan di luar komponen supaya identitasnya stabil (useSettingsSlice memoize pada slice).
const slice: Slice<ModelConfig> = {
  pick: (settings: BotSettings) => settings.model,
  merge: (settings: BotSettings, model: ModelConfig) => ({ ...settings, model }),
}

const TEMPERATURE_HINT = 'Tidak berpengaruh pada model generasi 5 (mis. claude-sonnet-5-5), yang hanya menerima nilai bawaan.'

export default function ModelPage() {
  const form = useSettingsSlice(slice)
  const { draft } = form

  return (
    <>
      <header className="pagehead">
        <h1>Model</h1>
        <p>Model utama dan model fallback beserta parameternya.</p>
      </header>
      {form.loadError ? (
        <ErrorNotice error={form.loadError} onRetry={() => void form.refetch()} />
      ) : form.loading || !draft ? (
        <PageSkeleton label="Memuat pengaturan model..." />
      ) : (
        <ModelForm model={draft} form={form} />
      )}
    </>
  )
}

function ModelForm({ model, form }: { model: ModelConfig; form: ReturnType<typeof useSettingsSlice<ModelConfig>> }) {
  const errors = validateModel(model)
  const set = (patch: Partial<ModelConfig>) => form.change({ ...model, ...patch })
  const selectable = (current: string | null | undefined) =>
    current && !model.allowed_models.includes(current) ? [current] : []
  const { maxTokens, timeoutSeconds, maxRetries, temperature } = MODEL_LIMITS
  const noEffect = ignoresTemperature(model.primary)

  return (
    <div className="stack">
      <section className="card model-card" aria-labelledby="model-pilihan">
        <h2 id="model-pilihan">Pemilihan Model</h2>
        <p className="muted">Pilihan hanya dari daftar model yang diizinkan di bawah.</p>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="model-utama">Model Utama</label>
            <select
              id="model-utama"
              value={model.primary}
              aria-invalid={errors.primary ? true : undefined}
              onChange={(event) => set({ primary: event.target.value })}
            >
              {[...model.allowed_models, ...selectable(model.primary)].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            {errors.primary ? <p className="hint field-error">{errors.primary}</p> : null}
          </div>
          <div className="field">
            <label htmlFor="model-cadangan">Model Cadangan</label>
            <select
              id="model-cadangan"
              value={model.fallback ?? ''}
              aria-invalid={errors.fallback ? true : undefined}
              onChange={(event) => set({ fallback: event.target.value || null })}
            >
              <option value="">Tanpa model cadangan</option>
              {[...model.allowed_models, ...selectable(model.fallback)].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <p className="hint">Dipakai bila model utama tidak menjawab.</p>
            {errors.fallback ? <p className="hint field-error">{errors.fallback}</p> : null}
          </div>
        </div>
        <h3 style={{ fontSize: 13.5, marginBottom: 6 }}>Model yang Diizinkan</h3>
        <AllowedModels model={model} onChange={form.change} />
      </section>

      <section className="card model-card" aria-labelledby="model-parameter">
        <h2 id="model-parameter">Parameter</h2>
        <div className="grid-2">
          <NumberField
            label="Maksimum Token"
            value={model.max_tokens}
            min={maxTokens.min}
            max={maxTokens.max}
            hint="Panjang maksimum satu jawaban."
            error={errors.max_tokens}
            onChange={(value) => set({ max_tokens: value })}
          />
          <NumberField
            label="Batas Waktu (Detik)"
            value={model.timeout_seconds}
            min={timeoutSeconds.min}
            max={timeoutSeconds.max}
            hint="Menunggu jawaban model sebelum dianggap gagal."
            error={errors.timeout_seconds}
            onChange={(value) => set({ timeout_seconds: value })}
          />
          <NumberField
            label="Percobaan Ulang Maksimum"
            value={model.max_retries}
            min={maxRetries.min}
            max={maxRetries.max}
            error={errors.max_retries}
            onChange={(value) => set({ max_retries: value })}
          />
          <NumberField
            label="Temperature"
            value={model.temperature}
            min={temperature.min}
            max={temperature.max}
            step="0.05"
            hint={noEffect ? TEMPERATURE_HINT : 'Antara 0 (konsisten) dan 1 (bervariasi).'}
            error={errors.temperature}
            onChange={(value) => set({ temperature: value })}
          />
        </div>
      </section>

      <section className="card model-card" aria-labelledby="model-tes">
        <h2 id="model-tes">Tes Model</h2>
        <p className="muted">
          Tes memanggil model sungguhan dan menimbulkan biaya sangat kecil. Hasilnya tidak menyimpan apa pun.
        </p>
        <ModelTester key={`utama-${model.primary}`} model={model.primary} role="utama" />
        {model.fallback ? <ModelTester key={`cadangan-${model.fallback}`} model={model.fallback} role="cadangan" /> : null}
      </section>

      <SaveBar
        dirty={form.dirty}
        saving={form.saving}
        saved={form.saved}
        error={form.saveError}
        conflict={form.conflict}
        onSave={(note) => (hasErrors(errors) ? Promise.resolve(false) : form.submit(note))}
        onReset={form.reset}
        onReload={() => void form.reload()}
      />
    </div>
  )
}
