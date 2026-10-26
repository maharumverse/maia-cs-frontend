import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { IconEye, IconEyeOff, IconLogin } from '@tabler/icons-react'
import { login } from '@/api/auth'
import { SESSION_KEY } from '@/api/client'
import { Gate } from '@/components/Gate'
import { ButtonSpinner } from '@/components/Spinner'
import { APP_NAME } from '@/constants'
import { getConfig } from '@/config'
import { loginErrorMessage } from '@/pages/loginErrors'
import { safeReturnPath } from '@/lib/returnUrl'
import { useSession } from '@/app/session'

const loginSchema = z.object({
  nip: z.string().trim().min(1, 'NIP wajib diisi.').max(32, 'NIP terlalu panjang.'),
  // Kata sandi tidak pernah di-trim.
  password: z.string().min(1, 'Kata sandi wajib diisi.').max(256, 'Kata sandi terlalu panjang.'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const config = getConfig()
  const session = useSession()
  const queryClient = useQueryClient()
  const [params] = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const { register, handleSubmit, setValue } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { nip: '', password: '' },
  })

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (identity) => queryClient.setQueryData(SESSION_KEY, identity),
    onError: (error) => {
      setFormError(loginErrorMessage(error))
      // NIP tetap, kata sandi dikosongkan supaya mengulang cukup satu kolom.
      setValue('password', '')
    },
  })

  // Mode SSO tidak punya form login lokal: guard mengalihkan ke halaman SSO bersama.
  if (config.authMode === 'sso') return <Navigate to="/" replace />
  if (session.status === 'loading') return <Gate label="Memeriksa sesi..." />
  if (session.status === 'authenticated') {
    return <Navigate to={safeReturnPath(params.get('next'), window.location.origin)} replace />
  }

  const busy = mutation.isPending
  const passwordLabel = showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'

  return (
    <div className="login-wrap">
      <form
        className="login-card"
        noValidate
        onSubmit={(event) => {
          setFormError(null)
          void handleSubmit(
            (values) => mutation.mutate(values),
            (errors) => setFormError(errors.nip?.message ?? errors.password?.message ?? null),
          )(event)
        }}
      >
        <div className="lg">
          <img src="/maharum-circle.png" alt="" width={44} height={44} />
          <div>
            <div className="nm">{APP_NAME}</div>
            <div className="by">by Maharum Group</div>
          </div>
        </div>
        <h1>Masuk</h1>
        <p className="sub">Gunakan NIP pegawai untuk mengakses {APP_NAME}.</p>
        {formError && (
          <div className="login-err" role="alert">
            {formError}
          </div>
        )}
        <div className="field">
          <label htmlFor="nip">NIP</label>
          <input
            id="nip"
            type="text"
            inputMode="numeric"
            autoComplete="username"
            placeholder="Contoh: 20230101"
            required
            {...register('nip')}
          />
        </div>
        <div className="field">
          <label htmlFor="password">Kata Sandi</label>
          <div className="pwd-wrap">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Masukkan kata sandi"
              required
              {...register('password')}
            />
            <button
              type="button"
              className="pwd-toggle"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={passwordLabel}
              title={passwordLabel}
            >
              {showPassword ? (
                <IconEyeOff size={16} aria-hidden="true" />
              ) : (
                <IconEye size={16} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
        <button
          className="btn pri"
          type="submit"
          disabled={busy}
          style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
        >
          {busy ? (
            <>
              <ButtonSpinner /> Memproses...
            </>
          ) : (
            <>
              <IconLogin size={16} aria-hidden="true" /> Masuk
            </>
          )}
        </button>
        <p className="hint" style={{ marginTop: 14, textAlign: 'center' }}>
          Pakai NIP dan kata sandi yang diberikan admin sistem.
        </p>
      </form>
    </div>
  )
}
