import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { RequireSession } from '@/app/RequireSession'
import { Shell } from '@/app/Shell'
import LoginPage from '@/pages/Login'
import { LOGIN_PATH } from '@/lib/returnUrl'

const Ringkasan = lazy(() => import('@/pages/ringkasan'))
const Knowledge = lazy(() => import('@/pages/knowledge'))
const Percakapan = lazy(() => import('@/pages/percakapan'))
const PercakapanDetail = lazy(() => import('@/pages/percakapan/detail'))
const PengaturanBot = lazy(() => import('@/pages/pengaturan-bot'))
const Model = lazy(() => import('@/pages/model'))
const Limit = lazy(() => import('@/pages/limit'))
const Channel = lazy(() => import('@/pages/channel'))
const Playground = lazy(() => import('@/pages/playground'))
const NotFound = lazy(() => import('@/pages/NotFound'))

// Rute baru ditambahkan di sini pada perubahan yang sama dengan halamannya. Catch-all harus
// terakhir supaya halaman yang lupa didaftarkan tidak diam-diam menjadi redirect (refresh.component.md).
export function App() {
  return (
    <Routes>
      <Route path={LOGIN_PATH} element={<LoginPage />} />
      <Route element={<RequireSession />}>
        <Route element={<Shell />}>
          <Route index element={<Ringkasan />} />
          <Route path="knowledge" element={<Knowledge />} />
          <Route path="percakapan" element={<Percakapan />} />
          <Route path="percakapan/:id" element={<PercakapanDetail />} />
          <Route path="pengaturan-bot" element={<PengaturanBot />} />
          <Route path="model" element={<Model />} />
          <Route path="limit" element={<Limit />} />
          <Route path="channel" element={<Channel />} />
          <Route path="playground" element={<Playground />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  )
}
