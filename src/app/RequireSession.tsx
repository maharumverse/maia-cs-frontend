import { useEffect, useMemo, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ErrorGate, Gate } from '@/components/Gate'
import { userMessage } from '@/api/errors'
import { getConfig } from '@/config'
import { hardRedirect } from '@/lib/redirect'
import { clearSsoRedirectMark, isSsoRedirectLoop, markSsoRedirect } from '@/lib/ssoLoop'
import { loginPathFor, safeReturnPath, ssoLoginUrlFor } from '@/lib/returnUrl'
import { useLogout, useSession } from '@/app/session'

// Guard rute. Rute tetap di balik gate selama GET auth/me belum selesai
// (refresh.component.md), dan pengalihan baru diputuskan setelah hasilnya pasti.
export function RequireSession() {
  const session = useSession()
  const location = useLocation()
  const logout = useLogout()
  const config = useMemo(() => getConfig(), [])

  const returnPath = safeReturnPath(
    `${location.pathname}${location.search}${location.hash}`,
    window.location.origin,
  )
  const ssoRedirectUrl =
    session.status === 'anonymous' && config.authMode === 'sso' && config.ssoLoginUrl
      ? ssoLoginUrlFor(config.ssoLoginUrl, returnPath, window.location.origin)
      : null

  // Diputuskan sekali saat guard dipasang: halaman ini dimuat tak lama setelah pengalihan SSO.
  const [recentSsoRedirect] = useState(() => isSsoRedirectLoop())
  const ssoLoop = ssoRedirectUrl !== null && recentSsoRedirect

  useEffect(() => {
    if (session.status === 'authenticated') clearSsoRedirectMark()
  }, [session.status])

  useEffect(() => {
    if (ssoRedirectUrl && !ssoLoop) {
      markSsoRedirect()
      hardRedirect(ssoRedirectUrl)
    }
  }, [ssoRedirectUrl, ssoLoop])

  if (session.status === 'loading') return <Gate label="Memeriksa sesi..." />

  if (session.status === 'error') {
    return (
      <ErrorGate
        message={userMessage(session.error)}
        action={
          <button type="button" className="btn pri" onClick={session.retry}>
            Coba Lagi
          </button>
        }
      />
    )
  }

  if (session.status === 'anonymous') {
    if (ssoRedirectUrl && ssoLoop) {
      return (
        <ErrorGate
          message="Sesi dari SSO tidak terbaca oleh MAIA CS. Hubungi admin sistem bila ini berulang."
          action={
            <button
              type="button"
              className="btn pri"
              onClick={() => {
                clearSsoRedirectMark()
                hardRedirect(ssoRedirectUrl)
              }}
            >
              Masuk Ulang
            </button>
          }
        />
      )
    }
    if (ssoRedirectUrl) return <Gate label="Mengalihkan ke halaman masuk..." />
    return <Navigate to={loginPathFor(returnPath)} replace />
  }

  if (!session.identity.is_admin) {
    return (
      <ErrorGate
        message="Akun Anda belum diberi akses ke MAIA CS. Hubungi admin sistem."
        action={
          <button
            type="button"
            className="btn"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            Keluar
          </button>
        }
      />
    )
  }

  return <Outlet context={session.identity} />
}
