import { NavLink } from 'react-router-dom'
import { Activity, Binary } from 'lucide-react'
import { cn } from '../../lib/cn'
import { NAV_ITEMS } from '../../config/navigation'

export function Sidebar() {
  return (
    <aside className="sidebar-shell fixed inset-y-0 left-0 z-30 flex w-[232px] flex-col text-white">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="brand-mark flex h-10 w-10 items-center justify-center rounded-2xl">
          <Binary className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="text-[15px] font-semibold tracking-wide text-white">载荷提取系统</div>
          <div className="text-[11px] text-white/40">Payload Extractor</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[13px] font-medium transition-all',
                isActive
                  ? 'nav-active'
                  : 'text-white/55 hover:bg-white/[0.06] hover:text-white/90',
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn(
                    'nav-icon h-[18px] w-[18px]',
                    isActive ? '' : 'text-white/40 group-hover:text-white/70',
                  )}
                />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/[0.06] p-4">
        <div className="rounded-2xl bg-white/[0.05] p-3 ring-1 ring-white/[0.06]">
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
            <span className="text-[11px] text-white/50">解析引擎</span>
            <span className="ml-auto font-mono text-[11px] text-emerald-400">ONLINE</span>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-white/35">
            本地优先 · 开源可部署
          </p>
        </div>
      </div>
    </aside>
  )
}
