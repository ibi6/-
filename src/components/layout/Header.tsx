import { useEffect, useState } from 'react'
import { Menu, ShieldCheck, Upload } from 'lucide-react'
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
    <header className="app-header sticky top-0 z-20">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-7 lg:px-8">
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
          <div className="hidden items-center gap-2 rounded-full border border-line/80 bg-white/65 px-3 py-2 font-mono text-[10px] text-muted lg:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {now}
            <span className="text-ink-400">UTC+8</span>
          </div>
          <ThemeSwitcher />
          <Link to="/capture" className="shrink-0">
            <Button size="sm" className="rounded-full px-3 sm:px-4" aria-label="上传流量">
              <Upload className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">上传流量</span>
            </Button>
          </Link>
          <div className="hidden h-11 items-center gap-2 rounded-full border border-line bg-white/80 px-3 text-[12px] text-ink-600 shadow-sm sm:flex">
            <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            <span>本地模式</span>
          </div>
        </div>
      </div>
    </header>
  )
}
