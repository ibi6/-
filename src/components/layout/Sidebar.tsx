import { NavLink } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Binary,
  BookOpen,
  FileText,
  Fingerprint,
  Home,
  Network,
  Radar,
  Settings,
} from 'lucide-react'
import { cn } from '../../lib/cn'

const nav = [
  { to: '/', label: '首页概览', icon: Home, end: true },
  { to: '/capture', label: '流量捕获', icon: Radar },
  { to: '/payloads', label: '载荷提取', icon: Binary },
  { to: '/protocols', label: '协议分析', icon: Network },
  { to: '/stats', label: '数据统计', icon: BarChart3 },
  { to: '/features', label: '特征分析', icon: Fingerprint },
  { to: '/alerts', label: '告警管理', icon: AlertTriangle },
  { to: '/settings', label: '系统配置', icon: Settings },
  { to: '/logs', label: '日志管理', icon: FileText },
  { to: '/help', label: '帮助文档', icon: BookOpen },
]

export function Sidebar() {
  return (
    <aside className="sidebar-shell fixed inset-y-0 left-0 z-30 flex w-[232px] flex-col text-white">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 shadow-lg shadow-teal-900/40">
          <Binary className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="text-[15px] font-semibold tracking-wide text-white">载荷提取系统</div>
          <div className="text-[11px] text-white/40">Payload Extractor</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {nav.map((item) => (
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
                    'h-[18px] w-[18px]',
                    isActive ? 'text-teal-300' : 'text-white/40 group-hover:text-white/70',
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
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[11px] text-white/50">解析引擎</span>
            <span className="ml-auto font-mono text-[11px] text-emerald-400">ONLINE</span>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-white/35">
            毕业设计演示 · Mock 数据
          </p>
        </div>
      </div>
    </aside>
  )
}
