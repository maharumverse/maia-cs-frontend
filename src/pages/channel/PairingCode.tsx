import { useId, useState } from 'react'
import { IconKey } from '@tabler/icons-react'
import { getHttp } from '@/api/client'
import { ButtonSpinner } from '@/components/Spinner'
import { baileysMessage, BAILEYS_PATH } from './api'
import { normalizePhone, pairingPhoneError } from './model'

// Kode pairing hanya hidup di state komponen ini dan hilang saat panel ditutup. Sengaja bukan
// useMutation/useQuery supaya kode tidak tertinggal di cache. Nomor dan kode tidak pernah dicatat.
export function PairingPanel() {
  const id = useId()
  const [phone, setPhone] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [requestError, setRequestError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)
  const [code, setCode] = useState<string | null>(null)

  async function request() {
    const digits = normalizePhone(phone)
    const problem = pairingPhoneError(digits)
    setFieldError(problem)
    setRequestError(null)
    if (problem) return
    setBusy(true)
    setCode(null)
    try {
      const response = await getHttp().post<{ code: string }>(`${BAILEYS_PATH}/pairing-code`, { phone: digits })
      setCode(response.data.code)
    } catch (error) {
      setRequestError(error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="ch-sub-body">
      <div className="field">
        <label htmlFor={`${id}-phone`}>Nomor WhatsApp</label>
        <div className="ch-add-row">
          <input
            id={`${id}-phone`}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="628123456789"
            value={phone}
            aria-invalid={fieldError ? true : undefined}
            aria-describedby={`${id}-hint`}
            onChange={(event) => {
              setPhone(event.target.value)
              setFieldError(null)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void request()
              }
            }}
          />
          <button type="button" className="btn out" onClick={() => void request()} disabled={busy}>
            {busy ? <ButtonSpinner /> : <IconKey size={16} aria-hidden="true" />}
            {busy ? 'Memproses...' : 'Buat Kode'}
          </button>
        </div>
        <p id={`${id}-hint`} className="hint">
          Nomor yang akan ditautkan, digit saja dengan kode negara. Lalu di WhatsApp pilih Tautkan dengan nomor telepon dan masukkan kode.
        </p>
        {fieldError ? (
          <p className="hint ch-err" role="alert">
            {fieldError}
          </p>
        ) : null}
      </div>
      {requestError ? (
        <div className="notice bad" role="alert">
          <span>{baileysMessage(requestError)}</span>
        </div>
      ) : null}
      {code ? (
        <div className="ch-code-box" role="status">
          <p className="ch-code">{code}</p>
          <p className="hint">Kode ini memberi akses ke akun WhatsApp. Jangan bagikan ke siapa pun, dan hanya masukkan di ponsel yang Anda kuasai.</p>
        </div>
      ) : null}
    </div>
  )
}
