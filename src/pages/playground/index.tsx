import { useState } from 'react'
import { useSettings } from '@/api/settings'
import { AnswerBasis } from './AnswerBasis'
import { Controls, type Channel, type Source } from './Controls'
import { Conversation } from './Conversation'
import { applyDraft, draftFrom, type DraftOverrides } from './draft'
import { useChatSession } from './useChatSession'
import './playground.css'

export default function PlaygroundPage() {
  const settingsQuery = useSettings()
  const active = settingsQuery.data?.data
  const session = useChatSession()

  const [channel, setChannel] = useState<Channel>('web')
  const [source, setSource] = useState<Source>('saved')
  // Draf hanya di state halaman. Selama belum diubah, draf mengikuti salinan pengaturan aktif.
  const [edited, setEdited] = useState<DraftOverrides | null>(null)
  const [input, setInput] = useState('')
  const [picked, setPicked] = useState<number | null>(null)

  const draft = edited ?? (active ? draftFrom(active) : null)
  const draftReady = source === 'saved' || (draft !== null && active !== undefined)

  const options = () => ({
    channel,
    settings: source === 'draft' && active && draft ? applyDraft(active, draft) : undefined,
  })

  const lastBot = [...session.turns].reverse().find((turn) => turn.role === 'assistant')
  const shown = session.turns.find((turn) => turn.id === picked && turn.role === 'assistant') ?? lastBot

  function submit() {
    const message = input.trim()
    if (!message) return
    setInput('')
    setPicked(null)
    void session.send(message, options())
  }

  function startNew() {
    session.reset()
    setPicked(null)
  }

  return (
    <>
      <header className="pagehead">
        <h1>Playground</h1>
        <p>Uji jawaban bot dari dashboard sebelum pengaturan disimpan.</p>
      </header>
      <p className="notice info">
        Pesan di sini tidak masuk riwayat percakapan, tetapi memanggil model sungguhan dan menimbulkan biaya kecil.
      </p>
      <div className="pg-layout">
        <div className="pg-side">
          <Controls
            channel={channel}
            onChannel={setChannel}
            source={source}
            onSource={setSource}
            active={active}
            activeError={settingsQuery.error}
            onRetryActive={() => void settingsQuery.refetch()}
            draft={draft}
            onDraft={setEdited}
            onResetDraft={() => setEdited(null)}
          />
          <AnswerBasis result={shown?.result} />
        </div>
        <Conversation
          turns={session.turns}
          pending={session.pending}
          error={session.error}
          onRetry={() => void session.retry(options())}
          selectedId={shown?.id ?? null}
          onSelect={setPicked}
          input={input}
          onInput={setInput}
          canSend={draftReady}
          onSubmit={submit}
          onNew={startNew}
        />
      </div>
    </>
  )
}
