import { useEffect, useState } from 'react'
import { Bell, Menu, Upload } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { ThemeSwitcher } from '../ThemeSwitcher'
import { Button } from '../ui/Button'
import { getRouteMeta } from '../../config/navigation'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function formatNow(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function Header({ onMenu }: { onMenu?: () => void }) {
  const [now, setNow] = useState(() => formatNow(new Date()))
  const { pathname } = useLocation()
  const meta = getRouteMeta(pathname)

  useEffect(() => {
    const t = setInterval(() => setNow(formatNow(new Date())), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <header className="sticky top-0 z-20 border-b border-black/[0.04] bg-[#f6f8f7]/85 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-7">
        <div className="flex items-center gap-3">
          {onMenu ? (
            <button
              type="button"
              onClick={onMenu}
              className="focus-ring flex h-11 w-11 items-center justify-center rounded-2xl border border-line bg-white text-ink-700 shadow-sm lg:hidden"
              aria-label="打开主导航"
            >
              <Menu className="h-5 w-5" />
            </button>
          ) : null}
          <div>
            <div className="text-[11px] text-muted">{meta.eyebrow}</div>
            <div className="text-sm font-semibold text-ink-800">{meta.title}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden font-mono text-[12px] text-muted md:block">{now}</span>
          <ThemeSwitcher />
          <button
            type="button"
            className="focus-ring relative hidden h-11 w-11 items-center justify-center rounded-2xl border border-line bg-white text-ink-500 shadow-sm hover:-translate-y-0.5 hover:text-ink-800 sm:flex"
            aria-label="查看通知（1 条未读）"
            title="通知"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
          </button>
          <Link to="/capture" className="shrink-0">
            <Button size="sm" className="rounded-full px-3 sm:px-4" aria-label="上传流量">
              <Upload className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">上传流量</span>
            </Button>
          </Link>
          <div className="hidden items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-3 shadow-sm sm:flex">
            <div className="brand-avatar flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold">
              A
            </div>
            <span className="text-[13px] text-ink-700">admin</span>
          </div>
        </div>
      </div>
    </header>
  )
}
