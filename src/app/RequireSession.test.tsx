import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, NETWORK_ERROR } from '@/api/errors'
import type { Identity } from '@/api/auth'
import { RequireSession } from '@/app/RequireSession'
import { clearSsoRedirectMark, markSsoRedirect } from '@/lib/ssoLoop'

const { fetchSession, logout } = vi.hoisted(() => ({ fetchSession: vi.fn(), logout: vi.fn() }))
const { hardRedirect } = vi.hoisted(() => ({ hardRedirect: vi.fn() }))

vi.mock('@/api/auth', () => ({ fetchSession, logout, login: vi.fn() }))
vi.mock('@/lib/redirect', () => ({ hardRedirect }))

const admin: Identity = { nip: '20230101', groups: ['admin'], is_admin: true }

function LocationProbe() {
  const location = useLocation()
  return <p data-testid="lokasi">{`${location.pathname}${location.search}`}</p>
}

function renderGuard(initialEntry: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/masuk" element={<LocationProbe />} />
          <Route element={<RequireSession />}>
            <Route path="*" element={<p>Isi halaman terlindungi</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  clearSsoRedirectMark()
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com')
  vi.stubEnv('VITE_AUTH_MODE', 'stopgap')
  vi.stubEnv('VITE_SSO_LOGIN_URL', '')
})

describe('RequireSession', () => {
  it('menahan rute di balik gate selama sesi dicek, tanpa mengalihkan', () => {
    fetchSession.mockReturnValue(new Promise(() => undefined))
    renderGuard('/percakapan')
    expect(screen.getByRole('status')).toHaveTextContent('Memeriksa sesi...')
    expect(screen.queryByText('Isi halaman terlindungi')).not.toBeInTheDocument()
    expect(screen.queryByTestId('lokasi')).not.toBeInTheDocument()
    expect(hardRedirect).not.toHaveBeenCalled()
  })

  it('merender rute bila sesi admin valid', async () => {
    fetchSession.mockResolvedValue(admin)
    renderGuard('/percakapan')
    expect(await screen.findByText('Isi halaman terlindungi')).toBeInTheDocument()
  })

  it('mode stopgap: mengalihkan pengguna anonim ke /masuk dengan halaman asal di next', async () => {
    fetchSession.mockResolvedValue(null)
    renderGuard('/percakapan?hal=2')
    expect(await screen.findByTestId('lokasi')).toHaveTextContent(
      '/masuk?next=%2Fpercakapan%3Fhal%3D2',
    )
  })

  it('mode sso: mengalihkan browser ke halaman SSO bersama dan kembali ke halaman asal', async () => {
    vi.stubEnv('VITE_AUTH_MODE', 'sso')
    vi.stubEnv('VITE_SSO_LOGIN_URL', 'https://sso.example.com/login')
    fetchSession.mockResolvedValue(null)
    renderGuard('/percakapan?hal=2')

    await waitFor(() => expect(hardRedirect).toHaveBeenCalledTimes(1))
    const target = new URL(hardRedirect.mock.calls[0]?.[0] as string)
    expect(target.origin + target.pathname).toBe('https://sso.example.com/login')
    expect(target.searchParams.get('next')).toBe(`${window.location.origin}/percakapan?hal=2`)
    expect(screen.queryByTestId('lokasi')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Mengalihkan ke halaman masuk...')
  })

  it('mode sso: berhenti mengalihkan bila baru saja kembali dari SSO dan sesi tetap kosong', async () => {
    vi.stubEnv('VITE_AUTH_MODE', 'sso')
    vi.stubEnv('VITE_SSO_LOGIN_URL', 'https://sso.example.com/login')
    markSsoRedirect()
    fetchSession.mockResolvedValue(null)
    renderGuard('/')

    expect(await screen.findByRole('alert')).toHaveTextContent('Sesi dari SSO tidak terbaca')
    expect(hardRedirect).not.toHaveBeenCalled()
  })

  it('menolak akun yang bukan admin dan menawarkan keluar', async () => {
    fetchSession.mockResolvedValue({ nip: '20230102', groups: [], is_admin: false })
    logout.mockResolvedValue(undefined)
    renderGuard('/')

    expect(await screen.findByRole('alert')).toHaveTextContent('Akun Anda belum diberi akses')
    expect(screen.queryByText('Isi halaman terlindungi')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Keluar' }))
    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1))
  })

  it('kegagalan selain 401 menampilkan galat dengan tombol coba lagi, bukan pengalihan', async () => {
    fetchSession.mockRejectedValueOnce(new ApiError(0, NETWORK_ERROR, 'Tidak bisa menghubungi server.'))
    renderGuard('/percakapan')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Tidak bisa menghubungi server. Periksa koneksi, lalu coba lagi.',
    )
    expect(screen.queryByTestId('lokasi')).not.toBeInTheDocument()
    expect(hardRedirect).not.toHaveBeenCalled()

    fetchSession.mockResolvedValue(admin)
    await userEvent.click(screen.getByRole('button', { name: 'Coba Lagi' }))
    expect(await screen.findByText('Isi halaman terlindungi')).toBeInTheDocument()
  })
})
