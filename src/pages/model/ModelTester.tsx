import { IconPlayerPlay } from '@tabler/icons-react'
import { ApiError, userMessage } from '@/api/errors'
import { useModelTest } from '@/api/settings'
import { ButtonSpinner } from '@/components/Spinner'
import { formatNumber, formatUsd } from '@/lib/format'

interface ModelTesterProps {
  model: string
  role: 'utama' | 'cadangan'
}

// Tes satu model lewat POST settings/model-test. Memakai nama yang sedang dipilih (boleh belum
// disimpan) dan tidak menyimpan apa pun. Dipasang dengan key = nama model agar hasil lama hilang
// saat pilihan berganti.
export function ModelTester({ model, role }: ModelTesterProps) {
  const test = useModelTest()
  const result = test.data
  return (
    <div className="tester" role="group" aria-label={`Tes model ${role}`}>
      <span className="tester-name">
        <strong>{role === 'utama' ? 'Model Utama' : 'Model Cadangan'}</strong>: {model}
      </span>
      <button type="button" className="btn out" disabled={test.isPending} onClick={() => test.mutate(model)}>
        {test.isPending ? <ButtonSpinner /> : <IconPlayerPlay size={16} aria-hidden="true" />}
        {test.isPending ? 'Memproses...' : 'Tes Model'}
      </button>
      <div className="tester-result" role="status">
        {result ? (
          <>
            <span className={`tag ${result.ok ? 't-ok' : 't-bad'}`}>{result.ok ? 'Berhasil' : 'Gagal'}</span>
            <span>Latensi {formatNumber(result.latency_ms)} ms</span>
            {result.cost ? <span>Biaya {formatUsd(result.cost)}</span> : null}
          </>
        ) : null}
      </div>
      {test.error ? (
        <div className="notice bad" role="alert" style={{ marginBottom: 0 }}>
          <span className="tag t-bad">Gagal</span>
          <span>{test.error instanceof ApiError ? userMessage(test.error) : 'Tes model gagal dijalankan.'}</span>
        </div>
      ) : null}
    </div>
  )
}
