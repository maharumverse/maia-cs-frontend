import { useId } from 'react'
import { LIMITS } from './botConfig'
import { TextAreaField } from './fields'
import { ListEditor } from './ListEditor'

interface Props {
  systemPrompt: string
  forbiddenTopics: string[]
  onPrompt: (value: string) => void
  onTopics: (value: string[]) => void
}

export function PromptSection({ systemPrompt, forbiddenTopics, onPrompt, onTopics }: Props) {
  const headingId = useId()
  return (
    <section className="card" aria-labelledby={headingId}>
      <h2 id={headingId}>Instruksi Jawaban</h2>
      <p className="muted section-intro">Aturan yang selalu dikirim ke model bersama dokumen dan pertanyaan pelanggan.</p>
      <div className="stack">
        <TextAreaField label="System Prompt" value={systemPrompt} maxLength={LIMITS.systemPrompt} rows={14} onChange={onPrompt} />
        <ListEditor
          label="Topik Terlarang"
          noun="topik terlarang"
          items={forbiddenTopics}
          max={LIMITS.forbiddenTopicsMax}
          maxChars={LIMITS.itemMaxChars}
          onChange={onTopics}
          hint={`Penolakan karena topik di daftar ini dicap "topik terlarang" pada percakapan. Maksimal ${LIMITS.forbiddenTopicsMax} topik, masing-masing sampai ${LIMITS.itemMaxChars} karakter.`}
        />
      </div>
    </section>
  )
}
