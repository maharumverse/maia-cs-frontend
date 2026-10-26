import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, NETWORK_ERROR } from '@/api/errors'
import type { Identity } from '@/api/auth'
import LoginPage from '@/pages/Login'
import { loginErrorMessage } from '@/pages/loginErrors'

const { fetchSession, login } = vi.hoisted(() => ({ fetchSession: vi.fn(), login: vi.fn() }))

vi.mock('@/api/auth', () => ({ fetchSession, login, logout: vi.fn() }))

const admin: Identity = { nip: '20230101', groups: ['admin'], is_admin: true }

function Landing() {
  const location = useLocation()
  return <p data-testid="lokasi">{`${location.pathname}${location.search}`}</p>
}

function renderLogin(entry = '/masuk') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/masuk" element={<LoginPage />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com')
  vi.stubEnv('VITE_AUTH_MODE', 'stopgap')
  fetchSession.mockResolvedValue(null)
})

describe('loginErrorMessage', () => {
  it('memetakan kondisi ke satu kalimat yang menyebut langkah berikutnya', () => {
    expect(loginErrorMessage(new ApiError(401, 'INVALID_CREDENTIALS', 'NIP atau kata sandi salah'))).toBe(
      'NIP atau kata sandi salah. Periksa lagi, lalu coba masuk.',
    )
    expect(loginErrorMessage(new ApiError(429, 'RATE_LIMITED', 'x'))).toBe(
      'Terlalu banyak percobaan masuk. Tunggu beberapa menit, lalu coba lagi.',
    )
    expect(loginErrorMessage(new ApiError(500, 'INTERNAL_ERROR', 'x'))).toBe(
      'Server sedang bermasalah. Coba lagi sebentar lagi.',
    )
    expect(loginErrorMessage(new ApiError(0, NETWORK_ERROR, 'x'))).toBe(
      'Tidak bisa menghubungi server. Periksa koneksi, lalu coba lagi.',
    )
  })
})

describe('LoginPage', () => {
  it('menampilkan form dengan urutan dan label dari login.component.md', async () => {
    renderLogin()
    expect(await screen.findByRole('heading', { name: 'Masuk' })).toBeInTheDocument()
    expect(screen.getByLabelText('NIP')).toBeInTheDocument()
    expect(screen.getByLabelText('Kata Sandi')).toHaveAttribute('type', 'password')
    expect(screen.getByRole('button', { name: 'Masuk' })).toBeInTheDocument()
  })

  it('menampilkan dan menyembunyikan kata sandi lewat tombol toggle', async () => {
    renderLogin()
    const input = await screen.findByLabelText('Kata Sandi')
    await userEvent.click(screen.getByRole('button', { name: 'Tampilkan kata sandi' }))
    expect(input).toHaveAttribute('type', 'text')
    await userEvent.click(screen.getByRole('button', { name: 'Sembunyikan kata sandi' }))
    expect(input).toHaveAttribute('type', 'password')
  })

  it('mengirim NIP yang sudah di-trim dan kata sandi apa adanya', async () => {
    login.mockResolvedValue(admin)
    renderLogin()
    await userEvent.type(await screen.findByLabelText('NIP'), '  20230101  ')
    await userEvent.type(screen.getByLabelText('Kata Sandi'), ' rahasia ')
    await userEvent.click(screen.getByRole('button', { name: 'Masuk' }))
    expect(login).toHaveBeenCalledTimes(1)
    expect(login.mock.calls[0]?.[0]).toEqual({ nip: '20230101', password: ' rahasia ' })
  })

  it('setelah gagal: menampilkan pesan, mengosongkan kata sandi, dan mempertahankan NIP', async () => {
    login.mockRejectedValue(new ApiError(401, 'INVALID_CREDENTIALS', 'NIP atau kata sandi salah'))
    renderLogin()
    await userEvent.type(await screen.findByLabelText('NIP'), '20230101')
    await userEvent.type(screen.getByLabelText('Kata Sandi'), 'salah')
    await userEvent.click(screen.getByRole('button', { name: 'Masuk' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'NIP atau kata sandi salah. Periksa lagi, lalu coba masuk.',
    )
    expect(screen.getByLabelText('Kata Sandi')).toHaveValue('')
    expect(screen.getByLabelText('NIP')).toHaveValue('20230101')
  })

  it('setelah berhasil: kembali ke halaman yang dituju, lengkap dengan query', async () => {
    login.mockResolvedValue(admin)
    renderLogin('/masuk?next=%2Fpercakapan%3Fhal%3D2')
    await userEvent.type(await screen.findByLabelText('NIP'), '20230101')
    await userEvent.type(screen.getByLabelText('Kata Sandi'), 'benar')
    await userEvent.click(screen.getByRole('button', { name: 'Masuk' }))
    expect(await screen.findByTestId('lokasi')).toHaveTextContent('/percakapan?hal=2')
  })

  it('mengabaikan next yang mengarah ke situs lain', async () => {
    fetchSession.mockResolvedValue(admin)
    renderLogin('/masuk?next=%2F%2Fevil.example')
    expect(await screen.findByTestId('lokasi')).toHaveTextContent('/')
    expect(screen.getByTestId('lokasi')).not.toHaveTextContent('evil')
  })

  it('pengguna yang sudah masuk tidak melihat form', async () => {
    fetchSession.mockResolvedValue(admin)
    renderLogin()
    expect(await screen.findByTestId('lokasi')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Masuk' })).not.toBeInTheDocument()
  })

  it('mode sso tidak punya form login lokal', async () => {
    vi.stubEnv('VITE_AUTH_MODE', 'sso')
    vi.stubEnv('VITE_SSO_LOGIN_URL', 'https://sso.example.com/login')
    renderLogin()
    expect(await screen.findByTestId('lokasi')).toHaveTextContent('/')
    expect(screen.queryByLabelText('NIP')).not.toBeInTheDocument()
  })
})
