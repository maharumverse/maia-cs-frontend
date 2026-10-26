import { useRef, useState } from 'react'
import { parseApiError, type ApiError } from '@/api/errors'
import { getHttp } from '@/api/client'
import type { BotSettings } from '@/api/types'
import { buildHistory, type ChatTurn, type PlaygroundReply } from './history'

interface SendOptions {
  channel: 'web' | 'whatsapp'
  // Pengaturan draf lengkap, atau undefined untuk memakai pengaturan aktif di server.
  settings: BotSettings | undefined
}

// Percakapan uji: semua state hidup di halaman, tidak ada yang disimpan di server atau browser.
export function useChatSession() {
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const nextId = useRef(1)
  // Naik setiap "Percakapan Baru" supaya jawaban yang terlambat dari percakapan lama dibuang.
  const epoch = useRef(0)

  async function run(base: ChatTurn[], userTurn: ChatTurn, options: SendOptions) {
    const current = epoch.current
    setError(null)
    setPending(true)
    setTurns([...base, userTurn])
    try {
      const response = await getHttp().post<PlaygroundReply>('playground/chat', {
        message: userTurn.text,
        channel: options.channel,
        history: buildHistory(base),
        ...(options.settings ? { settings: options.settings } : {}),
      })
      if (epoch.current !== current) return
      setTurns((all) => [...all, { id: nextId.current++, role: 'assistant', text: response.data.text, result: response.data }])
    } catch (caught) {
      if (epoch.current !== current) return
      setError(parseApiError(caught))
    } finally {
      if (epoch.current === current) setPending(false)
    }
  }

  // Pesan baru. Pesan yang gagal sebelumnya (giliran pelanggan terakhir tanpa balasan) dibuang
  // karena pelanggan memilih menulis hal lain.
  async function send(message: string, options: SendOptions) {
    const base = error ? turns.slice(0, -1) : turns
    await run(base, { id: nextId.current++, role: 'user', text: message }, options)
  }

  async function retry(options: SendOptions) {
    const failed = turns[turns.length - 1]
    if (!error || failed?.role !== 'user') return
    await run(turns.slice(0, -1), failed, options)
  }

  function reset() {
    epoch.current += 1
    setTurns([])
    setError(null)
    setPending(false)
  }

  return { turns, pending, error, send, retry, reset }
}
