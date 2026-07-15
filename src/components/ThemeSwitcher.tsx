import { useEffect, useRef, useState } from 'react'
import { Check, Palette } from 'lucide-react'
import { useTheme } from '../theme/ThemeContext'
import { cn } from '../lib/cn'
import type { ThemeId } from '../theme/themes'

/** 浅色工作台下的强调色切换 */
export function ThemeSwitcher() {
  const { themeId, themes, setTheme, theme } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 items-center gap-2 rounded-xl border border-line bg-white px-2.5 text-ink-500 shadow-sm transition hover:text-ink-800"
        title="切换强调色"
      >
        <Palette className="h-4 w-4" />
        <span
          className="hidden h-3.5 w-3.5 rounded-full ring-2 ring-black/5 sm:block"
          style={{ background: theme.swatch }}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-2xl border border-line bg-white shadow-xl shadow-black/10">
          <div className="border-b border-black/[0.04] px-3 py-2.5">
            <p className="text-[12px] font-semibold text-ink-900">强调色</p>
            <p className="mt-0.5 text-[11px] text-muted">侧栏高亮与主按钮颜色</p>
          </div>
          <div className="max-h-[280px] overflow-y-auto p-2">
            {themes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTheme(t.id as ThemeId)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition',
                  themeId === t.id ? 'bg-teal-50' : 'hover:bg-ink-50',
                )}
              >
                <span
                  className="h-7 w-7 shrink-0 rounded-lg ring-2 ring-black/5"
                  style={{ background: t.swatch }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-ink-900">{t.name}</p>
                  <p className="truncate text-[11px] text-muted">{t.desc}</p>
                </div>
                {themeId === t.id && <Check className="h-4 w-4 text-teal-600" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function ThemeGrid() {
  const { themeId, themes, setTheme } = useTheme()
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {themes.map((t) => {
        const active = themeId === t.id
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setTheme(t.id)}
            className={cn(
              'flex flex-col items-start rounded-2xl border p-4 text-left transition',
              active
                ? 'border-teal-500 bg-teal-50/60 shadow-[0_0_0_1px_rgba(13,148,136,0.3)]'
                : 'border-line bg-white hover:border-teal-200',
            )}
          >
            <div className="mb-3 flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="h-8 w-8 rounded-lg ring-2 ring-black/5"
                  style={{
                    background: `linear-gradient(135deg, ${t.swatch}, ${t.vars['--accent-deep']})`,
                  }}
                />
                <div>
                  <p className="text-sm font-semibold text-ink-900">{t.name}</p>
                  <p className="text-[11px] text-muted">{t.desc}</p>
                </div>
              </div>
              {active && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-white">
                  <Check className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
