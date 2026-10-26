import { ErrorNotice } from '@/components/ErrorNotice'
import { PageSkeleton } from '@/components/Skeleton'
import type { BotConfig } from '@/api/types'
import { SaveBar } from '@/pages/settings-shared/SaveBar'
import { useSettingsSlice } from '@/pages/settings-shared/useSettingsSlice'
import { BOT_SLICE, validateBot, type Persona } from './botConfig'
import { ContextSection } from './ContextSection'
import { MessagesSection } from './MessagesSection'
import { PersonaSection } from './PersonaSection'
import { PromptSection } from './PromptSection'
import { VersionHistory } from './VersionHistory'
import './pengaturan-bot.css'

// Cadangan bila backend tidak mengirim persona (field opsional di skema); nilai sama dengan default backend.
const EMPTY_PERSONA: Persona = { name: '', role: '', address_term: '', traits: [], speaking_style: '', emoji: 'sparing' }

export default function PengaturanBotPage() {
  const { draft, version, loadError, refetch, dirty, change, reset, submit, saving, saveError, conflict, reload, saved } = useSettingsSlice<BotConfig>(BOT_SLICE)

  return (
    <>
      <header className="pagehead">
        <h1>Pengaturan Bot</h1>
        <p>Atur identitas, instruksi, pesan, dan cara bot memakai dokumen. Setiap penyimpanan menjadi versi baru yang langsung berlaku.</p>
      </header>
      {loadError ? (
        <ErrorNotice error={loadError} onRetry={() => void refetch()} />
      ) : draft === undefined || version === undefined ? (
        <PageSkeleton label="Memuat pengaturan bot..." />
      ) : (
        <>
          <BotForm
            bot={draft}
            dirty={dirty}
            onChange={change}
            saveBar={{ dirty, saving, saved, error: saveError, conflict, onSave: submit, onReset: reset, onReload: () => void reload() }}
          />
          <VersionHistory activeVersion={version} dirty={dirty} />
        </>
      )}
    </>
  )
}

interface BotFormProps {
  bot: BotConfig
  dirty: boolean
  onChange: (bot: BotConfig) => void
  saveBar: Omit<React.ComponentProps<typeof SaveBar>, 'onSave'> & { onSave: (note: string) => Promise<boolean> }
}

function BotForm({ bot, dirty, onChange, saveBar }: BotFormProps) {
  const errors = validateBot(bot)
  const invalid = Object.keys(errors).length > 0
  const patch = (change: Partial<BotConfig>) => onChange({ ...bot, ...change })

  return (
    <form onSubmit={(event) => event.preventDefault()} noValidate>
      <PersonaSection persona={bot.persona ?? EMPTY_PERSONA} errors={errors} onChange={(persona) => patch({ persona })} />
      <PromptSection
        systemPrompt={bot.system_prompt}
        forbiddenTopics={bot.forbidden_topics ?? []}
        onPrompt={(system_prompt) => patch({ system_prompt })}
        onTopics={(forbidden_topics) => patch({ forbidden_topics })}
      />
      <MessagesSection
        greeting={bot.greeting}
        fallback={bot.fallback_message}
        onGreeting={(greeting) => patch({ greeting })}
        onFallback={(fallback_message) => patch({ fallback_message })}
      />
      <ContextSection bot={bot} errors={errors} onChange={patch} />
      {dirty && invalid ? (
        <div className="notice warn" role="alert">
          <span>Ada isian yang belum benar. Perbaiki dulu sebelum menyimpan.</span>
        </div>
      ) : null}
      <SaveBar {...saveBar} onSave={(note) => (invalid ? Promise.resolve(false) : saveBar.onSave(note))} />
    </form>
  )
}
