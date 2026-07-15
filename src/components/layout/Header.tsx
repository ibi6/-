import { useEffect, useState } from 'react'
import { Bell, Menu } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ThemeSwitcher } from '../ThemeSwitcher'
import { Button } from '../ui/Button'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function formatNow(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function Header({ onMenu }: { onMenu?: () => void }) {
  const [now, setNow] = useState(() => formatNow(new Date()))

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
              className="rounded-xl border border-line bg-white p-2 text-ink-700 shadow-sm lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          ) : null}
          <div>
            <div className="text-[11px] text-muted">基于 Python · 流量应用载荷提取</div>
            <div className="text-sm font-medium text-ink-800">工作台</div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden font-mono text-[12px] text-muted md:block">{now}</span>
          <ThemeSwitcher />
          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white text-ink-500 shadow-sm hover:text-ink-800"
            title="通知"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
          </button>
          <Link to="/capture">
            <Button size="sm" className="rounded-full px-4">
              上传流量
            </Button>
          </Link>
          <div className="hidden items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-3 shadow-sm sm:flex">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-xs font-semibold text-white">
              A
            </div>
            <span className="text-[13px] text-ink-700">admin</span>
          </div>
        </div>
      </div>
    </header>
  )
}
