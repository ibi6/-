import { Activity } from 'lucide-react'
import { BrandMark } from '../BrandMark'
import { SidebarNavigation } from './SidebarNavigation'

export function Sidebar() {
  return (
    <aside className="sidebar-shell fixed inset-y-0 left-0 z-30 flex w-[244px] flex-col text-white">
      <div className="relative z-10 flex items-center gap-3 border-b border-white/[0.055] px-5 py-5">
        <BrandMark />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[17px] font-semibold tracking-tight text-white">PayloadX</span>
            <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono text-[8px] text-white/35">v1.0</span>
          </div>
          <div className="mt-0.5 font-mono text-[9px] tracking-[0.14em] text-white/32">
            NETWORK FORENSICS
          </div>
        </div>
      </div>

      <SidebarNavigation />

      <div className="relative z-10 border-t border-white/[0.055] p-4">
        <div className="rounded-[16px] bg-white/[0.045] p-3 ring-1 ring-white/[0.065] backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[11px] text-white/52">解析引擎</span>
            <span className="ml-auto font-mono text-[9px] tracking-wider text-emerald-300">ONLINE</span>
          </div>
          <div className="mt-2.5 flex items-center gap-2 border-t border-white/[0.05] pt-2.5 text-[10px] text-white/30">
            <Activity className="h-3 w-3 text-[var(--accent-2)]" aria-hidden="true" />
            本地处理 · 数据不出站
          </div>
        </div>
      </div>
    </aside>
  )
}
