import { Suspense, useEffect, useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { X, Binary } from 'lucide-react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { cn } from '../../lib/cn'
import { NAV_ITEMS } from '../../config/navigation'
import { PageLoading } from '../ui/Loading'

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!mobileOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [mobileOpen])

  return (
    <div className="bg-mesh min-h-screen overflow-x-clip text-ink-900">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink-950/45"
            aria-label="关闭菜单"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="sidebar-shell absolute inset-y-0 left-0 flex w-72 flex-col text-white shadow-2xl">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-2">
                <div className="brand-mark flex h-10 w-10 items-center justify-center rounded-xl">
                  <Binary className="h-4 w-4 text-white" />
                </div>
                <span className="text-base font-semibold">载荷提取系统</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="focus-ring flex h-11 w-11 items-center justify-center rounded-xl hover:bg-white/10"
                aria-label="关闭主导航"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-1 px-3">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-11 items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[13px] font-medium',
                      isActive ? 'nav-active' : 'text-white/60 hover:bg-white/5',
                    )
                  }
                >
                  <item.icon className="nav-icon h-[18px] w-[18px]" aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:pl-[232px]">
        <Header onMenu={() => setMobileOpen(true)} />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-7 lg:px-8">
          <Suspense fallback={<PageLoading />}>
            <Outlet />
          </Suspense>
        </main>
        <footer className="px-6 py-4 text-center text-[11px] text-muted/80">
          Copyright © {new Date().getFullYear()} PayloadX · 流量应用载荷提取系统
        </footer>
      </div>
    </div>
  )
}
