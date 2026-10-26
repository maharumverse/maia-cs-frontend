import { describe, expect, it } from 'vitest'
import { buildHistory, type ChatTurn } from './history'

const turn = (i: number, role: ChatTurn['role']): ChatTurn => ({ id: i, role, text: `t${i}` })

describe('buildHistory', () => {
  it('mengubah giliran menjadi riwayat role/text tanpa hasil jawaban', () => {
    const turns: ChatTurn[] = [turn(1, 'user'), turn(2, 'assistant')]
    expect(buildHistory(turns)).toEqual([
      { role: 'user', text: 't1' },
      { role: 'assistant', text: 't2' },
    ])
  })

  it('memotong ke 40 giliran terakhir dan mulai dari giliran pelanggan', () => {
    // 50 giliran bergantian: user pada indeks genap. 40 terakhir dimulai dari indeks 10 (user).
    const turns = Array.from({ length: 50 }, (_, i) => turn(i, i % 2 === 0 ? 'user' : 'assistant'))
    const history = buildHistory(turns)
    expect(history).toHaveLength(40)
    expect(history[0]).toEqual({ role: 'user', text: 't10' })
    expect(history[39]).toEqual({ role: 'assistant', text: 't49' })
  })

  it('membuang giliran bot di awal bila pemotongan jatuh di tengah pasangan', () => {
    const turns = Array.from({ length: 49 }, (_, i) => turn(i, i % 2 === 0 ? 'user' : 'assistant'))
    // 40 terakhir mulai dari indeks 9 (bot), dibuang sehingga 39 giliran dimulai dari user indeks 10.
    const history = buildHistory(turns)
    expect(history).toHaveLength(39)
    expect(history[0]).toEqual({ role: 'user', text: 't10' })
  })

  it('memotong teks yang melebihi batas 4000 karakter milik backend', () => {
    const history = buildHistory([{ id: 1, role: 'user', text: 'a'.repeat(4500) }])
    expect(history[0]?.text).toHaveLength(4000)
  })
})
