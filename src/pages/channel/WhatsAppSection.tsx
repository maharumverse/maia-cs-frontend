import { useId } from 'react'
import { ListEditor } from './ListEditor'
import { MAX_NUMBERS, normalizePhone, phoneError } from './model'
import { NumberField } from './NumberField'
import { OperatingHoursEditor } from './OperatingHoursEditor'
import { Switch } from './Switch'
import type { WhatsAppConfig } from './types'

interface WhatsAppSectionProps {
  value: WhatsAppConfig
  onChange: (value: WhatsAppConfig) => void
}

export function WhatsAppSection({ value, onChange }: WhatsAppSectionProps) {
  const id = useId()
  const patch = (change: Partial<WhatsAppConfig>) => onChange({ ...value, ...change })
  const allowlist = value.allowlist ?? []

  return (
    <section className="card" aria-labelledby="ch-wa-title">
      <h2 id="ch-wa-title">Pengaturan WhatsApp</h2>

      <div className="ch-group">
        <h3>Umum</h3>
        <div className="field">
          <label htmlFor={`${id}-provider`}>Provider</label>
          <select id={`${id}-provider`} value={value.provider} onChange={(event) => patch({ provider: event.target.value === 'baileys' ? 'baileys' : 'meta' })}>
            <option value="meta">Meta (WhatsApp Cloud API)</option>
            <option value="baileys">Baileys</option>
          </select>
          <p className="hint">Hanya satu provider yang aktif pada satu waktu.</p>
        </div>
        {value.provider === 'baileys' ? (
          <div className="notice warn">
            <span>Baileys adalah library tidak resmi, dan nomor yang dipakai bisa diblokir WhatsApp. Meta disarankan untuk produksi.</span>
          </div>
        ) : null}
        <Switch label="Bot Aktif" checked={value.bot_enabled} onChange={(bot_enabled) => patch({ bot_enabled })} hint="Bila mati, bot tidak membalas pesan WhatsApp apa pun." />
      </div>

      <div className="ch-group">
        <h3>Mode Uji dan Daftar Nomor</h3>
        <Switch label="Mode Uji" checked={value.test_mode} onChange={(test_mode) => patch({ test_mode })} hint="Saat aktif, bot hanya membalas nomor di allowlist." />
        {value.test_mode ? (
          <div className="notice info">
            <span>Bot hanya menjawab nomor di allowlist.</span>
            {allowlist.length === 0 ? <span>Allowlist masih kosong, jadi bot belum menjawab siapa pun.</span> : null}
          </div>
        ) : null}
        <div className="grid-2">
          <ListEditor
            label="Allowlist"
            addLabel="Tambah ke Allowlist"
            items={allowlist}
            onChange={(allowlist) => patch({ allowlist })}
            normalize={normalizePhone}
            validate={phoneError}
            max={MAX_NUMBERS}
            inputMode="numeric"
            placeholder="628123456789"
            emptyText="Belum ada nomor."
            hint="Nomor yang dijawab saat Mode Uji aktif. Digit saja dengan kode negara, tanpa plus."
          />
          <ListEditor
            label="Blocklist"
            addLabel="Tambah ke Blocklist"
            items={value.blocklist ?? []}
            onChange={(blocklist) => patch({ blocklist })}
            normalize={normalizePhone}
            validate={phoneError}
            max={MAX_NUMBERS}
            inputMode="numeric"
            placeholder="628123456789"
            emptyText="Belum ada nomor."
            hint="Nomor yang selalu diabaikan, dalam mode apa pun."
          />
        </div>
      </div>

      <OperatingHoursEditor value={value.operating_hours} onChange={(operating_hours) => patch({ operating_hours })} />

      <div className="ch-group">
        <h3>Perilaku Balasan</h3>
        <Switch label="Tampilkan Sumber Jawaban" checked={value.show_sources} onChange={(show_sources) => patch({ show_sources })} hint="Menambahkan daftar dokumen sumber di akhir jawaban." />
        <div className="grid-2">
          <NumberField
            label="Batas Sesi (Jam)"
            value={value.session_timeout_hours}
            onChange={(session_timeout_hours) => patch({ session_timeout_hours })}
            min={1}
            max={720}
            hint="Percakapan dianggap baru setelah tidak aktif selama ini. 1 sampai 720 jam."
          />
          <NumberField
            label="Jeda Gabung Pesan (Detik)"
            value={value.merge_delay_seconds}
            onChange={(merge_delay_seconds) => patch({ merge_delay_seconds })}
            min={0}
            max={30}
            hint="Pesan beruntun dalam jeda ini digabung jadi satu pertanyaan. 0 sampai 30 detik."
          />
        </div>
        <div className="field">
          <label htmlFor={`${id}-nontext`}>Balasan untuk Pesan Non-Teks</label>
          <textarea id={`${id}-nontext`} className="inp" maxLength={2000} value={value.non_text_reply} onChange={(event) => patch({ non_text_reply: event.target.value })} />
          <p className="hint">Dikirim saat pengguna mengirim gambar, suara, atau berkas.</p>
        </div>
        <Switch
          label="Abaikan Grup"
          checked={value.ignore_groups}
          onChange={(ignore_groups) => patch({ ignore_groups })}
          hint="Jalur Baileys tidak pernah meneruskan pesan grup ke bot, apa pun pengaturan ini."
        />
      </div>

      <div className="ch-group">
        <h3>Meta Cloud API</h3>
        <div className="grid-2">
          <div className="field">
            <label htmlFor={`${id}-phone-id`}>Phone Number ID</label>
            <input id={`${id}-phone-id`} type="text" maxLength={64} autoComplete="off" value={value.phone_number_id} onChange={(event) => patch({ phone_number_id: event.target.value.trim() })} />
          </div>
          <div className="field">
            <label htmlFor={`${id}-waba`}>WABA ID</label>
            <input id={`${id}-waba`} type="text" maxLength={64} autoComplete="off" value={value.waba_id} onChange={(event) => patch({ waba_id: event.target.value.trim() })} />
          </div>
        </div>
        <div className="field">
          <label htmlFor={`${id}-graph`}>Versi Graph API</label>
          <input id={`${id}-graph`} type="text" maxLength={20} autoComplete="off" value={value.graph_api_version} onChange={(event) => patch({ graph_api_version: event.target.value.trim() })} />
          <p className="hint">Berbentuk v21.0. Token dan secret Meta diatur di environment backend, bukan di sini.</p>
        </div>
      </div>
    </section>
  )
}
