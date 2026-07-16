import { Suspense, useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { X } from 'lucide-react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { PageLoading } from '../ui/Loading'
import { BrandMark } from '../BrandMark'
import { SidebarNavigation } from './SidebarNavigation'

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
          <aside className="sidebar-shell absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col text-white shadow-2xl">
            <div className="relative z-10 flex items-center justify-between border-b border-white/[0.055] px-4 py-4">
              <div className="flex items-center gap-3">
                <BrandMark />
                <div>
                  <p className="text-base font-semibold tracking-tight">PayloadX</p>
                  <p className="font-mono text-[9px] tracking-[0.14em] text-white/35">NETWORK FORENSICS</p>
                </div>
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
            <SidebarNavigation onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:pl-[244px]">
        <Header onMenu={() => setMobileOpen(true)} />
        <main className="min-w-0 flex-1 px-4 py-5 sm:px-7 sm:py-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1680px]">
            <Suspense fallback={<PageLoading />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
        <footer className="px-6 py-4 text-center text-[11px] text-muted/80">
          PayloadX · LOCAL EVIDENCE WORKSPACE · {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  )
}
