import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { X, Binary } from 'lucide-react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { cn } from '../../lib/cn'

const mobileNav = [
  { to: '/', label: '首页概览', end: true },
  { to: '/capture', label: '流量捕获' },
  { to: '/payloads', label: '载荷提取' },
  { to: '/protocols', label: '协议分析' },
  { to: '/stats', label: '数据统计' },
  { to: '/alerts', label: '告警管理' },
  { to: '/settings', label: '系统配置' },
  { to: '/logs', label: '日志管理' },
  { to: '/help', label: '帮助文档' },
]

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="bg-mesh min-h-screen text-ink-900">
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
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-600">
                  <Binary className="h-4 w-4 text-white" />
                </div>
                <span className="text-base font-semibold">载荷提取系统</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-1 px-3">
              {mobileNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'block rounded-2xl px-3.5 py-2.5 text-[13px] font-medium',
                      isActive ? 'nav-active' : 'text-white/60 hover:bg-white/5',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-screen flex-1 flex-col lg:pl-[232px]">
        <Header onMenu={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-7 lg:px-8">
          <Outlet />
        </main>
        <footer className="px-6 py-4 text-center text-[11px] text-muted/80">
          Copyright © 2025 基于Python的流量应用载荷提取系统 · 毕业设计演示
        </footer>
      </div>
    </div>
  )
}
