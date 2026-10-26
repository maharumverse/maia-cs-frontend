import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { IconChevronDown, IconChevronRight, IconLogout, IconUser } from '@tabler/icons-react'
import { APP_NAME } from '@/constants'
import { NAV, type NavGroup, type NavLeaf } from '@/app/sections'
import { useLogout } from '@/app/session'
import type { Identity } from '@/api/auth'

interface SidebarProps {
  open: boolean
  identity: Identity
  onNavigate: () => void
}

function linkClass({ isActive }: { isActive: boolean }): string | undefined {
  return isActive ? 'active' : undefined
}

function Leaf({ item, onNavigate }: { item: NavLeaf; onNavigate: () => void }) {
  const Icon = item.icon
  return (
    <NavLink to={item.to} end={item.end} className={linkClass} onClick={onNavigate}>
      <Icon size={18} aria-hidden="true" />
      {item.label}
    </NavLink>
  )
}

// Judul grup adalah label, bukan tujuan: mengkliknya hanya membuka atau menutup grup.
function Group({ item, onNavigate }: { item: NavGroup; onNavigate: () => void }) {
  const { pathname } = useLocation()
  const [userOpen, setUserOpen] = useState(false)
  const hasActiveChild = item.children.some((child) => child.to === pathname)
  const open = userOpen || hasActiveChild
  const Icon = item.icon
  const Chevron = open ? IconChevronDown : IconChevronRight

  return (
    <>
      <button
        type="button"
        className={'navparent' + (hasActiveChild ? ' on' : '')}
        aria-expanded={open}
        aria-controls={`subnav-${item.key}`}
        onClick={() => setUserOpen(!open)}
      >
        <Icon size={18} aria-hidden="true" />
        {item.label}
        <Chevron className="chev" size={15} aria-hidden="true" />
      </button>
      {open && (
        <div className="subnav" id={`subnav-${item.key}`}>
          {item.children.map((child) => (
            <NavLink key={child.key} to={child.to} className={linkClass} onClick={onNavigate}>
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </>
  )
}

export function Sidebar({ open, identity, onNavigate }: SidebarProps) {
  const logout = useLogout()

  return (
    <aside className={'sidebar' + (open ? ' open' : '')} id="sidebar">
      <div className="brand">
        <img className="logo-img" src="/maharum-circle.png" alt="" width={30} height={30} />
        <div>
          <div className="nm">{APP_NAME}</div>
          <div className="sub">by Maharum Group</div>
        </div>
      </div>

      <nav className="nav" aria-label="Navigasi utama">
        {NAV.map((item) =>
          item.kind === 'leaf' ? (
            <Leaf key={item.key} item={item} onNavigate={onNavigate} />
          ) : (
            <Group key={item.key} item={item} onNavigate={onNavigate} />
          ),
        )}
      </nav>

      <div className="navfoot">
        <div className="navfoot-a static">
          <span className="av-sm">
            <IconUser size={16} aria-hidden="true" />
          </span>
          <div>
            <div className="t">{identity.nip}</div>
            <div className="d">NIP, admin</div>
          </div>
        </div>
        <button
          type="button"
          className="keluar"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          <IconLogout size={16} aria-hidden="true" />
          Keluar
        </button>
        {logout.isError && (
          <p className="keluar-err" role="alert">
            Gagal keluar. Coba lagi.
          </p>
        )}
      </div>
    </aside>
  )
}
