import {
  IconBooks,
  IconFlask,
  IconLayoutDashboard,
  IconMessages,
  IconSettings,
  type Icon,
} from '@tabler/icons-react'

export interface Section {
  key: string
  label: string
  to: string
  description: string
}

export interface NavLeaf extends Section {
  kind: 'leaf'
  icon: Icon
  // Hanya untuk rute indeks, supaya "/" tidak aktif di semua halaman.
  end?: boolean
}

export interface NavGroup {
  kind: 'group'
  key: string
  label: string
  icon: Icon
  children: Section[]
}

// Satu sumber untuk sidebar, rute, dan halaman placeholder. Dua level saja dan ikon hanya
// di baris induk (sidebar.component.md, dropdown.component.md).
export const NAV: Array<NavLeaf | NavGroup> = [
  {
    kind: 'leaf',
    key: 'ringkasan',
    label: 'Ringkasan',
    to: '/',
    end: true,
    icon: IconLayoutDashboard,
    description: 'Angka percakapan, feedback, dan penggunaan bot dalam satu tampilan.',
  },
  {
    kind: 'leaf',
    key: 'knowledge',
    label: 'Knowledge',
    to: '/knowledge',
    icon: IconBooks,
    description: 'Dokumen sumber jawaban bot: unggah, aktifkan, dan proses ulang.',
  },
  {
    kind: 'leaf',
    key: 'percakapan',
    label: 'Percakapan',
    to: '/percakapan',
    icon: IconMessages,
    description: 'Riwayat percakapan dari semua channel beserta sitasi jawabannya.',
  },
  {
    kind: 'group',
    key: 'pengaturan',
    label: 'Pengaturan',
    icon: IconSettings,
    children: [
      {
        key: 'pengaturan-bot',
        label: 'Pengaturan Bot',
        to: '/pengaturan-bot',
        description: 'Perilaku bot: system prompt, pesan pembuka, pesan fallback, dan mode konteks.',
      },
      {
        key: 'model',
        label: 'Model',
        to: '/model',
        description: 'Model utama dan model fallback beserta parameternya.',
      },
      {
        key: 'limit',
        label: 'Limit',
        to: '/limit',
        description: 'Batas pesan, rate limit, dan batas biaya harian per channel.',
      },
      {
        key: 'channel',
        label: 'Channel',
        to: '/channel',
        description: 'Web widget dan WhatsApp: pengaturan, status koneksi, dan pairing.',
      },
    ],
  },
  {
    kind: 'leaf',
    key: 'playground',
    label: 'Playground',
    to: '/playground',
    icon: IconFlask,
    description: 'Uji jawaban bot dari dashboard sebelum pengaturan disimpan.',
  },
]

export const SECTIONS: Section[] = NAV.flatMap((item) => (item.kind === 'group' ? item.children : [item]))

export function findSection(key: string): Section {
  const section = SECTIONS.find((s) => s.key === key)
  if (!section) throw new Error(`Bagian tidak dikenal: ${key}`)
  return section
}

// Remah roti untuk topbar: judul grup (kalau ada) lalu judul halaman.
export function crumbsFor(pathname: string): string[] {
  for (const item of NAV) {
    if (item.kind === 'leaf') {
      if (item.to === pathname) return [item.label]
      // Halaman rincian di bawah satu bagian, mis. /percakapan/:id.
      if (item.to !== '/' && pathname.startsWith(item.to + '/')) return [item.label, 'Rincian']
    } else {
      const child = item.children.find((c) => c.to === pathname)
      if (child) return [item.label, child.label]
    }
  }
  return ['Halaman Tidak Ditemukan']
}
