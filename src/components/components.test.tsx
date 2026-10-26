import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { DataTable, type Column } from '@/components/DataTable'
import { Pager } from '@/components/Pager'
import { SearchBox } from '@/components/SearchBox'

interface Row {
  id: string
  name: string
}

const columns: Column<Row>[] = [
  { key: 'name', header: 'Nama', render: (row) => row.name },
  { key: 'id', header: 'Kode', render: (row) => row.id, numeric: true },
]

function table(props: Partial<React.ComponentProps<typeof DataTable<Row>>> = {}) {
  return (
    <DataTable<Row>
      caption="Daftar uji"
      columns={columns}
      rows={[{ id: '1', name: 'Satu' }]}
      rowKey={(row) => row.id}
      loading={false}
      emptyMessage="Belum ada data."
      {...props}
    />
  )
}

describe('DataTable', () => {
  it('menampilkan header dan baris', () => {
    render(table())
    expect(screen.getByRole('table', { name: 'Daftar uji' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Nama' })).toBeInTheDocument()
    expect(screen.getByText('Satu')).toBeInTheDocument()
  })

  it('memuat pertama: header tetap ada, baris diganti skeleton dan ada status untuk pembaca layar', () => {
    render(table({ rows: undefined, loading: true }))
    expect(screen.getByRole('columnheader', { name: 'Kode' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Memuat data...')
    expect(screen.queryByText('Belum ada data.')).not.toBeInTheDocument()
  })

  it('muat ulang: baris lama tetap tampil dan tabel ditandai sibuk', () => {
    const { container } = render(table({ loading: true, refetching: true }))
    expect(screen.getByText('Satu')).toBeInTheDocument()
    expect(container.querySelector('.tablewrap')).toHaveAttribute('aria-busy', 'true')
  })

  it('kosong: pesan tampil dan header tetap ada', () => {
    render(table({ rows: [] }))
    expect(screen.getByText('Belum ada data.')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Nama' })).toBeInTheDocument()
  })

  it('galat: pemberitahuan tampil, bukan keadaan kosong, dan bisa dicoba lagi', async () => {
    const retry = vi.fn()
    render(table({ rows: undefined, error: new ApiError(500, 'X', 'x'), onRetry: retry }))
    expect(screen.getByRole('alert')).toHaveTextContent('Server sedang bermasalah')
    expect(screen.queryByText('Belum ada data.')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Coba Lagi' }))
    expect(retry).toHaveBeenCalled()
  })

  it('galat saat muat ulang tetap menampilkan data lama', () => {
    render(table({ error: new ApiError(0, 'NETWORK_ERROR', 'x') }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Satu')).toBeInTheDocument()
  })

  it('klik baris memanggil pemanggil', async () => {
    const onRowClick = vi.fn()
    render(table({ onRowClick }))
    await userEvent.click(screen.getByText('Satu'))
    expect(onRowClick).toHaveBeenCalledWith({ id: '1', name: 'Satu' })
  })
})

describe('Pager', () => {
  function pager(offset: number, total = 137, limit = 20) {
    const onPage = vi.fn()
    const onSize = vi.fn()
    render(<Pager label="Paginasi daftar uji" total={total} limit={limit} offset={offset} onPage={onPage} onSize={onSize} />)
    return { onPage, onSize }
  }

  it('menampilkan rentang dan nomor halaman', () => {
    pager(20)
    expect(screen.getByText('Menampilkan 21-40 dari 137')).toBeInTheDocument()
    expect(screen.getByText('Halaman 2 dari 7')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Paginasi daftar uji' })).toBeInTheDocument()
  })

  it('halaman terakhir menampilkan sisa baris', () => {
    pager(120)
    expect(screen.getByText('Menampilkan 121-137 dari 137')).toBeInTheDocument()
  })

  it('di halaman pertama tombol mundur dinonaktifkan, bukan dihapus', () => {
    pager(0)
    expect(screen.getByRole('button', { name: 'Halaman pertama' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Halaman sebelumnya' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Halaman berikutnya' })).toBeEnabled()
  })

  it('di halaman terakhir tombol maju dinonaktifkan', () => {
    pager(120)
    expect(screen.getByRole('button', { name: 'Halaman berikutnya' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Halaman terakhir' })).toBeDisabled()
  })

  it('tombol memanggil halaman yang benar', async () => {
    const { onPage } = pager(40)
    await userEvent.click(screen.getByRole('button', { name: 'Halaman berikutnya' }))
    await userEvent.click(screen.getByRole('button', { name: 'Halaman sebelumnya' }))
    await userEvent.click(screen.getByRole('button', { name: 'Halaman pertama' }))
    await userEvent.click(screen.getByRole('button', { name: 'Halaman terakhir' }))
    expect((onPage.mock.calls as number[][]).map((call) => call[0])).toEqual([4, 2, 1, 7])
  })

  it('mengganti ukuran halaman', async () => {
    const { onSize } = pager(0)
    await userEvent.selectOptions(screen.getByRole('combobox'), '50')
    expect(onSize).toHaveBeenCalledWith(50)
  })

  it('satu halaman tetap menampilkan rentang dan kontrol ukuran', () => {
    pager(0, 5)
    expect(screen.getByText('Menampilkan 1-5 dari 5')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText('Halaman 1 dari 1')).toBeInTheDocument()
  })
})

describe('SearchBox', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  function search(value = '') {
    vi.useFakeTimers()
    const onChange = vi.fn()
    const view = render(<SearchBox label="Cari dokumen" value={value} onChange={onChange} />)
    return { onChange, ...view }
  }

  function type(text: string) {
    fireEvent.change(screen.getByRole('searchbox', { name: 'Cari dokumen' }), { target: { value: text } })
  }

  it('mengirim nilai setelah jeda 300 ms, bukan di setiap ketukan', () => {
    const { onChange } = search()
    for (const text of ['ke', 'kem', 'kemasan']) {
      type(text)
      act(() => {
        vi.advanceTimersByTime(100)
      })
    }
    expect(onChange).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('kemasan')
  })

  it('satu karakter berarti tanpa filter', () => {
    const { onChange } = search('abc')
    type('a')
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(onChange).toHaveBeenLastCalledWith('')
  })

  it('tidak memanggil ulang bila nilainya sama dengan yang sudah ada di URL', () => {
    const { onChange } = search('abc')
    type('abc')
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('mengikuti nilai dari URL yang berubah dari luar', () => {
    const { rerender } = search('lama')
    expect(screen.getByRole('searchbox')).toHaveValue('lama')
    rerender(<SearchBox label="Cari dokumen" value="baru" onChange={vi.fn()} />)
    expect(screen.getByRole('searchbox')).toHaveValue('baru')
  })
})

describe('ConfirmDialog', () => {
  function dialog(props: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(
      <ConfirmDialog open title="Hapus Dokumen" confirmLabel="Hapus" destructive onConfirm={onConfirm} onCancel={onCancel} {...props}>
        Dokumen faq.md akan dihapus.
      </ConfirmDialog>,
    )
    return { onConfirm, onCancel }
  }

  it('tidak merender apa pun saat tertutup', () => {
    dialog({ open: false })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('menyebut isi, memfokuskan Batal, dan tombol hapus berkelas destruktif', () => {
    dialog()
    const box = screen.getByRole('dialog', { name: 'Hapus Dokumen' })
    expect(within(box).getByText('Dokumen faq.md akan dihapus.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Batal' })).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Hapus' })).toHaveClass('bad')
  })

  it('Escape dan Batal membatalkan, konfirmasi menjalankan', async () => {
    const { onConfirm, onCancel } = dialog()
    await userEvent.keyboard('{Escape}')
    await userEvent.click(screen.getByRole('button', { name: 'Batal' }))
    expect(onCancel).toHaveBeenCalledTimes(2)
    await userEvent.click(screen.getByRole('button', { name: 'Hapus' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('saat sibuk kedua tombol dinonaktifkan dan Escape diabaikan', async () => {
    const { onCancel } = dialog({ busy: true })
    expect(screen.getByRole('button', { name: 'Batal' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Memproses/ })).toBeDisabled()
    await userEvent.keyboard('{Escape}')
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('fokus di input dalam dialog tidak direbut kembali saat onCancel berganti identitas', async () => {
    function Host() {
      const [text, setText] = useState('')
      return (
        <ConfirmDialog open title="Pulihkan" confirmLabel="Pulihkan" onConfirm={vi.fn()} onCancel={() => setText('')}>
          <input aria-label="Catatan" value={text} onChange={(event) => setText(event.target.value)} />
        </ConfirmDialog>
      )
    }
    render(<Host />)
    const input = screen.getByLabelText('Catatan')
    await userEvent.click(input)
    await userEvent.keyboard('abc')
    expect(input).toHaveValue('abc')
    expect(input).toHaveFocus()
  })

  it('mengembalikan fokus ke pemicu saat ditutup, bukan saat sibuk berganti', () => {
    function Host({ open, busy }: { open: boolean; busy?: boolean }) {
      return (
        <>
          <button type="button">Pemicu</button>
          <ConfirmDialog open={open} busy={busy} title="Hapus" confirmLabel="Hapus" onConfirm={vi.fn()} onCancel={vi.fn()}>
            isi
          </ConfirmDialog>
        </>
      )
    }
    const { rerender } = render(<Host open={false} />)
    screen.getByRole('button', { name: 'Pemicu' }).focus()
    rerender(<Host open />)
    expect(screen.getByRole('button', { name: 'Batal' })).toHaveFocus()
    rerender(<Host open busy />)
    expect(screen.getByRole('button', { name: 'Batal' })).toBeDisabled()
    rerender(<Host open={false} />)
    expect(screen.getByRole('button', { name: 'Pemicu' })).toHaveFocus()
  })
})
