import { useQuery } from '@tanstack/react-query'
import { IconChartLine, IconMoodSmile, IconRefresh } from '@tabler/icons-react'
import { getHttp } from '@/api/client'
import type { Schemas } from '@/api/types'
import { Chart } from '@/components/Chart'
import { DataTable, type Column } from '@/components/DataTable'
import { ErrorNotice } from '@/components/ErrorNotice'
import { StatTile, StatTileSkeleton } from '@/components/StatTile'
import { useUrlParams } from '@/hooks/useUrlParams'
import { addDays, formatDate, formatNumber, formatPercent, formatUsd, todayJakarta } from '@/lib/format'
import { CHANNEL_LABELS, fallbackReasonLabel } from '@/lib/labels'
import { ChartCard, ChartCardSkeleton } from './ChartCard'
import './ringkasan.css'

type Summary = Schemas['app__api__v1__dashboard__SummaryOut']
type Timeseries = Schemas['TimeseriesOut']
type Day = Schemas['DayOut']

const URL_DEFAULTS = { dari: '', sampai: '' }
const DEFAULT_DAYS = 30
const MAX_DAYS = 366
const PRESETS = [7, 30, 90] as const
const DAY_MS = 86_400_000
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/

// Rentang dari URL (kosong = 30 hari terakhir sampai hari ini WIB). Mengembalikan pesan bila tidak sah,
// dengan aturan yang sama seperti backend supaya permintaan yang pasti 422 tidak dikirim.
function resolveRange(params: { dari: string; sampai: string }, today: string) {
  const sampai = params.sampai || today
  const dari = params.dari || addDays(sampai, -(DEFAULT_DAYS - 1))
  const parsed = [dari, sampai].map((day) => (ISO_DAY.test(day) ? Date.parse(`${day}T00:00:00Z`) : Number.NaN))
  const [from, until] = parsed
  let error: string | null = null
  if (from === undefined || until === undefined || Number.isNaN(from) || Number.isNaN(until)) error = 'Tanggal tidak valid.'
  else if (from > until) error = 'Tanggal Dari harus sebelum atau sama dengan tanggal Sampai.'
  else if ((until - from) / DAY_MS + 1 > MAX_DAYS) error = `Rentang maksimal ${MAX_DAYS} hari.`
  return { dari, sampai, error }
}

function channelHint(byChannel: Record<string, number>): string | undefined {
  const parts = Object.entries(byChannel)
    .sort((a, b) => b[1] - a[1])
    .map(([channel, count]) => `${CHANNEL_LABELS[channel] ?? channel} ${formatNumber(count)}`)
  return parts.length ? parts.join(' · ') : undefined
}

function peak<T>(items: T[], value: (item: T) => number): T | undefined {
  return items.reduce<T | undefined>((best, item) => (best === undefined || value(item) > value(best) ? item : best), undefined)
}

const dayColumns = <T extends Day>(extra: Column<T>[]): Column<T>[] => [
  { key: 'date', header: 'Tanggal', render: (row) => formatDate(row.date) },
  ...extra,
]

const ACTIVITY_COLUMNS: Column<Day>[] = dayColumns<Day>([
  { key: 'conversations', header: 'Percakapan', numeric: true, render: (row) => formatNumber(row.conversations) },
  { key: 'user_messages', header: 'Pesan Masuk', numeric: true, render: (row) => formatNumber(row.user_messages) },
  { key: 'fallbacks', header: 'Fallback', numeric: true, render: (row) => formatNumber(row.fallbacks) },
])

const COST_COLUMNS: Column<Day>[] = dayColumns<Day>([{ key: 'cost', header: 'Biaya (USD)', numeric: true, render: (row) => formatUsd(row.cost) }])

const REASON_COLUMNS: Column<[string, number]>[] = [
  { key: 'reason', header: 'Alasan', render: ([reason]) => fallbackReasonLabel(reason) },
  { key: 'count', header: 'Jumlah', numeric: true, render: ([, count]) => formatNumber(count) },
]

export default function RingkasanPage() {
  const [params, setParams] = useUrlParams(URL_DEFAULTS)
  const today = todayJakarta()
  const { dari, sampai, error: rangeError } = resolveRange(params, today)
  const valid = rangeError === null

  const summaryQuery = useQuery({
    queryKey: ['dashboard', 'summary', dari, sampai],
    queryFn: async () => (await getHttp().get<Summary>('dashboard/summary', { params: { dari, sampai } })).data,
    enabled: valid,
    placeholderData: (previous) => previous,
  })
  const seriesQuery = useQuery({
    queryKey: ['dashboard', 'timeseries', dari, sampai],
    queryFn: async () => (await getHttp().get<Timeseries>('dashboard/timeseries', { params: { dari, sampai } })).data,
    enabled: valid,
    placeholderData: (previous) => previous,
  })

  const summary = summaryQuery.data
  const days = seriesQuery.data?.items
  const error: unknown = summaryQuery.error ?? seriesQuery.error
  const fetching = summaryQuery.isFetching || seriesQuery.isFetching
  const loadingSummary = valid && summary === undefined && !summaryQuery.error
  const loadingSeries = valid && days === undefined && !seriesQuery.error

  const refetch = () => {
    void Promise.all([summaryQuery.refetch(), seriesQuery.refetch()])
  }

  const applyPreset = (count: number) => {
    // 30 hari adalah bawaan, jadi tidak ditulis ke URL. Akhir rentang bawaannya hari ini.
    if (count === DEFAULT_DAYS) setParams({ dari: '', sampai: '' })
    else setParams({ dari: addDays(today, -(count - 1)), sampai: '' })
  }
  const isPreset = (count: number) => sampai === today && dari === addDays(today, -(count - 1))

  const warning = summary?.cost.warning === true

  return (
    <>
      <header className="pagehead">
        <h1>Ringkasan</h1>
        <p>Angka percakapan, feedback, dan penggunaan bot dalam satu tampilan.</p>
      </header>

      {warning ? (
        <div className="notice warn" role="alert">
          Biaya hari ini sudah mendekati batas harian.
        </div>
      ) : null}
      {error ? <ErrorNotice error={error} onRetry={refetch} /> : null}

      <div className="toolbar">
        <div className="field">
          <label htmlFor="ringkasan-dari">Dari</label>
          <input id="ringkasan-dari" type="date" value={dari} max={sampai} onChange={(event) => setParams({ dari: event.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="ringkasan-sampai">Sampai</label>
          <input id="ringkasan-sampai" type="date" value={sampai} min={dari} onChange={(event) => setParams({ sampai: event.target.value })} />
        </div>
        <div className="range-presets" role="group" aria-label="Rentang cepat">
          {PRESETS.map((count) => (
            <button key={count} type="button" className={'btn sm ' + (isPreset(count) ? 'dark' : 'out')} aria-pressed={isPreset(count)} onClick={() => applyPreset(count)}>
              {count} Hari
            </button>
          ))}
        </div>
        <div className="toolbar-end">
          <button type="button" className="iconbtn" aria-label="Muat ulang" onClick={refetch} disabled={!valid}>
            <IconRefresh size={18} className={fetching ? 'gate-spin' : undefined} aria-hidden="true" />
          </button>
        </div>
      </div>

      {rangeError ? (
        <div className="notice bad range-error" role="alert">
          {rangeError}
        </div>
      ) : null}

      {loadingSummary || loadingSeries ? (
        <div role="status" aria-live="polite" className="sr-only">
          Memuat ringkasan...
        </div>
      ) : null}

      <div className="stat-grid" aria-busy={fetching || undefined}>
        {loadingSummary ? Array.from({ length: 6 }, (_, index) => <StatTileSkeleton key={index} />) : null}
        {summary ? <SummaryTiles summary={summary} /> : null}
      </div>

      {loadingSeries ? <ChartCardSkeleton /> : null}
      {days ? <ActivityCard days={days} /> : null}

      <div className="grid-2">
        {loadingSummary ? <ChartCardSkeleton /> : null}
        {summary ? <ReasonCard summary={summary} /> : null}
        {loadingSeries ? <ChartCardSkeleton /> : null}
        {days ? <CostCard days={days} /> : null}
      </div>
    </>
  )
}

function SummaryTiles({ summary }: { summary: Summary }) {
  const { fallback, feedback, cost } = summary
  const limit = cost.daily_limit
  return (
    <>
      <StatTile label="Percakapan" value={formatNumber(summary.conversations)} hint={channelHint(summary.by_channel)} />
      <StatTile label="Pesan Masuk" value={formatNumber(summary.messages_in)} />
      <StatTile
        label="Tingkat Fallback"
        value={formatPercent(fallback.rate)}
        hint={fallback.rate === null ? 'Belum ada jawaban' : `${formatNumber(fallback.total)} dari ${formatNumber(summary.answers)} jawaban`}
      />
      <StatTile
        label="Kepuasan"
        value={formatPercent(feedback.rate_up)}
        hint={
          feedback.rate_up === null
            ? 'Belum ada penilaian'
            : `${formatNumber(feedback.up)} jempol naik, ${formatNumber(feedback.down)} jempol turun`
        }
      />
      <StatTile label="Biaya Periode" value={formatUsd(cost.total)} hint={`${formatDate(summary.range.dari)} - ${formatDate(summary.range.sampai)}`} />
      <StatTile
        label="Biaya Hari Ini"
        value={formatUsd(cost.today)}
        tone={cost.warning ? 'warn' : undefined}
        hint={
          <>
            {limit === null ? 'Batas harian belum diatur' : `dari batas ${formatUsd(limit)}`}
            {cost.warning ? (
              <>
                {' · '}
                <strong>Mendekati batas</strong>
              </>
            ) : null}
          </>
        }
      />
    </>
  )
}

function ActivityCard({ days }: { days: Day[] }) {
  const top = peak(days, (day) => day.conversations)
  const finding =
    top === undefined || top.conversations === 0
      ? 'Belum ada percakapan pada rentang ini.'
      : `Puncak ${formatNumber(top.conversations)} percakapan pada ${formatDate(top.date)}`
  return (
    <div className="chart-stack">
      <ChartCard
        title="Aktivitas Harian"
        finding={days.length ? finding : undefined}
        empty={days.length ? undefined : { icon: IconChartLine, message: 'Belum ada data pada rentang ini.' }}
        chart={
          <Chart
            type="line"
            ariaLabel="Grafik garis aktivitas harian: percakapan, pesan masuk, dan fallback per hari"
            labels={days.map((day) => formatDate(day.date))}
            datasets={[
              { label: 'Percakapan', data: days.map((day) => day.conversations) },
              { label: 'Pesan Masuk', data: days.map((day) => day.user_messages) },
              { label: 'Fallback', data: days.map((day) => day.fallbacks) },
            ]}
          />
        }
        table={<DataTable caption="Tabel aktivitas harian" columns={ACTIVITY_COLUMNS} rows={days} rowKey={(day) => day.date} loading={false} emptyMessage="Belum ada data pada rentang ini." />}
      />
    </div>
  )
}

function ReasonCard({ summary }: { summary: Summary }) {
  const reasons = Object.entries(summary.fallback.by_reason)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1] || fallbackReasonLabel(a[0]).localeCompare(fallbackReasonLabel(b[0]), 'id'))
  const top = reasons[0]
  return (
    <ChartCard
      title="Alasan Fallback"
      finding={top ? `Fallback terbanyak: ${fallbackReasonLabel(top[0])} (${formatNumber(top[1])} dari ${formatNumber(summary.fallback.total)})` : undefined}
      empty={top ? undefined : { icon: IconMoodSmile, message: 'Tidak ada fallback pada rentang ini.' }}
      chart={
        <Chart
          type="bar"
          horizontal
          ariaLabel="Grafik batang alasan fallback, terbanyak di atas"
          labels={reasons.map(([reason]) => fallbackReasonLabel(reason))}
          datasets={[{ label: 'Fallback', data: reasons.map(([, count]) => count) }]}
        />
      }
      table={<DataTable caption="Tabel alasan fallback" columns={REASON_COLUMNS} rows={reasons} rowKey={([reason]) => reason} loading={false} emptyMessage="Tidak ada fallback pada rentang ini." />}
    />
  )
}

function CostCard({ days }: { days: Day[] }) {
  const top = peak(days, (day) => Number(day.cost))
  const finding =
    top === undefined || Number(top.cost) === 0
      ? 'Belum ada biaya pada rentang ini.'
      : `Biaya tertinggi ${formatUsd(top.cost)} pada ${formatDate(top.date)}`
  return (
    <ChartCard
      title="Biaya Harian"
      finding={days.length ? finding : undefined}
      empty={days.length ? undefined : { icon: IconChartLine, message: 'Belum ada data pada rentang ini.' }}
      chart={
        <Chart
          type="bar"
          ariaLabel="Grafik batang biaya harian dalam dolar AS"
          labels={days.map((day) => formatDate(day.date))}
          datasets={[{ label: 'Biaya (USD)', data: days.map((day) => Number(day.cost)) }]}
          formatValue={formatUsd}
        />
      }
      table={<DataTable caption="Tabel biaya harian" columns={COST_COLUMNS} rows={days} rowKey={(day) => day.date} loading={false} emptyMessage="Belum ada data pada rentang ini." />}
    />
  )
}
