import { IconMessages, IconRefresh, IconSend } from '@tabler/icons-react'
import { useEffect, useRef, type KeyboardEvent } from 'react'
import type { ApiError } from '@/api/errors'
import { EmptyState } from '@/components/EmptyState'
import { ErrorNotice } from '@/components/ErrorNotice'
import { formatNumber } from '@/lib/format'
import { EXAMPLES } from './examples'
import { MAX_MESSAGE, type ChatTurn } from './history'

interface ConversationProps {
  turns: ChatTurn[]
  pending: boolean
  error: ApiError | null
  onRetry: () => void
  selectedId: number | null
  onSelect: (id: number) => void
  input: string
  onInput: (value: string) => void
  canSend: boolean
  onSubmit: () => void
  onNew: () => void
}

export function Conversation(props: ConversationProps) {
  const { turns, pending, error, input } = props
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const log = logRef.current
    if (log) log.scrollTop = log.scrollHeight
  }, [turns.length, pending, error])

  const remaining = MAX_MESSAGE - input.length
  const blank = input.trim() === ''
  const disabled = pending || !props.canSend || blank || remaining < 0

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    if (!disabled) props.onSubmit()
  }

  return (
    <section className="card pg-pad pg-chat" aria-labelledby="pg-chat-title">
      <h2 id="pg-chat-title" className="pg-h2">
        Percakapan Uji
      </h2>

      <div className="pg-log" ref={logRef} role="log" aria-label="Riwayat percakapan uji">
        {turns.length === 0 && !pending ? (
          <EmptyState
            icon={IconMessages}
            message="Belum ada percakapan. Tulis pertanyaan atau pilih salah satu contoh."
            action={
              <div className="chips">
                {EXAMPLES.map((example) => (
                  <button key={example} type="button" className="btn sm ghost" onClick={() => props.onInput(example)}>
                    {example}
                  </button>
                ))}
              </div>
            }
          />
        ) : (
          turns.map((turn) =>
            turn.role === 'user' ? (
              <div key={turn.id} className="pg-msg user">
                <span className="pg-who">Pelanggan</span>
                <p className="pg-text">{turn.text}</p>
              </div>
            ) : (
              <div key={turn.id} className="pg-msg bot">
                <span className="pg-who">
                  Bot
                  {turn.result?.settings === 'draft' && <span className="tag t-warn">Draf — tidak disimpan</span>}
                </span>
                <button
                  type="button"
                  className={`pg-bubble${props.selectedId === turn.id ? ' on' : ''}`}
                  aria-pressed={props.selectedId === turn.id}
                  onClick={() => props.onSelect(turn.id)}
                >
                  {turn.text}
                </button>
              </div>
            ),
          )
        )}
        {pending && (
          <p className="pg-typing muted" role="status">
            Bot sedang mengetik...
          </p>
        )}
        {error && <ErrorNotice error={error} onRetry={props.onRetry} />}
      </div>

      <div className="field pg-input">
        <label htmlFor="pg-message" className="sr-only">
          Pesan Uji
        </label>
        <textarea
          id="pg-message"
          className="inp"
          rows={3}
          maxLength={MAX_MESSAGE}
          placeholder="Tulis pesan sebagai pelanggan. Enter untuk kirim, Shift+Enter untuk baris baru."
          aria-describedby="pg-count"
          value={input}
          onChange={(event) => props.onInput(event.target.value)}
          onKeyDown={onKeyDown}
        />
        <p id="pg-count" className={`hint${remaining < 0 ? ' pg-over' : ''}`}>
          {remaining >= 0 ? `Sisa ${formatNumber(remaining)} karakter` : `Lebih ${formatNumber(-remaining)} karakter`}
        </p>
      </div>
      <div className="row-actions">
        <button type="button" className="btn out" onClick={props.onNew}>
          <IconRefresh size={16} aria-hidden="true" />
          Percakapan Baru
        </button>
        <button type="button" className="btn pri" disabled={disabled} onClick={props.onSubmit}>
          <IconSend size={16} aria-hidden="true" />
          Kirim
        </button>
      </div>
    </section>
  )
}
