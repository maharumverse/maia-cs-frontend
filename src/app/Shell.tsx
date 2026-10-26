import { Suspense, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useOutletContext } from 'react-router-dom'
import { IconMenu2 } from '@tabler/icons-react'
import { PageSkeleton } from '@/components/Skeleton'
import { Sidebar } from '@/app/Sidebar'
import { crumbsFor } from '@/app/sections'
import type { Identity } from '@/api/auth'

// Kerangka halaman: sidebar, topbar, dan area isi. Di bawah 860px sidebar menjadi drawer.
export function Shell() {
  const identity = useOutletContext<Identity>()
  const { pathname } = useLocation()
  // Drawer mencatat path tempat ia dibuka, jadi berpindah rute menutupnya tanpa efek tambahan.
  const [openedAt, setOpenedAt] = useState<string | null>(null)
  const drawerOpen = openedAt === pathname
  const menuButton = useRef<HTMLButtonElement>(null)
  const firstRoute = useRef(true)

  // Halaman baru mulai dari atas. Dilewati pada muat pertama supaya refresh memulihkan posisi gulir.
  useEffect(() => {
    if (firstRoute.current) {
      firstRoute.current = false
      return
    }
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpenedAt(null)
      menuButton.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  useEffect(() => {
    if (drawerOpen) document.querySelector<HTMLElement>('#sidebar a, #sidebar button')?.focus()
  }, [drawerOpen])

  const crumbs = crumbsFor(pathname)

  return (
    <div className="app">
      <Sidebar open={drawerOpen} identity={identity} onNavigate={() => setOpenedAt(null)} />
      <div
        className={'sidebar-backdrop' + (drawerOpen ? ' on' : '')}
        onClick={() => {
          setOpenedAt(null)
          menuButton.current?.focus()
        }}
        aria-hidden="true"
      />
      <div className="main">
        <header className="topbar">
          <button
            ref={menuButton}
            type="button"
            className="menu-btn"
            aria-label="Buka menu"
            aria-controls="sidebar"
            aria-expanded={drawerOpen}
            onClick={() => setOpenedAt(pathname)}
          >
            <IconMenu2 size={18} aria-hidden="true" />
          </button>
          <nav aria-label="Posisi halaman">
            <ol className="crumbs">
              {crumbs.map((crumb, index) => (
                <li key={crumb} aria-current={index === crumbs.length - 1 ? 'page' : undefined}>
                  {crumb}
                </li>
              ))}
            </ol>
          </nav>
        </header>
        <main className="content">
          <div className="page">
            <Suspense fallback={<PageSkeleton label="Memuat halaman..." />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}
