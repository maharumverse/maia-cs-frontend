import type { Schemas } from '@/api/types'

export type PlaygroundReply = Schemas['PlaygroundResponse']
export type HistoryTurn = Schemas['HistoryTurn']

export const MAX_HISTORY = 40
export const MAX_MESSAGE = 2000
// Batas teks per giliran riwayat di backend.
const MAX_HISTORY_TEXT = 4000

export interface ChatTurn {
  id: number
  role: 'user' | 'assistant'
  text: string
  // Hanya ada pada giliran bot: hasil lengkap dari backend untuk panel Dasar Jawaban.
  result?: PlaygroundReply
}

// Riwayat yang dikirim ke backend: 40 giliran terakhir, dimulai dari giliran pelanggan.
export function buildHistory(turns: ChatTurn[]): HistoryTurn[] {
  const recent = turns.slice(-MAX_HISTORY)
  const firstUser = recent.findIndex((turn) => turn.role === 'user')
  if (firstUser === -1) return []
  return recent.slice(firstUser).map((turn) => ({ role: turn.role, text: turn.text.slice(0, MAX_HISTORY_TEXT) }))
}
